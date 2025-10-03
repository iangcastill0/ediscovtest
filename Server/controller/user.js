const User = require("../models/user");
const admin = require('./admin');
const UserActions = require('../models/admin/user_actions');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const { sendPasswordUpdatedMail, sendUserDeactivatedMail } = require("./utils");
const SubscriptionPlan = require("../models/admin/subscription");
const MS365Workspace = require("../models/ms365workspaces");
const GoogleWorkspace = require("../models/googleworkspaces");
const DropboxWorkspace = require("../models/dropboxworkspace");
const SlackTeam = require("../models/slack_team");

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({_id: req.userId}, req.body);
        admin.logActions(req, {email: user.email, actionType: 'Update Profile', actionDetails:'', actionResult: 'success'});
        res.json({ok: true});
    } catch (error) {
        res.json({ok: false, data: error});
    }
}

exports.changePassword = async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    
    try {
        const user = await User.findOne({
            _id: req.userId
        });
        
        if (!user) {
            return res.json({ok: false, data: "User not found." });
        }
        const passwordIsValid = bcrypt.compareSync(
            oldPassword,
            user.password || ''
        );

        if (!passwordIsValid) {
            admin.logActions(req, {email: user.email, actionType: 'Change Password', actionDetails:'Invalid Password.', actionResult: 'Failed'});
            return res.json({
                ok: false,
                data: "Invalid Password!"
            });
        }
        user.password = bcrypt.hashSync(newPassword, 8),
        await user.save();

        admin.logActions(req, {email: user.email, actionType: 'Change Password', actionDetails:'', actionResult: 'success'});
        //TO-DO send mail of changed password
        await sendPasswordUpdatedMail(user.email, user);
        res.json({ok: true});
    } catch (error) {
        res.json({ok: false, data: error});
    }
}

exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.userId
        });

        if (!user) {
            admin.logActions(req, {email: req.userId, actionType: 'Deactivate account', actionDetails:'User not found.', actionResult: 'failed'});
            return res.json({ok: false, data: "User not found." });
        }
        user.isSuspended = true;
        await user.save();

        admin.logActions(req, {email: user.email, actionType: 'Deactivate account', actionDetails:'', actionResult: 'success'});
        await sendUserDeactivatedMail(user.email, user);
        res.json({ok: true});
    } catch (error) {
        res.json({ok: false, data: error});
    }
}

exports.getUserActions = async (req, res) => {
    const result = await UserActions.find({userId: req.userId}).sort({ createdAt: -1 }).exec();

    res.json({ok: true, data: result});
}

