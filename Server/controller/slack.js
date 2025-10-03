const { WebClient, retryPolicies } = require('@slack/web-api')
const SlackTeam = require('../models/slack_team')
const SlackMember = require('../models/slack_member')
const Utils = require('./utils')
const client = new WebClient()
const uuid = require('uuid')
const puppeteer = require('puppeteer')
const SlackArchive = require('../models/slack_archive')
const ArchiveLog = require('../models/archive_log')
const ArchiveState = require('../models/archive_state')
const InviteUsers = require('../models/invite_users')
const admin = require('./admin')
const path = require('path')
const config = require('../config/app.config')
const fs = require('fs')
const User = require('../models/user')
const userController = require('./user')

const getClient = token => {
    return new WebClient(token, {
        retryConfig: retryPolicies.rapidRetryPolicy
    })
}

class MyStateStore {
    constructor () {
        this.activeStates = {}
    }
    async generate () {
        const newValue = uuid.v4()
        this.activeStates[newValue] = Date.now() + 10 * 60 * 1000 // 10 minutes
        return newValue
    }
    async validate (state) {
        const expiresAt = this.activeStates[state]
        if (expiresAt && Date.now() <= expiresAt) {
            delete this.activeStates[state]
            return true
        }
        return false
    }
}

const myStateStore = new MyStateStore()

exports.install = async (req, res) => {
    const state = await myStateStore.generate()
    const userId = req.userId

    if (!userId) {
        admin.logActions(req, { actionType: 'Install slack workspace', actionDetails: 'Not authenticated', actionResult: 'Failed' })
        return res.json({ ok: false, data: 'Not authenticated!' })
    }

    // check workspace limit
    if (!userController.isSubscribed(userId) && !userController.isFreeTrial(userId)) {
        return res.redirect('/billing')
    }
    const totalWorkspaceCnt = await userController.workspaceCount(userId)
    const workspaceLimit = await userController.workspaceLimit(userId)
    if (totalWorkspaceCnt >= workspaceLimit) {
        return res.redirect('/billing?status=3')
    }

    const url = `https://slack.com/oauth/v2/authorize?state=${state}|${userId}&client_id=5258767683554.5510301270178&scope=&user_scope=${config.SLACK_APP_INFO.userScope}`
    admin.logActions(req, { actionType: 'Redirect slack workspace', actionDetails: '', actionResult: 'Success' })
    return res.redirect(url)
}

exports.slack_authenticate = async (req, res) => {
    const userId = req.uerId
    if (!userId) {
        res.json({ ok: false, data: 'Not authenticated!' })
    }
    const url = `https://slack.com/oauth/v2/authorize?client_id=5258767683554.5510301270178&scope=&user_scope=${config.SLACK_APP_INFO.userScope}`
    return res.redirect(url)
}

