const InviteUsers = require('../models/invite_users')
const Utils = require('./utils')
const crypto = require('crypto');
const config = require('../config/app.config');
const User = require('../models/user');

exports.invites = async (req, res) => {
    const inviteUsers = await InviteUsers.find({userId: req.userId})

    res.json({ok: true, inviteUsers})
}

exports.accept = async (req, res) => {
    const {token} = req.query
    const inviteUser = await InviteUsers.findOne({token})
    if (!inviteUser) {
        return res.redirect(`/invite/status/1`)
    }

    const now = new Date();
    if (now > inviteUser.expiresAt) {
      return res.redirect('/invite/status/2')
    }
    
    inviteUser.token = ''
    inviteUser.status = 'Accepted'
    await inviteUser.save()

    const user = await User.findOne({email: inviteUser.invitedUser})
    if (!user) {
        return res.redirect('/invite/status/3')
    }

    res.redirect(`/congratulations`)
}

exports.sendInvite = async (req, res) => {
    const {invitedUser, permissionType, globalPermission, workspacePermissions} = req.body;
    const existInvite = await InviteUsers.findOne({userId: req.userId, invitedUser})
    if (existInvite) {
        return res.json({ok: false, msg: 'Already exists!'})
    }

    const inviteToken = crypto.randomBytes(20).toString('hex');

    await InviteUsers.create({
        userId: req.userId,
        invitedUser,
        globalPermission,
        workspacePermissions,
        permissionType,
        status: 'Pending',
        token: inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    // send invitation email
    const inviteLink = `${config.SITE_URL}/api/invite/accept?token=${inviteToken}`;
    const user = await User.findById(req.userId)

    await Utils.sendInvitationEmail(invitedUser, inviteLink, user.name || user.email)

    res.json({ok: true})
}

exports.updateInvite = async (req, res) => {
    let {invitedUser, permissionType, globalPermission, workspacePermissions} = req.body;
    
    if (permissionType === 'global') {
        workspacePermissions = {slack:[], ms365:[], google:[]}
    } else {
        globalPermission = ""
    }
    
    await InviteUsers.updateOne({userId: req.userId, invitedUser}, {
        permissionType,
        globalPermission,
        workspacePermissions
    })
    res.json({ok: true})
}

exports.removeInvite = async (req, res) => {
    const {invitedUser} = req.body
    await InviteUsers.deleteOne({userId: req.userId, invitedUser})

    res.json({ok: true})
}