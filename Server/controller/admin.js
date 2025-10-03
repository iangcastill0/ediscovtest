var parser = require('ua-parser-js');
const { Client } = require('square');
const { randomUUID } = require('crypto');
var bcrypt = require ('bcryptjs');
const crypto = require ('crypto');
const config = require("../config/app.config");

const client = new Client({
  accessToken: config.SQUARE_INFO.accessToken,
  environment: config.SQUARE_INFO.environment
});

const SlackTeam = require('../models/slack_team');
const User = require('../models/user');
const UserActions = require('../models/admin/user_actions');
const SubscriptionPlan = require('../models/admin/subscription');
const SlackArchive = require('../models/slack_archive2');
const GmailArchive = require('../models/gmail_archive');
const DriveArchive = require('../models/drive_archive');
const OutlookArchive = require('../models/outlook_archive');
const OneDriveArchive = require('../models/onedrive_archive');
const DropboxArchive = require('../models/dropbox_archive');
const GoogleWorkspace = require('../models/googleworkspaces');
const MS365Workspace = require('../models/ms365workspaces');
const DropboxWorkspace = require('../models/dropboxworkspace');
const SubscriptionHistory = require('../models/subscription_history')
const { validateEmail, validatePassword } = require('../utils');
const Utils = require ('./utils');

exports.getUsers2 = async (req, res) => {
  const users = await User.findAll()

  const result = users?.map(async (user) => {
    // slack workspaces
    const slackWorkspaces = await SlackTeam.find({clientId: user.id})
    user.slackWorkspaceCnt = slackWorkspaces.length
    const ms365Workspaces = await MS365Workspace.find({clientId: user.id})
    user.ms365WoskapceCnt = ms365Workspaces.length
  })
}