// Create and Save a new Event
exports.oauth_redirect = async (req, res) => {
    const val = res.req.query.state
    const tmp = val.split('|')
    let state = '',
        userId = ''
    if (tmp.length < 2) {
        userId = tmp[0]
    } else {
        state = tmp[0]
        userId = tmp[1]
    }

    const requiredUserScopes = config.SLACK_APP_INFO.userScope.split(',');

    if (state) {
        //case of install
        if (!(await myStateStore.validate(state))) {
            return res.redirect(`/slack/error-installation?type=3`)
        }

        const token = await client.oauth.v2.access({
            client_id: config.SLACK_APP_INFO.clientId,
            client_secret: config.SLACK_APP_INFO.clientSecret,
            code: res.req.query.code
        })  
        console.log(token.authed_user)
        const grantedUserScopes = token.authed_user.scope ? token.authed_user.scope.split(',') : [];
        const missingUserScopes = requiredUserScopes.filter(scope => !grantedUserScopes.includes(scope));
        if (missingUserScopes.length > 0) {
            return res.redirect(`/slack/error-installation?type=7&missing_scopes=${missingUserScopes.join(',')}`);
        }

        let userAccessToken = token.authed_user.access_token

        //check existing workspace when install.
        const existTeam = await SlackTeam.findOne({ team_id: token.team.id })
        if (existTeam) {
            return res.redirect(`/slack/error-installation?type=2&data=${existTeam.name}`)
        }

        const tokenWiredClient = getClient(userAccessToken)
        try {
            const response = await tokenWiredClient.users.list()

            if (response.ok) {
                const users = response.members
                //check if user is admin and owner
                for (const user of users) {
                    if (user.id === token.authed_user.id) {
                        if (!user.is_admin || !user.is_owner || !user.is_primary_owner) {
                            return res.redirect(`/slack/error-installation?type=1&data=${token.team.name}`)
                        }
                    }
                }
                const team = await addTeam(token.team, userAccessToken, userId)
                await addUser(team, userAccessToken, token.authed_user.id, users, userId)
                res.redirect('/slack/team')
                // Process the list of users as needed
            } else {
                return res.redirect(`/slack/error-installation?type=4&data=${token.team.name}`)
            }
        } catch (error) {
            console.error('Error:', error)
            return res.redirect(`/slack/error-installation?type=4&data=${token.team.name}`)
        }
    } else {
        //case of authenticate
        const token = await client.oauth.v2.access({
            client_id: config.SLACK_APP_INFO.clientId,
            client_secret: config.SLACK_APP_INFO.clientSecret,
            code: res.req.query.code
        })
        const grantedUserScopes = token.authed_user.scope ? token.authed_user.scope.split(',') : [];
        const missingUserScopes = requiredUserScopes.filter(scope => !grantedUserScopes.includes(scope));
        if (missingUserScopes.length > 0) {
            return res.redirect(`/slack/error-installation?type=7&data=${missingUserScopes.join(',')}`);
        }

        const member = await SlackMember.findOne({ _id: userId }).populate('team').exec()
        if (member.team.team_id === token.team.id) {
            member.access_token = token.authed_user.access_token
            member.authenticated = true
            await member.save()

            res.redirect('/congratulations')
            return
        }

        return res.redirect(`/slack/error-installation?type=5&data=${member.team.name}`)
    }
}

const updateUsers = async (team, users) => {
    for (let i = 0; i < users.length; i++) {
        const user = users[i]
        if (user['name'] === 'slackbot' || user['is_bot']) continue

        const existUser = await SlackMember.findOne({ team: team._id, user_id: user['id'] })
        if (existUser) {
            existUser.email = user['profile']['email']
            existUser.name = user['name']
            existUser.real_name = user['profile']['real_name']
            existUser.display_name = user['profile']['display_name']
            existUser.tz = user['tz']
            existUser.title = user['profile']['title']
            existUser.phone = user['profile']['phone']
            existUser.avatar = user['profile']['image_48']
            existUser.color = user['color']
            existUser.deleted = user['deleted']
            existUser.is_admin = user['is_admin']
            existUser.is_owner = user['is_owner']
            existUser.is_primary_owner = user['is_primary_owner']
            existUser.is_bot = user.is_bot || user.real_name === 'SLACKBOT'
            existUser.save()
            continue
        }

        const newUser = await SlackMember.create({
            team: team._id,
            user_id: user['id'],
            email: user['profile']['email'],
            name: user['name'],
            real_name: user['profile']['real_name'],
            display_name: user['profile']['display_name'],
            tz: user['tz'],
            title: user['profile']['title'],
            phone: user['profile']['phone'],
            avatar: user['profile']['image_48'],
            color: user['color'],
            deleted: user['deleted'],
            is_admin: user['is_admin'],
            is_owner: user['is_owner'],
            is_primary_owner: user['is_primary_owner'],
            is_bot: user.is_bot || user.real_name === 'SLACKBOT',
            is_authed: true,
            access_token: ''
        })
        team.members.push(newUser._id)
    }

    team.save()
}

exports.teams = async (req, res) => {
    const { includeInvites } = req.query 
    let teams = await SlackTeam.find({ clientId: req.userId }).populate('members').exec()
    admin.logActions(req, { actionType: 'Get teams', actionDetails: '', actionResult: 'Success' })

    // check invitation
    const user = await User.findById(req.userId)
    const invitedTemas = includeInvites == 'false' ? [] : await Utils.invitedWorkspaces(req.userId, 'slack')
    let result = []
    result = result.concat(teams)
    if (invitedTemas && invitedTemas.length > 0) {
        result = result.concat(invitedTemas)
    }
    res.json({ ok: true, data: result })
}