exports.userPlanStats = async userid => {
    try {
      const user = await User.aggregate([
        {
            $match: {
              _id: new mongoose.Types.ObjectId(userid)
            }
        },
        // Slack teams lookup
        {
          $lookup: {
            from: 'slackteams',
            localField: '_id',
            foreignField: 'clientId',
            as: 'teams'
          }
        },
        // MS365 workspaces lookup
        {
          $lookup: {
            from: 'ms365workspaces',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$clientId' },
                      '$$userId'
                    ]
                  }
                }
              }
            ],
            as: 'ms365'
          }
        },
        // Google workspaces lookup
        {
          $lookup: {
            from: 'googleworkspaces',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$clientId' },
                      '$$userId'
                    ]
                  }
                }
              }
            ],
            as: 'google'
          }
        },
        // Dropbox workspaces lookup
        {
          $lookup: {
            from: 'dropboxworkspaces',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$clientId' },
                      '$$userId'
                    ]
                  }
                }
              }
            ],
            as: 'dropbox'
          }
        },
        // Slack archives with size calculation
        {
          $lookup: {
            from: 'slackarchive2',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' }
                }
              }
            ],
            as: 'slackArchivesStats'
          }
        },
        // Outlook archives with size calculation
        {
          $lookup: {
            from: 'outlookarchives',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' },
                  totalCount: { $sum: '$totalCount' }
                }
              }
            ],
            as: 'outlookArchivesStats'
          }
        },
        // OneDrive archives with size calculation
        {
          $lookup: {
            from: 'onedrivearchives',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' }
                }
              }
            ],
            as: 'onedriveArchivesStats'
          }
        },
        // Gmail archives with size calculation
        {
          $lookup: {
            from: 'gmailarchives',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' },
                  totalCount: { $sum: '$totalCount' }
                }
              }
            ],
            as: 'gmailArchivesStats'
          }
        },
        // Google Drive archives with size calculation
        {
          $lookup: {
            from: 'drivearchives',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' }
                }
              }
            ],
            as: 'googledriveArchivesStats'
          }
        },
        // Dropbox archives with size calculation
        {
          $lookup: {
            from: 'dropboxarchives',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$owner' },
                      '$$userId'
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$size' }
                }
              }
            ],
            as: 'dropboxArchivesStats'
          }
        },
        // Subscription info
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'planID',
            foreignField: 'planId',
            as: 'Subscription'
          }
        },
        { $unwind: { path: '$Subscription', preserveNullAndEmptyArrays: true } },
        // Project the final results
        {
          $project: {
            _id: 1,
            email: 1,
            createdAt: 1,
            isSuspended: 1,
            name: 1,
            twoStepEmail: 1,
            isPhoneVerified: 1,
            isMailVerified: 1,
            roles: 1,
            Subscription: 1,
            // Workspace counts
            slackCount: { $size: '$teams' },
            ms365Count: { $size: '$ms365' },
            googleCount: { $size: '$google' },
            dropboxCount: { $size: '$dropbox' },
            // Archive stats
            slackArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$slackArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$slackArchivesStats.totalSize', 0] }, 0] }
            },
            outlookArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$outlookArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$outlookArchivesStats.totalSize', 0] }, 0] },
              totalCount: { $ifNull: [{ $arrayElemAt: ['$outlookArchivesStats.totalCount', 0] }, 0] }
            },
            onedriveArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$onedriveArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$onedriveArchivesStats.totalSize', 0] }, 0] }
            },
            gmailArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$gmailArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$gmailArchivesStats.totalSize', 0] }, 0] },
              totalCount: { $ifNull: [{ $arrayElemAt: ['$gmailArchivesStats.totalCount', 0] }, 0] }
            },
            googledriveArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$googledriveArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$googledriveArchivesStats.totalSize', 0] }, 0] }
            },
            dropboxArchives: {
              count: { $ifNull: [{ $arrayElemAt: ['$dropboxArchivesStats.count', 0] }, 0] },
              totalSize: { $ifNull: [{ $arrayElemAt: ['$dropboxArchivesStats.totalSize', 0] }, 0] }
            }
          }
        }
      ]);
  
      return user
    } catch (error) {
      throw error
    }
}
  
exports.subscriptionPlanStatus = async (req, res) => {
    try {
        const user = await exports.userPlanStats(req.userId)
        res.json({ ok: true, data: user });
    } catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ 
        ok: false, 
        message: 'Internal server error',
        error: error.message 
        });
    }
};

exports.redirect = async (req, res) => {
    const {redirectUri} = req.query

    res.redirect(`/${redirectUri}`)
}

exports.isAdmin = async (userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return false;
  }
  
  if (user.roles.includes('admin') || user.roles.includes('superadmin')) {
    return true;
  }

  return false
}

exports.isFreeTrial = async (userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return false;
  }

  if (user.isFreeTrial && !user.isTrialOver && !user.isSubscribed) 
    return true

  return false
}

exports.isSubscribed = async (userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return false;
  }
  if (exports.isAdmin(userId)) return true

  if (user.isSubscribed) {
    const subscription = await SubscriptionPlan.findOne({planId: user.subscriptionID})
     if (subscription) 
      return true
  }

  return false
}

exports.workspaceLimit = async (userId) => {
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return 0;
  }
  const admin = await exports.isAdmin(userId)
  if (admin) return 9999

  const subscription = await SubscriptionPlan.findOne({planId: user.planID})
  if (subscription) {
    return subscription.workspaceCount
  }

  return 1
}

exports.workspaceCount = async (userId) => {
  let totalCnt = 0
  const slackTeams = await SlackTeam.find({clientId: userId})
  const ms365Workspaces = await MS365Workspace.find({clientId: userId})
  const googleWorkspaces = await GoogleWorkspace.find({clientId: userId})
  const dropboxWorkspaces = await DropboxWorkspace.find({owner: userId})
  if (slackTeams) totalCnt += slackTeams.length
  if (ms365Workspaces) totalCnt += ms365Workspaces.length
  if (googleWorkspaces) totalCnt += googleWorkspaces.length
  if (dropboxWorkspaces) totalCnt += dropboxWorkspaces.length

  return totalCnt
}