exports.userStats = async () => {
  try {
    const users = await User.aggregate([
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

    return users
  } catch (error) {
    throw error
  }
}

exports.getUsers = async (req, res) => {
  try {
    const users = await exports.userStats()
    res.json({ ok: true, data: users });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.addUser = async (req, res) => {
  const { email, name, password, roles } = req.body;

  try {
    // Validate input
    if (!email || !name || !password) {
      return res.status(200).json({ 
        ok: false,
        message: 'Email, name and password are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(200).json({ 
        ok: false,
        message: 'Please enter a valid email address' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(200).json({ 
        ok: false,
        message: 'Password must be at least 8 characters long and contain at least one number and one letter'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ 
        ok: false,
        message: 'User with this email already exists' 
      });
    }

    const mailVerificationToken = crypto.randomBytes (32).toString ('hex');
    const mailVerificationTokenExpires = new Date ();
    mailVerificationTokenExpires.setDate (
      mailVerificationTokenExpires.getDate () + 7
    ); // Token expires in 7 days

    // Create new user
    const newUser = new User({
      email,
      name,
      password: bcrypt.hashSync (password, 8),
      roles: roles || ['customer'], // Default role is customer
      isSuspended: false,
      trialEndDate: Utils.get30DayFreeTrialEndDate (),
      roles: ['customer'],
      isMailVerified: false,
      mailVerificationToken,
      mailVerificationTokenExpires,
      twoStepEmail: true,
      isRegistCompleted: true
    });

    // Save user to database
    await newUser.save();

    const verificationLink = `${req.protocol}://${req.get ('host')}/api/auth/verify-email?token=${mailVerificationToken}`;
    await Utils.sendMailVerification (req.body.email, verificationLink);

    return res.status(200).json({
      ok: true,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      ok: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.logActions = async (req, data) => {
    var ua = parser(req.headers['user-agent']);
    ua.ua = undefined;
    ua.engine = undefined;
    ua.cpu = undefined;
    const user = await User.findOne({_id: req.userId});
    const email = user ? user.email : '';
    await UserActions.create({
        userId: req.userId, email, ipAddress: req.headers['x-real-ip'], deviceInfo: JSON.stringify(ua, null, 2),url: req.originalUrl, ...data
    });
}

exports.getUserActions = async (req, res) => {
    const result = await UserActions.find().sort({ createdAt: -1 }).exec();

    res.json({ok: true, data: result});
}

exports.suspendUser = async (req, res) => {
    const {email} = req.body;
    const user = await User.findOne({email});
    if (!user) {
        return res.json({ok: false, data: "The user doesn't exist."});
    }

    user.isSuspended = true;
    user.save();

    res.json({ok: true});
}

exports.unSuspendUser = async (req, res) => {
    const {email} = req.body;
    const user = await User.findOne({email});
    if (!user) {
        return res.json({ok: false, data: "The user doesn't exist."});
    }

    user.isSuspended = false;
    user.save();

    res.json({ok: true});
}

exports.getPlans = async (req, res) => {
  const plans = await SubscriptionPlan.find({});

  res.json({ok: true, data: plans || []});
}

exports.createPlan = async (req, res) => {
  const {title, description, price, workspaceCount, storageSpace} = req.body;
  try {
    const response = await client.catalogApi.upsertCatalogObject({
      idempotencyKey: randomUUID(),
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#1',
        subscriptionPlanData: {
          name: title,
          allItems: false
        }
      }
    });

    const planId = response.result.catalogObject.id
    await client.catalogApi.upsertCatalogObject({
      idempotencyKey: randomUUID(),
      object: {
        type: 'SUBSCRIPTION_PLAN_VARIATION',
        id: '#1',
        subscriptionPlanVariationData: {
          name: title,
          phases: [
            {
              cadence: 'MONTHLY',
              ordinal: 0,
              pricing: {
                type: 'STATIC',
                priceMoney: {
                  amount: Math.round(price * 100),
                  currency: "USD"
                }
              }
            },
          ],
          subscriptionPlanId: planId
        }
      }
    });
    const resp = await client.catalogApi.retrieveCatalogObject(planId, true);
    // console.log(resp.result.object.subscriptionPlanData);
    // console.log(resp.result.object.subscriptionPlanData.subscriptionPlanVariations);
    const newPlan = await SubscriptionPlan.create({
      planId,
      planVariationId: resp.result.object.subscriptionPlanData.subscriptionPlanVariations[0].id,
      title,
      description,
      price,
      workspaceCount,
      storageSpace
    });

    res.json({ok: true, data: newPlan});

  } catch(error) {
    console.log(error);
    res.json({ok: false, data: error});
  }
}

exports.deletePlan = async (req, res) => {
  const {id} = req.params;
  try {
    const plan = await SubscriptionPlan.findOne({_id: id});
    if (!plan) {
      return res.json({ok: true});
    }

    // const response = await client.catalogApi.deleteCatalogObject(plan.planId);
    // if (response.statusCode !== 200) {
    //   console.log(response)
    //   return res.json({ok: false, data: response.result});
    // }
    await SubscriptionPlan.deleteOne({_id: id});
    res.json({ok: true});
  } catch (error) {
    res.json({ok: false, data: error});
  }
}

exports.billingHistory = async (req, res) => {
  const billingHistories = await SubscriptionHistory.find().sort({createdAt: -1})

  res.json({ok: true, histories: billingHistories || []})
}

exports.statistics = async (req, res) => {
  const totalUsers = await User.find()
  const activeUsers = await User.find({isSuspended: false});
  const suspendedUsers = await User.find({isSuspended: true});
  const subscribedUsers = await User.find({isSubscribed: true});
  const trialUsers = await User.find({isFreeTrial: true})
  const slackArchives = await SlackArchive.find({})
  const gmailArchives = await GmailArchive.find()
  const gDriveArchives = await DriveArchive.find()
  const outlookArchives = await OutlookArchive.find()
  const onedriveArchives = await OneDriveArchive.find()
  const dropboxArchives = await DropboxArchive.find()
  
  const slackWorkspaces = await SlackTeam.find()
  const googleWorkspaces = await GoogleWorkspace.find()
  const ms365Workspaces = await MS365Workspace.find()
  const dropboxWorkspaces = await DropboxWorkspace.find()

  res.json({ok:true, data:{
    activeUsers: activeUsers?.length,
    totalUsers: totalUsers?.length,
    subscribedUsers: subscribedUsers?.length,
    trialUsers: trialUsers?.length,
    suspendedUsers: suspendedUsers?.length,
    slackArchives,
    gmailArchives,
    gDriveArchives,
    outlookArchives,
    onedriveArchives,
    dropboxArchives,
    slackWorkspaces,
    googleWorkspaces,
    ms365Workspaces,
    dropboxWorkspaces,
  }});
  
}