exports.refresh = async (req, res) => {
    const { teamId } = req.params
    const team = await SlackTeam.findOne({ _id: teamId })
    const accessToken = team.accessToken
    console.log('Access Token: ', accessToken)
    if (accessToken == '') {
        return
    }

    const tokenWiredClient = new WebClient(accessToken)
    try {
        const response = await tokenWiredClient.users.list()

        if (response.ok) {
            const users = response.members
            await updateUsers(team, users)
        }
    } catch (error) {
        console.error('CronJob Error:', error)
    }

    res.json({ ok: true, data: team })
}

exports.team = async (req, res) => {
    const team = await SlackTeam.findOne({ _id: req.params.id }).populate('members').exec()

    res.json({ ok: true, data: team })
}

exports.channels = async (req, res) => {
    const team = await SlackTeam.findOne({ _id: req.params.id })
    const accessToken = team.accessToken
    // const member = await SlackMember.findOne({ team: req.params.id, is_admin: true, is_owner: true, is_primary_owner: true });
    if (accessToken == '') {
        admin.logActions(req, {
            actionType: 'Get Slack Channels',
            actionDetails: "You are not administrator of this workspace. You don't have the permission.",
            actionResult: 'Failed'
        })
        return res.json({ ok: false, data: "You are not administrator of this workspace. You don't have the permission." })
    }

    const channels = { public: [], private: [], direct: [], group: [] }
    const tokenWiredClient = getClient(accessToken)
    try {
        const response = await tokenWiredClient.conversations.list({
            types: 'public_channel,private_channel, mpim'
        })

        response.channels.forEach(channel => {
            if (channel.is_private && !channel.is_mpim) {
                channels.private.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                })
            }
            if (!channel.is_private && !channel.is_group && channel.is_channel && !channel.is_im && !channel.is_mpim) {
                channels.public.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                })
            }
            if (channel.is_mpim) {
                channels.group.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                })
            }
        })

        const members = await SlackMember.find({ team: req.params.id, is_bot: false })
        members.forEach(user => {
            channels.direct.push({
                id: user.user_id,
                name: user.name,
                display_name: user.display_name || user.real_name,
                avatar: user.avatar,
                color: user.color,
                email: user.email,
                authenticated: user.access_token === '' ? false : true
            })
        })
        admin.logActions(req, { actionType: 'Get Slack Channels', actionDetails: '', actionResult: 'Success' })
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error(`Error: ${error}`)
        admin.logActions(req, { actionType: 'Get Slack Channels', actionDetails: JSON.stringify(error, null, 2), actionResult: 'Failed' })
        res.json({ ok: false, data: error })
    }
}

exports.getChannels = async (teamId, accessToken) => {
    const channels = { public: [], private: [], direct: [], group: [] };
    const tokenWiredClient = getClient(accessToken);
    try {
        const response = await tokenWiredClient.conversations.list({
            types: 'public_channel,private_channel,im,mpim'
        });

        for (const channel of response.channels) {
            if (channel.is_private && !channel.is_mpim) {
                channels.private.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                });
            }
            if (!channel.is_private && !channel.is_group && channel.is_channel && !channel.is_im && !channel.is_mpim) {
                channels.public.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                });
            }
            if (channel.is_mpim) {
                channels.group.push({
                    id: channel.id,
                    name: channel.name,
                    num_members: channel.num_members,
                    is_active: true
                });
            }
            if (channel.is_im) {
                let directMember = await SlackMember.findOne({ team: teamId, user_id: channel.user });
                if (!directMember) {
                    // Get use info (outside of workspace)
                    const resp = await tokenWiredClient.users.info({user: channel.user})
                    if (resp.ok && resp.user) {
                        const user = resp.user;
                        // Add the user
                        directMember = {
                            team: teamId,
                            user_id: user.id,
                            email: user.profile.email,
                            name: user.name,
                            real_name: user.profile.real_name,
                            display_name: user.profile.display_name,
                            avatar: user.profile.image_48,
                            is_team_user: false,
                            is_bot: user.is_bot,
                            authenticated: false,
                            access_token: ''
                        }
                        await SlackMember.create(directMember)
                    }
                }
                if (!directMember.is_bot) {
                    channels.direct.push({
                        id: channel.id,
                        name: channel.name,
                        user: directMember || channel.user,
                        isUserDeleted: channel.is_user_deleted,
                        updated: channel.updated,
                        is_active: true
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Slack.js getChannels Error: ${error}`);
    }

    return channels
}

exports.channels2 = async (req, res) => {
    const { teamId, userId } = req.params;
    try {
        const member = await SlackMember.findOne({ user_id: userId, team: teamId });
        const accessToken = member && member.access_token;

        if (!accessToken) {
            admin.logActions(req, {
                actionType: 'Get Slack Channels',
                actionDetails: "You are not an administrator of this workspace. You don't have the permission.",
                actionResult: 'Failed'
            });
            return res.json({ ok: false, data: "You are not an administrator of this workspace. You don't have the permission." });
        }

        const channels = await exports.getChannels(teamId, accessToken)
        admin.logActions(req, { actionType: 'Get Slack Channels', actionDetails: '', actionResult: 'Success' });
        return res.json({ ok: true, data: channels });
    } catch (error) {
        console.error(`Error: ${error}`);
        admin.logActions(req, { actionType: 'Get Slack Channels', actionDetails: JSON.stringify(error, null, 2), actionResult: 'Failed' });
        return res.json({ ok: false, data: error });
    }
};


exports.exportAll = async (req, res) => {
    const { teamId, userId } = req.params
    const { startDate, endDate } = req.query

    const member = await SlackMember.findOne({ team: teamId, user_id: userId })
    if (!member) {
        return res.json({ ok: false, data: [] })
    }

    const tokenWiredClient = getClient(member.access_token)

    try {
        const result = await tokenWiredClient.conversations.list({
            types: 'im',
            user: userId
        })
        const data = []
        for (const channel of result.channels) {
            if (channel.user === userId) continue
            const result = await Utils.getConversationHistoryWithThreads({
                client: tokenWiredClient,
                channelId: channel.id,
                startDate,
                endDate,
                token: member.access_token
            })
            data.push({ channel, data: result })
        }

        return res.json({ ok: true, data })
    } catch (error) {
        return res.json({ ok: false, error })
    }
}

exports.getDirectConversationList = async (req, res) => {
    const { userId } = req.params
    const { accessToken } = req.query

    const tokenWiredClient = getClient(accessToken)

    try {
        const result = await tokenWiredClient.conversations.list({
            types: 'im',
            user: userId
        })
        const channels = []
        for (const channel of result.channels) {
            if (channel.user === userId) continue
            const member = await SlackMember.findOne({ user_id: channel.user })
            if (member) {
                if (!member.is_bot) {
                    channels.push({
                        id: channel.id,
                        created: Utils.ts2datetime(channel.created),
                        updated: Utils.ts2datetime(channel.updated),
                        user: member,
                        is_archived: channel.is_active
                    })
                }
            }
        }
        admin.logActions(req, { actionType: 'Get Slack Conversation List', actionDetails: '', actionResult: 'Success' })
        return res.json({ ok: true, data: channels })
    } catch (error) {
        admin.logActions(req, {
            actionType: 'Get Slack Conversation List',
            actionDetails: JSON.stringify(error, null, 2),
            actionResult: 'Failed'
        })
        return res.json({ ok: false, error })
    }
}

exports.emojis = async (req, res) => {
    const team = await SlackTeam.findOne({ _id: req.params.id })
    const accessToken = team.accessToken
    const apiClient = getClient(accessToken)

    try {
        // Fetch custom emojis for the workspace
        const result = await apiClient.emoji.list({ include_categories: true })

        const emojis = result.emoji

        res.json({ ok: true, data: emojis })
    } catch (error) {
        res.json({ ok: false, data: error })
    }
}

exports.members = async (req, res) => {
    const members = await SlackMember.find({ team: req.params.id })
    const result = {}
    for (const member of members) {
        if (!member.is_bot)
            result[member.user_id] = member
    }

    res.json({ ok: true, data: result })
}

exports.realMembers = async (req, res) => {
    let members = await SlackMember.find({ team: req.params.id, is_bot: false, is_team_user: {$ne: false} }).sort({access_token: -1})
    members = members.map((member) => {
        if (member.access_token !== '') {
            member.authenticated = true
        }
        member.access_token = undefined
        return member;
    })
    res.json({ ok: true, data: members || [] })
}


exports.publicChannelExport = async (req, res) => {}

exports.privateChannelExport = async (req, res) => {}

exports.getPublicMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        admin.logActions(req, {
            actionType: 'Get Public Messages',
            actionDetails: `Team doesn't not exist. teamID: ${teamId}`,
            actionResult: 'Failed'
        })
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        admin.logActions(req, {
            actionType: 'Get Public Messages',
            actionDetails: 'You should authenticate first.',
            actionResult: 'Failed'
        })
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const tokenWiredClient = getClient(team.accessToken)
    const result = await Utils.getConversationHistoryWithThreads({
        client: tokenWiredClient,
        channelId,
        startDate,
        endDate,
        token: team.accessToken
    })
    admin.logActions(req, { actionType: 'Get Public Messages', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, result })
}

exports.getChannelMessages2 = async (req, res) => {
    const { teamId, userId, channelId } = req.params
    const { cursor, startDate, endDate } = req.query
    const member = await SlackMember.findOne({ team: teamId, user_id: userId })
    if (!member) {
        admin.logActions(req, {
            actionType: 'Get Channel Messages',
            actionDetails: `The user doesn't not exist. teamID: ${teamId}`,
            actionResult: 'Failed'
        })
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!member.access_token) {
        admin.logActions(req, {
            actionType: 'Get Channel Messages',
            actionDetails: 'You should authenticate first.',
            actionResult: 'Failed'
        })
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const tokenWiredClient = getClient(member.access_token)
    const result = await Utils.getConversationHistoryWithThreads({
        client: tokenWiredClient,
        channelId,
        startDate,
        endDate,
        token: member.access_token,
        cursor: cursor || undefined
    })
    admin.logActions(req, { actionType: 'Get Channel Messages', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, result })
}

exports.getPrivateMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        admin.logActions(req, { actionType: 'Get Private Messages', actionDetails: "Team doesn't not exist.", actionResult: 'Failed' })
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        admin.logActions(req, {
            actionType: 'Get Private Messages',
            actionDetails: 'You should authenticate first.',
            actionResult: 'Failed'
        })
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const tokenWiredClient = getClient(team.accessToken)
    const result = await Utils.getConversationHistoryWithThreads({
        client: tokenWiredClient,
        channelId,
        startDate,
        endDate,
        token: team.accessToken
    })
    admin.logActions(req, { actionType: 'Get Private Messages', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, result })
}

exports.getDirectMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const { accessToken, startDate, endDate, cursor } = req.query

    if (!accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const tokenWiredClient = getClient(accessToken)
    const result = await Utils.getConversationHistoryWithThreads({
        client: tokenWiredClient,
        channelId,
        startDate,
        endDate,
        token: accessToken,
        cursor
    })
    admin.logActions(req, { actionType: 'Get Direct Messages', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, result })
}

exports.getDirectMessages2 = async (req, res) => {
    const { teamId, userId, channelId } = req.params
    const { startDate, endDate, cursor } = req.query
    const member = await SlackMember.findOne({team: teamId, user_id: userId});
    if (!member || !member.access_token) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const tokenWiredClient = getClient(member.access_token)
    const result = await Utils.getConversationHistoryWithThreads({
        client: tokenWiredClient,
        channelId,
        startDate,
        endDate,
        token: member.access_token,
        cursor
    })
    admin.logActions(req, { actionType: 'Get Direct Messages', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, result })
}

exports.get_history = async (req, res) => {
    const memberId = req.params.id
    const member = await SlackMember.findOne({ _id: req.params.id })
    const tokenWiredClient = getClient(member.access_token)

    try {
        const response = await tokenWiredClient.users.list()

        if (response.ok) {
            const users = response.members
            await addUser(team, userAccessToken, token.authed_user.id, users, req.userId)
            // Process the list of users as needed
        } else {
            console.error('Failed to fetch users:', response.error)
        }
    } catch (error) {
        console.error('Error:', error)
    }
}

exports.generate_pdf = async (req, res) => {
    try {
        const html = req.body.html

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        const page = await browser.newPage()

        await page.setContent(html)

        const pdf = await page.pdf({ format: 'A4' })

        await browser.close()

        res.contentType('application/pdf')
        res.send(pdf)
    } catch (error) {
        console.error('Failed to generate PDF:', error)
        res.status(500).send('Failed to generate PDF')
    }
}

exports.removeWorkspace = async (req, res) => {
    const { teamId } = req.params
    console.log('TEAM ID: ', req.params)
    try {
        //remove slack members
        await SlackMember.deleteMany({ team: teamId })
        //remove archives
        await SlackArchive.deleteMany({ team: teamId, clientId: req.userId })
        //remove logs
        await ArchiveLog.deleteMany({ team_id: teamId, type: 'Slack' })
        //remove archive state
        await ArchiveState.deleteMany({ appId: teamId, type: 'Slack' })
        //remove workspace
        await SlackTeam.deleteOne({ _id: teamId })
    } catch (error) {
        admin.logActions(req, {
            actionType: 'Remove slack workspace',
            actionDetails: JSON.stringify(error, null, 2),
            actionResult: 'Failed'
        })
        return res.json({ ok: false, data: false })
    }
    admin.logActions(req, { actionType: 'Remove slack workspace', actionDetails: `TeamID: ${teamId}`, actionResult: 'Success' })

    res.json({ ok: true, data: true })
}

exports.fileDownload = async (req, res) => {
    const { filename, teamId } = req.params
    const filePath = path.join(config.SLACK_FILES_DIR, `${teamId}/${filename}`)

    // Ensure file exists
    if (fs.existsSync(filePath)) {
        admin.logActions(req, { actionType: 'File download', actionDetails: `${filename}`, actionResult: 'Success' })
        res.download(filePath)
    } else {
        const { userId, fileUrl, accessToken } = req.query
        try {
            if (!accessToken) {
                const team = await SlackTeam.findOne({ _id: teamId })
                const member = await SlackMember.findOne({team: teamId, user_id: userId})
                const r = await Utils.downloadFileFromSlack(teamId, filename, fileUrl, member.access_token || team.accessToken)
                console.log(r)
            } else {
                const r = await Utils.downloadFileFromSlack(teamId, filename, fileUrl, accessToken)
                console.log(r)
            }
            admin.logActions(req, { actionType: 'File download', actionDetails: `${filename}`, actionResult: 'Success' })
            res.download(filePath)
        } catch (err) {
            admin.logActions(req, {
                actionType: 'File download',
                actionDetails: `Filename: ${filename}, error:${JSON.stringify(err, null, 2)}`,
                actionResult: 'Failed'
            })
            res.status(404).json({ error: 'File not found' })
        }
    }
}

exports.sendRequestAuth = async (req, res) => {
    const teamId = req.body.teamId
    const team = await SlackTeam.findOne({ _id: teamId })
    for (const mail of req.body.to) {
        const member = await SlackMember.findOne({ email: mail, team: teamId })
        if (!member) continue
        await Utils.sendMail(mail, member._id, member.display_name || member.real_name, team.name)
    }
    admin.logActions(req, {
        actionType: 'Request slack authorization',
        actionDetails: `Send to ${req.body.to.join(',')}`,
        actionResult: 'Success'
    })
    res.json({ ok: true })
}

exports.getFile = async (req, res) => {
    try {
        const apiToken = req.query.token
        const fileUrl = req.query.fileUrl

        const response = await axios.get(fileUrl, {
            headers: { Authorization: `Bearer ${apiToken}` },
            responseType: 'arraybuffer'
        })

        res.set('Content-Type', 'image/jpeg') // Adjust the content type based on the file
        res.send(response.data)
    } catch (error) {
        console.error('Error downloading Slack file:', error)
        res.status(500).send('Internal Server Error')
    }
}

exports.getCountsByFilter2 = async (req, res) => {
    try {
        const { userId, keywords, startDate, endDate } = req.query;
        const member = await SlackMember.findOne({ _id: userId });
        
        if (!member) {
            return res.status(404).json({ error: 'Slack member not found' });
        }
        
        const tokenWiredClient = getClient(member.access_token);

        let messageCount = 0;
        let fileCount = 0;
        let totalFileSize = 0;
        const processedFileIds = new Set(); // Track processed files to avoid duplicates

        // Convert provided dates to Unix timestamps (in seconds)
        const oldest = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : undefined;
        const latest = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : undefined;

        if (keywords) {
            // Search for messages with keywords
            const messagesResponse = await tokenWiredClient.search.messages({
                query: `${keywords}${startDate ? ` after:${startDate}` : ''}${endDate ? ` before:${endDate}` : ''}`,
                count: 1,
            });
            
            if (!messagesResponse.ok) {
                return res.status(500).json({ error: messagesResponse.error });
            }
            
            messageCount = messagesResponse.messages.total;

            // Search for files with keywords
            let filesCursor;
            do {
                const filesResponse = await tokenWiredClient.search.files({
                    query: `${keywords}${startDate ? ` after:${startDate}` : ''}${endDate ? ` before:${endDate}` : ''}`,
                    cursor: filesCursor,
                    count: 100
                });

                if (!filesResponse.ok) {
                    return res.status(500).json({ error: filesResponse.error });
                }

                fileCount = filesResponse.files.total;
                filesResponse.files.matches.forEach(file => {
                    if (!processedFileIds.has(file.id)) {
                        totalFileSize += file.size || 0;
                        processedFileIds.add(file.id);
                    }
                });

                filesCursor = filesResponse.response_metadata?.next_cursor;
            } while (filesCursor);
        } else {
            // No keywords - process all channels and files
            let channels = [];
            let channelsCursor;
            
            do {
                const channelsRes = await tokenWiredClient.conversations.list({
                    types: "public_channel,private_channel,im,mpim",
                    limit: 200,
                    cursor: channelsCursor,
                });
                
                if (!channelsRes.ok) {
                    return res.status(500).json({ error: channelsRes.error });
                }
                
                channels = channels.concat(channelsRes.channels);
                channelsCursor = channelsRes.response_metadata?.next_cursor;
            } while (channelsCursor);

            // First process standalone files to get the complete list
            let filesCursor;
            do {
                const filesParams = {
                    limit: 200,
                    cursor: filesCursor,
                    ...(oldest && { ts_from: oldest }),
                    ...(latest && { ts_to: latest })
                };
                
                const filesRes = await tokenWiredClient.files.list(filesParams);
                
                if (!filesRes.ok) {
                    return res.status(500).json({ error: filesRes.error });
                }
                
                filesRes.files.forEach(file => {
                    if (!processedFileIds.has(file.id)) {
                        fileCount++;
                        totalFileSize += file.size || 0;
                        processedFileIds.add(file.id);
                    }
                });
                
                filesCursor = filesRes.response_metadata?.next_cursor;
            } while (filesCursor);

            // Then process messages (but skip counting files already processed)
            for (const channel of channels) {
                let historyCursor;
                do {
                    const historyParams = {
                        channel: channel.id,
                        limit: 200,
                        cursor: historyCursor,
                        ...(oldest && { oldest }),
                        ...(latest && { latest })
                    };
                    
                    const historyRes = await tokenWiredClient.conversations.history(historyParams);
                    
                    if (!historyRes.ok) {
                        return res.status(500).json({ error: historyRes.error });
                    }
                    
                    messageCount += historyRes.messages.length;
                    
                    // Process files attached to messages
                    historyRes.messages.forEach(message => {
                        if (message.files) {
                            message.files.forEach(file => {
                                if (!processedFileIds.has(file.id)) {
                                    fileCount++;
                                    totalFileSize += file.size || 0;
                                    processedFileIds.add(file.id);
                                }
                            });
                        }
                    });
                    
                    historyCursor = historyRes.response_metadata?.next_cursor;
                } while (historyCursor);
            }
        }

        return res.json({
            ok: true,
            data: {
                messages: messageCount,
                files: fileCount,
                totalItems: messageCount + fileCount,
                fileSize: totalFileSize,
                estimateMsgSize: messageCount * 1024, // 1KB per message estimate
            }
        });
    } catch (error) {
        console.error("Error in getCountsByFilter:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.getCountsByFilter = async (req, res) => {
    try {
      const { userId, keywords, startDate, endDate } = req.query;
      const member = await SlackMember.findOne({ _id: userId });
      console.log(member, userId)
      if (!member) {
        return res.status(404).json({ error: 'Slack member not found' });
      }
      const tokenWiredClient = getClient(member.access_token);
  
      let messageCount = 0;
      let fileCount = 0;
  
      // Convert provided dates to Unix timestamps (in seconds)
      let oldest, latest, ts_from, ts_to;
      if (startDate) {
        oldest = (new Date(startDate)).getTime() / 1000;
        ts_from = oldest;
      }
      if (endDate) {
        latest = (new Date(endDate)).getTime() / 1000;
        ts_to = latest;
      }
  
      if (keywords) {
        // Build the search query with date qualifiers if dates are provided.
        let query = keywords;
        if (startDate) {
          query += ` after:${startDate}`;
        }
        if (endDate) {
          query += ` before:${endDate}`;
        }
  
        // Use Slack search API for messages.
        const messagesResponse = await tokenWiredClient.search.messages({
          query: query,
          count: 1, // we only need the total count
        });
        if (messagesResponse.ok) {
          messageCount = messagesResponse.messages.total;
        } else {
          return res.status(500).json({ error: messagesResponse.error });
        }
  
      } else {
        // No keywords provided, so we fetch and count all messages and files in the date range (if any).
  
        // Fetch all public and private channels.
        let channels = [];
        let cursor;
        do {
          const channelsRes = await tokenWiredClient.conversations.list({
            types: "public_channel,private_channel,im,mpim",
            limit: 200,
            cursor: cursor,
          });
          if (channelsRes.ok) {
            channels = channels.concat(channelsRes.channels);
            cursor = channelsRes.response_metadata?.next_cursor;
          } else {
            return res.status(500).json({ error: channelsRes.error });
          }
        } while (cursor);
  
        // Count messages in each channel using conversations.history with date filters.
        for (const channel of channels) {
          let historyCursor;
          do {
            const historyParams = {
              channel: channel.id,
              limit: 200,
              cursor: historyCursor,
            };
            if (oldest) historyParams.oldest = oldest;
            if (latest) historyParams.latest = latest;
            const historyRes = await tokenWiredClient.conversations.history(historyParams);
            if (historyRes.ok) {
              messageCount += historyRes.messages.length;
              historyCursor = historyRes.response_metadata?.next_cursor;
            } else {
              return res.status(500).json({ error: historyRes.error });
            }
          } while (historyCursor);
        }
      }
  
      const totalCount = messageCount + fileCount;
      return res.json({ messageCount, fileCount, totalCount });
    } catch (error) {
      console.error("Error in getCountsByFilter:", error);
      return res.status(500).json({ error: error.message });
    }
  };  

exports.getBase64Images = async (req, res) => {
    const imageInfos = req.body.imageInfos
    const teamId = req.body.teamId
    let token = req.body.token
    if (!token) {
        const team = await SlackTeam.findOne({ _id: teamId })
        token = team.accessToken
    }
    const result = []
    for (imgInfo of imageInfos) {
        const base64Data = await Utils.getSlackBase64Images(imgInfo.url, token, imgInfo.filetype)
        result.push({ src: base64Data })
    }

    res.json({ ok: true, data: result })
}

exports.getBase64Images1_1 = async (req, res) => {
    const imageInfos = req.body.imageInfos
    for (imgInfo of imageInfos) {
        const base64Data = await Utils.fetchSlackImageByBase64FromS3(imgInfo.s3Key, imgInfo.filetype)
        result.push({ src: base64Data })
    }

    res.json({ ok: true, data: result })
}

const addTeam = async (teamObj, accessToken, userId) => {
    const existTeam = await SlackTeam.findOne({ team_id: teamObj.id, clientId: userId })
    if (existTeam) {
        existTeam.accessToken = accessToken
        existTeam.save()

        return existTeam
    }

    const team = await SlackTeam.create({
        team_id: teamObj.id,
        name: teamObj.name,
        accessToken,
        clientId: userId
    })
    return team
}

const addUser = async (team, access_token, current_user, users, userId) => {
    for (let i = 0; i < users.length; i++) {
        const user = users[i]
        let isBot = false
        if (user['name'] === 'slackbot' || user['is_bot']) {
            isBot = true
        }

        const existUser = await SlackMember.findOne({ user_id: user['id'] })
        if (existUser) {
            if (existUser.user_id === current_user) {
                existUser.access_token = access_token
                existUser.authenticated = true
                await existUser.save()
            }

            continue
        }
        const newUser = await SlackMember.create({
            team: team._id,
            user_id: user['id'],
            email: user['profile']['email'],
            name: user['name'],
            real_name: user['profile']['real_name'],
            display_name: user['profile']['display_name'],
            tz: user['tz'],
            title: user['profile']['title'],
            phone: user['profile']['phone'],
            avatar: user['profile']['image_48'],
            color: user['color'],
            deleted: user['deleted'],
            is_admin: user['is_admin'],
            is_owner: user['is_owner'],
            is_primary_owner: user['is_primary_owner'],
            is_authed: true,
            access_token: current_user === user['id'] ? access_token : '',
            authenticated: current_user === user['id'],
            is_bot: isBot
        })
        team.members.push(newUser._id)
    }

    team.save()
}
