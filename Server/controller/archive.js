const { WebClient, retryPolicies } = require('@slack/web-api')
const { PassThrough } = require('stream');
const archiver = require('archiver');
const SlackTeam = require('../models/slack_team')
const SlackMember = require('../models/slack_member')
const SlackArchive = require('../models/slack_archive')
const SlackArchive2 = require('../models/slack_archive2')
const { getChannels } = require('./slack')
const Archive = require('../models/archive')
const ArchiveState = require('../models/archive_state')
const ArchiveLog = require('../models/archive_log')
const ArchiveCron = require('../models/archive_cron')
const User = require('../models/user')
const Utils = require('./utils')
const {googleMimeTypes} = require('../utils')
const { ObjectId } = require('bson')
const path = require('path')
const config = require('../config/app.config')
const admin = require('./admin')
const { slackSearch, outlookSearch, oneDriveSearch, addIndex, deleteSlackIndex, gmailSearch, gDriveSearch, dropboxSearch,  filesSearch, flaggedCollectionsSearch } = require('./ai_search')
const { Dropbox } = require('dropbox'); // Install Dropbox SDK
const MS365Workspace = require('../models/ms365workspaces')
const GoogleWorkspace = require('../models/googleworkspaces')
const DropboxWorkspace = require('../models/dropboxworkspace')
const DropboxMembers = require('../models/dropboxmembers')
const DropboxArchive = require('../models/dropbox_archive')
const ms365Controller = require('./ms365')
const dropboxController = require('./dropbox')
const OutlookArchive = require('../models/outlook_archive')
const BackupMessages = require("../models/outlook_msgids_archive");
const OneDriveArchive = require('../models/onedrive_archive')
const GmailArchive = require('../models/gmail_archive')
const DriveArchive = require('../models/drive_archive')
const OutlookDownloadLog = require('../models/outlook_download_log')
const axios = require('axios')
const fs = require('fs')
const AWS = require('./aws');
const GmailDownloadLog = require('../models/gmail_download_log');
const FlaggedCollection = require('../models/flagged_collections');
const FlaggedArchive = require('../models/flagged_archive');
const { google } = require('googleapis');

const oauth2ClientTest = new google.auth.OAuth2(
    config.GOOGLE_APP_INFO.CLIENT_ID,
    config.GOOGLE_APP_INFO.CLIENT_SECRET,
    `${config.SITE_URL}/api/google/auth-redirect-test`
);

const getClient = token => {
    return new WebClient(token, {
        retryConfig: retryPolicies.rapidRetryPolicy
    })
}

exports.progress = async app => {
    const team = await SlackTeam.findOne({ _id: app.appId })
    try {
        if (app.type === 'Slack') {
            const tokenWiredClient = getClient(team.accessToken)

            const response = await tokenWiredClient.conversations.list({
                types: 'public_channel,private_channel,mpim,im'
            })
            const response_users = await tokenWiredClient.users.list()
            const members = {}
            for (let member of response_users.members) {
                members[member.id] = member
            }
            const response_im = {}
            response_im.channels = response.channels.filter(item => item.is_im)
            // var channelConversationHistory = {};
            var conversationHistory = {}
            let newBackupFilesCnt = 0
            let newBackupFileSize = 0
            for (const channel of response.channels) {
                const result_history = await Utils.getConversationHistoryWithThreads({
                    client: tokenWiredClient,
                    channelId: channel.id,
                    startDate: 0,
                    endDate: 0,
                    token: team.accessToken,
                    teamId: app.appId,
                    isBackUp: true,
                    userId: team.clientId,
                    channelName: channel.name,
                    members,
                    teamName: team.name
                })
                conversationHistory[channel.id] = result_history.result
                newBackupFilesCnt += result_history.newBackupFiles
                newBackupFileSize += result_history.newBackupFileSize
                // const history = await tokenWiredClient.conversations.history({
                //     channel: channel.id
                // });
                // channelConversationHistory[channel.id] = history;
            }
            const archive_row = await SlackArchive.findOne({ team: app.appId })
            let id = ''
            let size = ''
            if (archive_row) {
                const tmp = {}
                id = tmp.id = new ObjectId().toHexString()

                tmp.channelList = response
                tmp.userList = response_users
                tmp.directChannel = response_im
                tmp.conversationHistory = conversationHistory
                tmp.backedAt = new Date().toISOString()
                tmp.size = Utils.getObjectBytes(tmp)
                tmp.newBackupFilesCnt = newBackupFilesCnt
                tmp.newBackupFileSize = newBackupFileSize
                tmp.note = app.note
                size = Utils.formatSizeUnits(tmp.size)
                archive_row.backups.push(tmp)
                archive_row.clientId = team.clientId
                archive_row.save()
                await ArchiveLog.create({
                    type: app.type,
                    team_id: app.appId,
                    name: team.name,
                    log: 'Update Archive',
                    note: app.note
                })
            } else {
                const backup = {
                    id: new ObjectId().toHexString(),
                    backedAt: new Date().toISOString(),
                    note: app.note,
                    channelList: response,
                    // channelList: response_all,
                    userList: response_users,
                    directChannel: response_im,
                    conversationHistory: conversationHistory,
                    newBackupFilesCnt: newBackupFilesCnt,
                    newBackupFileSize: newBackupFileSize
                }
                backup.size = Utils.getObjectBytes(backup)
                id = backup.id
                size = Utils.formatSizeUnits(backup.size)
                const archive_new_row = await SlackArchive.create({
                    team: app.appId,
                    backups: [backup],
                    clientId: team.clientId
                })
                await ArchiveLog.create({
                    type: app.type,
                    team_id: app.appId,
                    name: team.name,
                    log: 'Success Create Archive',
                    note: app.note
                })
                // await SlackTeam.findByIdAndUpdate(item.id, {
                //     updatedAt: Date.now(),
                // });
            }

            app.state = 'completed'
            await app.save()
            team.archiveState = app
            await team.save()
            //send completion mail to the user
            const user = await User.findOne({ _id: team.clientId })
            if (!user) return true
            await Utils.sendArchiveCompletionMail(user.email, {
                id,
                size,
                name: team.name,
                date: new Date().toISOString(),
                newBackupFilesCnt,
                newBackupFileSize,
                note: app.note
            })
            return true
        } else if (app.type === 'MS365') {
            // TO-DO other apps like googleworkspace microsoft365 etc
            const ms365Workspace = await MS365Workspace.findOne({ _id: app.appId })
            if (!ms365Workspace) {
                app.state = 'error'
                app.note = 'MS365 Workspace not found'
                await app.save()
                return false
            }
            const token = await ms365Controller.getAccessToken(ms365Workspace.orgId)
            if (!token) {
                app.state = 'error'
                app.note = 'No token'
                await app.save()
                return false
            }
            const user = await User.findOne({ _id: ms365Workspace.clientId })
            app.filters.userEmail.forEach(async email => {
                app.filters.application.forEach(async applicationItem => {
                    const itemFilters = {
                        jobName: app.filters.jobName,
                        userEmail: email,
                        application: applicationItem,
                        keywords: app.filters.keywords,
                        filterByDateRange: app.filters.filterByDateRange,
                        dateRange: app.filters.dateRange,
                        recipientName: app.filters.recipientName,
                        attachmentName: app.filters.attachmentName
                    }
                    if (applicationItem === 'Outlook') {
                        const data = await Utils.fetchGraphAPIData(token, itemFilters)
                        // console.log("Outlook Archive Data: ", data);
                        if (data) {
                            const backedUpSize = Utils.getObjectBytes(data)
                            const formattedSize = Utils.formatSizeUnits(backedUpSize)
                            // Store OutlookArchive
                            const outlookArchive = await OutlookArchive.create({
                                jobId: app._id,
                                jobName: app.filters.jobName,
                                workspaceId: app.appId,
                                filters: itemFilters,
                                backups: data,
                                size: backedUpSize,
                                clientId: ms365Workspace.clientId
                            })

                            //Indexing to ElasticSearch
                            console.info('Indexing outlook messages to ElasticSearch...')
                            data.forEach(val => {
                                val.body = Utils.html2plainText(val.body.content)
                                val.archiveId = outlookArchive._id
                                val.workspaceName = ms365Workspace.displayName
                                val.userId = ms365Workspace.clientId
                                val.createdAt = outlookArchive.createdAt
                                val.archiveName = app.filters.jobName
                                addIndex({
                                    index: config.ELASTIC_INFO.OUTLOOK_INDEX,
                                    id: `${outlookArchive._id}_${val.id}`,
                                    body: val
                                })
                            })
                            console.info('Done indexing outlook messages')

                            if (user) {
                                await Utils.sendArchiveCompletionMail(user.email, {
                                    id: outlookArchive.id,
                                    size: formattedSize,
                                    name: ms365Workspace.displayName,
                                    date: new Date().toISOString(),
                                    newBackupFilesCnt: data.length,
                                    newBackupFileSize: formattedSize,
                                    note: 'Job Name: ' + app.filters.jobName
                                })
                            }
                        }
                    } else if (applicationItem === 'OneDrive') {
                        const data = await Utils.fetchGraphOneDriveAPIData(token, itemFilters, app._id)
                        // console.log("OneDrive Archive Data: ", data);
                        if (data) {
                            const backedUpSize = Utils.getObjectBytes(data)
                            const formattedSize = Utils.formatSizeUnits(backedUpSize)
                            // Store OneDriveArchive
                            const onedriveArchive = await OneDriveArchive.create({
                                jobId: app._id,
                                jobName: app.filters.jobName,
                                workspaceId: app.appId,
                                filters: itemFilters,
                                backups: data,
                                size: backedUpSize,
                                clientId: ms365Workspace.clientId
                            })
                            if (user) {
                                await Utils.sendArchiveCompletionMail(user.email, {
                                    id: onedriveArchive.id,
                                    size: formattedSize,
                                    name: ms365Workspace.displayName,
                                    date: new Date().toISOString(),
                                    newBackupFilesCnt: data.length,
                                    newBackupFileSize: formattedSize,
                                    note: 'Job Name: ' + app.filters.jobName
                                })
                            }
                        }
                    }
                })
            })
            app.state = 'completed'
            await app.save()
            return true
        } else if (app.type === 'Google') {
            const googleWorkspace = await GoogleWorkspace.findOne({ _id: app.appId })
            if (!googleWorkspace) {
                app.state = 'error'
                app.note = 'Google Workspace not found'
                await app.save()
                return false
            }
            const user = await User.findOne({ _id: googleWorkspace.clientId })
            app.filters.userEmail.forEach(async email => {
                app.filters.application.forEach(async applicationItem => {
                    const itemFilters = {
                        jobName: app.filters.jobName,
                        userEmail: email,
                        application: applicationItem,
                        keywords: app.filters.keywords,
                        filterByDateRange: app.filters.filterByDateRange,
                        dateRange: app.filters.dateRange,
                        recipientName: app.filters.recipientName,
                        attachmentName: app.filters.attachmentName
                    }
                    if (applicationItem === 'Gmail') {
                        const data = await Utils.fetchGraphGmailAPIData(itemFilters)
                        // console.log("Gmail Archive Data: ", data);
                        if (data.length) {
                            const backedUpSize = Utils.getObjectBytes(data)
                            const formattedSize = Utils.formatSizeUnits(backedUpSize)
                            // Store GmailArchive
                            const gmailArchive = await GmailArchive.create({
                                jobId: app._id,
                                jobName: app.filters.jobName,
                                workspaceId: app.appId,
                                filters: itemFilters,
                                backups: data,
                                size: backedUpSize,
                                clientId: googleWorkspace.clientId
                            })
                            if (user) {
                                await Utils.sendArchiveCompletionMail(user.email, {
                                    id: gmailArchive.id,
                                    size: formattedSize,
                                    name: googleWorkspace.displayName,
                                    date: new Date().toISOString(),
                                    newBackupFilesCnt: data.length,
                                    newBackupFileSize: formattedSize,
                                    note: 'Job Name: ' + app.filters.jobName
                                })
                            }
                        }
                    } else if (applicationItem === 'Drive') {
                        const data = await Utils.fetchGraphDriveAPIData(itemFilters, app._id)
                        console.log('Drive Archive Data: ', data)
                        if (data.length) {
                            const backedUpSize = Utils.getObjectBytes(data)
                            const formattedSize = Utils.formatSizeUnits(backedUpSize)
                            // Store DriveArchive
                            const driveArchive = await DriveArchive.create({
                                jobId: app._id,
                                jobName: app.filters.jobName,
                                workspaceId: app.appId,
                                filters: itemFilters,
                                backups: data,
                                size: backedUpSize,
                                clientId: googleWorkspace.clientId
                            })
                            if (user) {
                                await Utils.sendArchiveCompletionMail(user.email, {
                                    id: driveArchive.id,
                                    size: formattedSize,
                                    name: googleWorkspace.displayName,
                                    date: new Date().toISOString(),
                                    newBackupFilesCnt: data.length,
                                    newBackupFileSize: formattedSize,
                                    note: 'Job Name: ' + app.filters.jobName
                                })
                            }
                        }
                    }
                })
            })
            app.state = 'completed'
            await app.save()
            return true
        }
    } catch (error) {
        console.log('==================Archive Process Error================')
        console.log(error)
        app.state = 'error'
        app.note = error
        await app.save()

        if (app.type === 'Slack') {
            team.archiveState = app
            await team.save()
        }
        const user = await User.findOne({ _id: team.clientId })
        if (user) await Utils.sendArchiveFailedMail(user.email, { name: team.name, date: new Date().toISOString(), note: app.note })

        return false
    }
}

//Store archive data to GridFS for larger than 16Mb
// exports.progress2 = async app => {
//     try {
//         if (app.type === 'Slack') {
//             const team = await SlackTeam.findOne({ _id: app.appId }).populate({ path: 'members', match: { access_token: { $ne: '' } } }).exec()
//             console.log("Team Access Token: ", team.accessToken)
//             console.log("=============Slack Team===========")
//             console.log(team)
//             console.log("=============Slack Team End===========")
//             const tokenWiredClient = getClient(team.accessToken)
//             const response = await tokenWiredClient.conversations.list({ types: 'public_channel,private_channel,mpim,im' })
//             const response_users = await tokenWiredClient.users.list()
//             const members = response_users.members.reduce((acc, member) => ({ ...acc, [member.id]: member }), {})
//             const response_im = { channels: response.channels.filter(item => item.is_im && !item.is_bot) }

//             const channels = []
//             channels.push({ token: team.accessToken, channels: response.channels })
//             for (const member of team.members) {
//                 if (member.access_token !== team.accessToken) {
//                     const slackClient = getClient(member.access_token)
//                     const res = await slackClient.conversations.list({ types: 'im, mpim' })
//                     channels.push({ token: member.access_token, channels: res.channels })
//                 }
//             }

//             const conversationHistory = {}
//             let newBackupFilesCnt = 0
//             let newBackupFileSize = 0
//             const backupId = new ObjectId().toHexString()
//             for (const obj of channels) {
//                 const slackClient = getClient(obj.token)
//                 for (const channel of obj.channels) {
//                     const result_history = await Utils.getConversationHistoryWithThreads({
//                         client: slackClient,
//                         channelId: channel.id,
//                         startDate: 0,
//                         endDate: 0,
//                         token: team.accessToken,
//                         teamId: app.appId,
//                         isBackUp: true,
//                         userId: team.clientId,
//                         channelName: channel.name,
//                         members,
//                         teamName: team.name,
//                         backupId
//                     })
//                     conversationHistory[channel.id] = result_history.result
//                     newBackupFilesCnt += result_history.newBackupFiles
//                     newBackupFileSize += result_history.newBackupFileSize
//                 }
//             }
//             const backupData = {
//                 channelList: response,
//                 userList: response_users,
//                 directChannel: response_im,
//                 conversationHistory
//             }

//             const archive_row = await SlackArchive.findOne({ team: app.appId })
//             let backupSize
//             const { dataId } = await Utils.saveLargeData(backupData, backupId)
//             if (archive_row) {
//                 archive_row.backups.push({
//                     id: backupId,
//                     dataId,
//                     backedAt: new Date().toISOString(),
//                     size: Utils.getObjectBytes(conversationHistory),
//                     note: app.note
//                 })
//                 archive_row.clientId = team.clientId
//                 archive_row.save()
//                 await ArchiveLog.create({
//                     type: app.type,
//                     team_id: app.appId,
//                     name: team.name,
//                     log: 'Update Archive',
//                     note: app.note
//                 })
//             } else {
//                 await SlackArchive.create({
//                     team: app.appId,
//                     backups: [
//                         {
//                             id: backupId,
//                             dataId,
//                             backedAt: new Date().toISOString(),
//                             size: Utils.getObjectBytes(conversationHistory),
//                             note: app.note
//                         }
//                     ],
//                     clientId: team.clientId
//                 })
//                 await ArchiveLog.create({
//                     type: app.type,
//                     team_id: app.appId,
//                     name: team.name,
//                     log: 'Success Create Archive',
//                     note: app.note
//                 })
//             }

//             app.state = 'completed'
//             await app.save()
//             team.archiveState = app
//             await team.save()

//             const user = await User.findOne({ _id: team.clientId })
//             if (!user) return true
//             backupSize = Utils.formatSizeUnits(Utils.getObjectBytes(backupData))
//             await Utils.sendArchiveCompletionMail(user.email, {
//                 id: backupId,
//                 size: backupSize,
//                 name: team.name,
//                 date: new Date().toISOString(),
//                 newBackupFilesCnt,
//                 newBackupFileSize,
//                 note: app.note
//             })
//             return true
//         } else if (app.type === 'MS365') {
//             const ms365Workspace = await MS365Workspace.findOne({ _id: app.appId });
//             if (!ms365Workspace) {
//                 app.state = 'error';
//                 app.note = 'MS365 Workspace not found';
//                 await app.save();
//                 return false;
//             }

//             let token = await ms365Controller.getAccessToken(ms365Workspace.orgId);
//             if (!token) {
//                 app.state = 'error';
//                 app.note = 'No token';
//                 await app.save();
//                 return false;
//             }

//             const headers = {
//                 Authorization: `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             };

//             const user = await User.findOne({ _id: ms365Workspace.clientId });

//             try {
//                 for (let email of app.filters.userEmail) {
//                     for (let applicationItem of app.filters.application) {
//                         const itemFilters = {
//                             jobName: app.filters.jobName,
//                             userEmail: email,
//                             application: applicationItem,
//                             keywords: app.filters.keywords,
//                             filterByDateRange: app.filters.filterByDateRange,
//                             dateRange: app.filters.dateRange,
//                             recipientName: app.filters.recipientName,
//                             attachmentName: app.filters.attachmentName,
//                             filterWithContent: app.filters.filterWithContent
//                         };

//                         if (applicationItem === 'Outlook') {
//                             let messageQueue = [];
//                             let outlookArchive;
//                             const backupId = new ObjectId().toHexString(); // Created once

//                             // Create the OutlookArchive document with initial values
//                             outlookArchive = await OutlookArchive.create({
//                                 jobId: app._id,
//                                 jobName: app.filters.jobName,
//                                 workspaceId: app.appId,
//                                 filters: itemFilters,
//                                 backups: [],
//                                 size: 0,
//                                 clientId: ms365Workspace.clientId
//                             });

//                             await ArchiveState.updateOne({ _id: app.id }, { archiveId: outlookArchive._id, detailType: 'Outlook' });

//                             const processBatch = async messages => {
//                                 for (let message of messages) {
//                                     if (message.hasAttachments) {
//                                         console.log("Retrieving attachments...");
//                                         const attachmentsQuery = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments?$select=id,name,size,contentType`;
//                                         const attachmentsResponse = await axios.get(attachmentsQuery, { headers });
//                                         message.attachments = attachmentsResponse.data.value;
//                                         // Upload to S3 bucket

//                                         for (let attachment of message.attachments) {
//                                             const attachmentContent = await axios.get(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments/${attachment.id}/$value`, {
//                                                 headers,
//                                                 responseType: 'arraybuffer'
//                                             });

//                                             const fileName = `${outlookArchive.id}_${attachment.id}`;
//                                             await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, fileName, attachmentContent.data);
//                                         }
//                                     }
//                                     messageQueue.push(message);
//                                     console.log("Processing message queue");
//                                     const processedCount = messageQueue.length;
//                                     if (processedCount >= 300) {
//                                         await handleBatchProcessing();
//                                     }
//                                 }
//                             };

//                             const handleBatchProcessing = async () => {
//                                 const newMsgs = [];
//                                 let messageIds = [];
//                                 console.info('Indexing outlook messages to ElasticSearch...');
//                                 for (let val of messageQueue) {
//                                     const originVal = { ...val };
//                                     val.body = Utils.html2plainText(val.body?.content);
//                                     val.archiveId = outlookArchive._id;
//                                     val.workspaceName = ms365Workspace.displayName;
//                                     val.userId = ms365Workspace.clientId;
//                                     val.createdAt = outlookArchive.createdAt;
//                                     val.archiveName = app.filters.jobName;
//                                     val.hash = Utils.generateHash(originVal)
//                                     addIndex({
//                                         index: config.ELASTIC_INFO.OUTLOOK_INDEX,
//                                         id: `${outlookArchive._id}_${val.id}`,
//                                         body: val
//                                     });
//                                     messageIds.push({ id: val.id, attachments: val.attachments });

//                                     originVal.hash = val.hash
//                                     newMsgs.push(originVal)
//                                 }
//                                 const backedUpSize = newMsgs.reduce((acc, msg) => acc + Utils.getObjectBytes(msg), 0);
//                                 const { dataId } = await Utils.saveLargeData(newMsgs, backupId);

//                                 // Push the dataId into backups array of OutlookArchive
//                                 await OutlookArchive.updateOne(
//                                     { _id: outlookArchive._id },
//                                     { $push: { backups: dataId }, $inc: { size: backedUpSize, totalCount: messageQueue.length } }
//                                 );

//                                 // Create a new BackupMessages document
//                                 await BackupMessages.create({
//                                     archiveId: outlookArchive._id,
//                                     backupId, // New backupId for every 300 messages
//                                     dataId,
//                                     messageIds: messageIds
//                                 });

//                                 console.info('Done indexing outlook messages');
//                                 console.log("Update ArchiveState");
//                                 await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: messageQueue.length } });
//                                 messageQueue = []; // Reset the queue
//                             };

//                             await Utils.fetchGraphAPIData(token, itemFilters, processBatch, ms365Workspace.orgId, async newToken => {
//                                 token = newToken;
//                                 headers.Authorization = `Bearer ${token}`;
//                             });

//                             if (messageQueue.length > 0) {
//                                 await handleBatchProcessing();
//                             }

//                             if (user) {
//                                 const totalSize = outlookArchive.backups.reduce((acc, backup) => acc + Utils.getObjectBytes(backup), 0);
//                                 await Utils.sendArchiveCompletionMail(user.email, {
//                                     id: outlookArchive._id.toString(),
//                                     type: 'Outlook',
//                                     size: Utils.formatSizeUnits(totalSize),
//                                     name: ms365Workspace.displayName,
//                                     date: new Date().toISOString(),
//                                     newBackupFilesCnt: outlookArchive.backups.length * 300,
//                                     newBackupFileSize: Utils.formatSizeUnits(totalSize),
//                                     note: 'Job Name: ' + app.filters.jobName
//                                 });
//                             }
//                         } else if (applicationItem === 'OneDrive') {
//                             const oneDriveArchive = await OneDriveArchive.create({
//                                 jobId: app._id,
//                                 jobName: app.filters.jobName,
//                                 workspaceId: app.appId,
//                                 filters: itemFilters,
//                                 // dataId,
//                                 // size: backedUpSize,
//                                 clientId: ms365Workspace.clientId
//                             });
//                             await ArchiveState.updateOne({ _id: app.id }, { archiveId: oneDriveArchive._id, detailType: 'OneDrive' });
//                             const { data, totalSize } = await Utils.fetchGraphOneDriveAPIData2(token, itemFilters, oneDriveArchive.id, ms365Workspace, oneDriveArchive);
//                             if (data) {
//                                 const backedUpSize = Utils.getObjectBytes(data);
//                                 const backupId = new ObjectId().toHexString();
//                                 const { dataId } = await Utils.saveLargeData(data, backupId);

//                                 await OneDriveArchive.updateOne({ _id: oneDriveArchive._id }, { dataId, size: (totalSize + backedUpSize) })
//                                 if (user) {
//                                     await Utils.sendArchiveCompletionMail(user.email, {
//                                         id: backupId,
//                                         size: Utils.formatSizeUnits(totalSize + backedUpSize),
//                                         name: ms365Workspace.displayName,
//                                         date: new Date().toISOString(),
//                                         note: 'Job Name: ' + app.filters.jobName
//                                     });
//                                 }
//                             }
//                         }
//                     }
//                 }
//                 app.state = 'completed';
//             } catch (error) {
//                 app.state = 'error';
//                 app.note = error.message;
//                 // To-do send failed mail

//                 const currentApp = await ArchiveState.findById(app._id)

//                 if (user) {
//                     await Utils.sendArchiveCompletionMail(user.email, {
//                         id: currentApp.archiveId,
//                         type: currentApp.detailType,
//                         date: new Date().toISOString(),
//                         note: currentApp.note
//                     });
//                 }
//             }

//             await app.save();
//             return true;
//         } else if (app.type === 'Google') {
//             const googleWorkspace = await GoogleWorkspace.findOne({ _id: app.appId })
//             if (!googleWorkspace) {
//                 app.state = 'error'
//                 app.note = 'Google Workspace not found'
//                 await app.save()
//                 return false
//             }
//             const user = await User.findOne({ _id: googleWorkspace.clientId })
//             app.filters.userEmail.forEach(async email => {
//                 app.filters.application.forEach(async applicationItem => {
//                     const itemFilters = {
//                         jobName: app.filters.jobName,
//                         userEmail: email,
//                         application: applicationItem,
//                         keywords: app.filters.keywords,
//                         filterByDateRange: app.filters.filterByDateRange,
//                         dateRange: app.filters.dateRange,
//                         recipientName: app.filters.recipientName,
//                         attachmentName: app.filters.attachmentName
//                     }
//                     if (applicationItem === 'Gmail') {
//                         const data = await Utils.fetchGraphGmailAPIData(itemFilters)
//                         if (data.length) {
//                             const backedUpSize = Utils.getObjectBytes(data)
//                             const formattedSize = Utils.formatSizeUnits(backedUpSize)
//                             const backupId = new ObjectId().toHexString()
//                             const { dataId } = await Utils.saveLargeData(data, backupId)

//                             await GmailArchive.create({
//                                 jobId: app._id,
//                                 jobName: app.filters.jobName,
//                                 workspaceId: app.appId,
//                                 filters: itemFilters,
//                                 backups: [{ id: backupId, dataId }],
//                                 size: backedUpSize,
//                                 clientId: googleWorkspace.clientId
//                             })

//                             if (user) {
//                                 await Utils.sendArchiveCompletionMail(user.email, {
//                                     id: backupId,
//                                     size: formattedSize,
//                                     name: googleWorkspace.displayName,
//                                     date: new Date().toISOString(),
//                                     newBackupFilesCnt: data.length,
//                                     newBackupFileSize: formattedSize,
//                                     note: 'Job Name: ' + app.filters.jobName
//                                 })
//                             }
//                         }
//                     } else if (applicationItem === 'Drive') {
//                         const data = await Utils.fetchGraphDriveAPIData(itemFilters, app._id)
//                         if (data.length) {
//                             const backedUpSize = Utils.getObjectBytes(data)
//                             const formattedSize = Utils.formatSizeUnits(backedUpSize)
//                             const backupId = new ObjectId().toHexString()
//                             const { dataId } = await Utils.saveLargeData(data, backupId)

//                             await DriveArchive.create({
//                                 jobId: app._id,
//                                 jobName: app.filters.jobName,
//                                 workspaceId: app.appId,
//                                 filters: itemFilters,
//                                 backups: [{ id: backupId, dataId }],
//                                 size: backedUpSize,
//                                 clientId: googleWorkspace.clientId
//                             })

//                             if (user) {
//                                 await Utils.sendArchiveCompletionMail(user.email, {
//                                     id: backupId,
//                                     size: formattedSize,
//                                     name: googleWorkspace.displayName,
//                                     date: new Date().toISOString(),
//                                     newBackupFilesCnt: data.length,
//                                     newBackupFileSize: formattedSize,
//                                     note: 'Job Name: ' + app.filters.jobName
//                                 })
//                             }
//                         }
//                     }
//                 })
//             })
//             app.state = 'completed'
//             await app.save()
//             return true
//         }
//     } catch (error) {
//         console.log('==================Archive Process Error================')
//         console.log(error)
//         app.state = 'error'
//         app.note = error
//         await app.save()

//         if (app.type === 'Slack') {
//             team.archiveState = app
//             await team.save()
//         }
//         const user = await User.findOne({ _id: team.clientId })
//         if (user) await Utils.sendArchiveFailedMail(user.email, { name: team.name, date: new Date().toISOString(), note: app.note })

//         return false
//     }
// }

const archiveSlack = async (app) => {
    const teamUser = await SlackMember.findById(app.filters.user[0].id);
    const team = await SlackTeam.findById(app.appId);
    const accessToken = teamUser.access_token;
    const channels = await getChannels(app.appId, accessToken);
    const tokenWiredClient = getClient(accessToken);
    let members = await SlackMember.find({ team: app.appId });
    members = members.reduce((acc, member) => ({ ...acc, [member.user_id]: member }), {});
    // calc total channel count
    let totalChannelCnt = 0
    for (const chType of Object.keys(channels)) {
        totalChannelCnt += channels[chType].length
    }
    // const slackArchive = await SlackArchive2.create({
    //     team: app.appId,
    //     memberId: app.filters.userId,
    //     email: teamUser.email,
    //     channels,
    //     clientId: team.clientId
    // });
    await SlackArchive2.updateOne({_id: app.archiveId}, {
        memberId: app.filters.user[0].id,
        channels
    });

    // await ArchiveState.updateOne({ _id: app.id }, { totalCount: totalChannelCnt, archiveId: app.archiveId })

    const dataIds = { public: {}, private: {}, direct: {}, group: {} }
    let totalSize = 0
    let processedCount = 0
    try {
        for (const channelType of Object.keys(channels)) {
            for (const channel of channels[channelType]) {
                let hasMore = true
                let nextCursor = ''
                const ids = []
                while (hasMore) {
                    const result = await Utils.getConversationHistoryWithThreads2({
                        client: tokenWiredClient,
                        channelId: channel.id,
                        token: accessToken,
                        teamId: app.appId,
                        isBackUp: true,
                        userId: team.clientId, // deprecated
                        owner: app.owner, // new added field
                        createdBy: app.createdBy, // new added field
                        channelName: channel.name,
                        members,
                        teamName: team.name,
                        backupId: app.archiveId,
                        cursor: nextCursor,
                        filters: app.filters
                    });
                    const filename = new ObjectId().toHexString();
                    const { dataId, dataSize } = await Utils.saveLargeData(result.result, filename);

                    if (dataSize !== undefined) {
                        const parsedDataSize = parseInt(dataSize);
                        if (!isNaN(parsedDataSize)) {
                            totalSize += parsedDataSize;
                        }
                    }

                    if (result.newBackupFileSize !== undefined) {
                        const parsedNewBackupFileSize = parseInt(result.newBackupFileSize);
                        if (!isNaN(parsedNewBackupFileSize)) {
                            totalSize += parsedNewBackupFileSize;
                        }
                    }
                    ids.push(dataId)
                    hasMore = result.hasMore;
                    nextCursor = result.cursor;

                    // display progressing of size
                    await SlackArchive2.updateOne({ _id: app.archiveId }, { size: totalSize }); 
                    processedCount += result.result.length
                    await ArchiveState.updateOne({ _id: app.id }, { processedCount })
                }

                dataIds[channelType][channel.id] = ids;
            }
        }

        await SlackArchive2.updateOne({ _id: app.archiveId }, { dataIds, size: totalSize });

        app.state = 'completed';
        await app.save();

        // Owner
        const user = await User.findOne({ _id: team.clientId });
        if (!user) return true;

        // created by
        const reqUser = await User.findOne({_id: app.createdBy})
        await Utils.sendArchiveCompletionMail([user.email, reqUser?.email], {
            id: app.archiveId,
            size: Utils.formatSizeUnits(totalSize),
            type: 'Slack',
            name: `Archive ${teamUser.name} of ${team.name}`,
            date: new Date().toISOString(),
            note: app.note || '',
            jobName: app.filters.jobName
        });

        // await Utils.sendPushNotification({
        //     email: user.email,
        //     title: 'Ready Slack Archive',
        //     message: `Slack archive succeeded.\n Detail \n Workspace name: ${team.name}\nJob name: ${app.filters.jobName}\nUser: ${teamUser.name}\nTotal size: ${Utils.formatSizeUnits(totalSize)}`
        // });
    } catch (error) {
        console.log('==================Slack Archive Process Error================');
        console.log(error);
        app.state = 'error';
        app.note = error;
        await app.save();

        const user = await User.findOne({ _id: app.userId });
        const reqUser = await User.findOne({_id: app.createdBy})
        if (user) {
            await Utils.sendArchiveFailedMail([user.email, reqUser.email], { id: app.archiveId, name: '', date: new Date().toISOString(), note: app.note || '', type: 'Slack', jobName: app.filters.jobName });
        }

        return false;
    }
};


// exports.progress3 = async app => {
//     if (app.type === 'Slack') {
//         await archiveSlack(app)
//     } else if (app.type === 'MS365') {
//         const ms365Workspace = await MS365Workspace.findOne({ _id: app.appId });
//         if (!ms365Workspace) {
//             app.state = 'error';
//             app.note = 'MS365 Workspace not found';
//             await app.save();
//             return false;
//         }

//         let token = await ms365Controller.getAccessToken(ms365Workspace.orgId);
//         if (!token) {
//             app.state = 'error';
//             app.note = 'No token';
//             await app.save();
//             return false;
//         }

//         const headers = {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         };

//         const user = await User.findOne({ _id: ms365Workspace.clientId });

//         try {
//             for (let email of app.filters.userEmail) {
//                 for (let applicationItem of app.filters.application) {
//                     const itemFilters = {
//                         jobName: app.filters.jobName,
//                         userEmail: email,
//                         application: applicationItem,
//                         keywords: app.filters.keywords,
//                         filterByDateRange: app.filters.filterByDateRange,
//                         dateRange: app.filters.dateRange,
//                         recipientName: app.filters.recipientName,
//                         attachmentName: app.filters.attachmentName,
//                         filterWithContent: app.filters.filterWithContent
//                     };

//                     if (applicationItem === 'Outlook') {
//                         let messageQueue = [];
//                         let outlookArchive;
//                         const backupId = new ObjectId().toHexString(); // Created once

//                         // Create the OutlookArchive document with initial values
//                         outlookArchive = await OutlookArchive.create({
//                             jobId: app._id,
//                             jobName: app.filters.jobName,
//                             workspaceId: app.appId,
//                             filters: itemFilters,
//                             backups: [],
//                             size: 0,
//                             clientId: ms365Workspace.clientId
//                         });

//                         await ArchiveState.updateOne({ _id: app.id }, { archiveId: outlookArchive._id, detailType: 'Outlook' });

//                         const processBatch = async messages => {
//                             for (let message of messages) {
//                                 if (message.hasAttachments) {
//                                     console.log("Retrieving attachments...");
//                                     const attachmentsQuery = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments?$select=id,name,size,contentType`;
//                                     const attachmentsResponse = await axios.get(attachmentsQuery, { headers });
//                                     message.attachments = attachmentsResponse.data.value;
//                                     // Upload to S3 bucket

//                                     for (let attachment of message.attachments) {
//                                         const attachmentContent = await axios.get(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments/${attachment.id}/$value`, {
//                                             headers,
//                                             responseType: 'arraybuffer'
//                                         });

//                                         const fileName = `${outlookArchive.id}_${attachment.id}`;
//                                         await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, fileName, attachmentContent.data);
//                                     }
//                                 }
//                                 messageQueue.push(message);
//                                 console.log("Processing message queue");
//                                 const processedCount = messageQueue.length;
//                                 if (processedCount >= 300) {
//                                     await handleBatchProcessing();
//                                 }
//                             }
//                         };

//                         const handleBatchProcessing = async () => {
//                             const newMsgs = [];
//                             let messageIds = [];
//                             console.info('Indexing outlook messages to ElasticSearch...');
//                             for (let val of messageQueue) {
//                                 const originVal = { ...val };
//                                 val.body = Utils.html2plainText(val.body?.content);
//                                 val.archiveId = outlookArchive._id;
//                                 val.workspaceName = ms365Workspace.displayName;
//                                 val.userId = ms365Workspace.clientId;
//                                 val.createdAt = outlookArchive.createdAt;
//                                 val.archiveName = app.filters.jobName;
//                                 val.hash = Utils.generateHash(originVal)
//                                 addIndex({
//                                     index: config.ELASTIC_INFO.OUTLOOK_INDEX,
//                                     id: `${outlookArchive._id}_${val.id}`,
//                                     body: val
//                                 });
//                                 messageIds.push({ id: val.id, attachments: val.attachments });

//                                 originVal.hash = val.hash
//                                 newMsgs.push(originVal)
//                             }
//                             const backedUpSize = newMsgs.reduce((acc, msg) => acc + Utils.getObjectBytes(msg), 0);
//                             const { dataId } = await Utils.saveLargeData(newMsgs, backupId);

//                             // Push the dataId into backups array of OutlookArchive
//                             await OutlookArchive.updateOne(
//                                 { _id: outlookArchive._id },
//                                 { $push: { backups: dataId }, $inc: { size: backedUpSize, totalCount: messageQueue.length } }
//                             );

//                             // Create a new BackupMessages document
//                             await BackupMessages.create({
//                                 archiveId: outlookArchive._id,
//                                 backupId, // New backupId for every 300 messages
//                                 dataId,
//                                 messageIds: messageIds
//                             });

//                             console.info('Done indexing outlook messages');
//                             console.log("Update ArchiveState");
//                             await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: messageQueue.length } });
//                             messageQueue = []; // Reset the queue
//                         };

//                         await Utils.fetchGraphAPIData(token, itemFilters, processBatch, ms365Workspace.orgId, async newToken => {
//                             token = newToken;
//                             headers.Authorization = `Bearer ${token}`;
//                         });

//                         if (messageQueue.length > 0) {
//                             await handleBatchProcessing();
//                         }

//                         if (user) {
//                             const totalSize = outlookArchive.backups.reduce((acc, backup) => acc + Utils.getObjectBytes(backup), 0);
//                             await Utils.sendArchiveCompletionMail(user.email, {
//                                 id: outlookArchive._id.toString(),
//                                 type: 'Outlook',
//                                 size: Utils.formatSizeUnits(totalSize),
//                                 name: ms365Workspace.displayName,
//                                 date: new Date().toISOString(),
//                                 newBackupFilesCnt: outlookArchive.backups.length * 300,
//                                 newBackupFileSize: Utils.formatSizeUnits(totalSize),
//                                 note: 'Job Name: ' + app.filters.jobName
//                             });
//                         }
//                     } else if (applicationItem === 'OneDrive') {
//                         const oneDriveArchive = await OneDriveArchive.create({
//                             jobId: app._id,
//                             jobName: app.filters.jobName,
//                             workspaceId: app.appId,
//                             filters: itemFilters,
//                             // dataId,
//                             // size: backedUpSize,
//                             clientId: ms365Workspace.clientId
//                         });
//                         await ArchiveState.updateOne({ _id: app.id }, { archiveId: oneDriveArchive._id, detailType: 'OneDrive' });
//                         const { data, totalSize } = await Utils.fetchGraphOneDriveAPIData2(token, itemFilters, oneDriveArchive.id, ms365Workspace, oneDriveArchive);
//                         if (data) {
//                             const backedUpSize = Utils.getObjectBytes(data);
//                             const backupId = new ObjectId().toHexString();
//                             const { dataId } = await Utils.saveLargeData(data, backupId);

//                             await OneDriveArchive.updateOne({ _id: oneDriveArchive._id }, { dataId, size: (totalSize + backedUpSize) })
//                             if (user) {
//                                 await Utils.sendArchiveCompletionMail(user.email, {
//                                     id: backupId,
//                                     size: Utils.formatSizeUnits(totalSize + backedUpSize),
//                                     name: ms365Workspace.displayName,
//                                     date: new Date().toISOString(),
//                                     note: 'Job Name: ' + app.filters.jobName
//                                 });
//                             }
//                         }
//                     }
//                 }
//             }
//             app.state = 'completed';
//         } catch (error) {
//             app.state = 'error';
//             app.note = error.message;
//             // To-do send failed mail

//             const currentApp = await ArchiveState.findById(app._id)

//             if (user) {
//                 await Utils.sendArchiveFailedMail(user.email, {
//                     id: currentApp.archiveId,
//                     type: currentApp.detailType,
//                     date: new Date().toISOString(),
//                     note: currentApp.note
//                 });
//             }
//         }

//         await app.save();
//         return true;
//     } else if (app.type === 'Google') {
//         const googleWorkspace = await GoogleWorkspace.findOne({ _id: app.appId })
//         if (!googleWorkspace) {
//             app.state = 'error'
//             app.note = 'Google Workspace not found'
//             await app.save()
//             return false
//         }
//         const user = await User.findOne({ _id: googleWorkspace.clientId })
//         app.filters.userEmail.forEach(async email => {
//             app.filters.application.forEach(async applicationItem => {
//                 const itemFilters = {
//                     jobName: app.filters.jobName,
//                     userEmail: email,
//                     application: applicationItem,
//                     keywords: app.filters.keywords,
//                     filterByDateRange: app.filters.filterByDateRange,
//                     dateRange: app.filters.dateRange,
//                     recipientName: app.filters.recipientName,
//                     attachmentName: app.filters.attachmentName
//                 }
//                 if (applicationItem === 'Gmail') {
//                     const data = await Utils.fetchGraphGmailAPIData(itemFilters)
//                     if (data.length) {
//                         const backedUpSize = Utils.getObjectBytes(data)
//                         const formattedSize = Utils.formatSizeUnits(backedUpSize)
//                         const backupId = new ObjectId().toHexString()
//                         const { dataId } = await Utils.saveLargeData(data, backupId)

//                         await GmailArchive.create({
//                             jobId: app._id,
//                             jobName: app.filters.jobName,
//                             workspaceId: app.appId,
//                             filters: itemFilters,
//                             backups: [{ id: backupId, dataId }],
//                             size: backedUpSize,
//                             clientId: googleWorkspace.clientId
//                         })

//                         if (user) {
//                             await Utils.sendArchiveCompletionMail(user.email, {
//                                 id: backupId,
//                                 size: formattedSize,
//                                 name: googleWorkspace.displayName,
//                                 date: new Date().toISOString(),
//                                 newBackupFilesCnt: data.length,
//                                 newBackupFileSize: formattedSize,
//                                 note: 'Job Name: ' + app.filters.jobName
//                             })
//                         }
//                     }
//                 } else if (applicationItem === 'Drive') {
//                     const data = await Utils.fetchGraphDriveAPIData(itemFilters, app._id)
//                     if (data.length) {
//                         const backedUpSize = Utils.getObjectBytes(data)
//                         const formattedSize = Utils.formatSizeUnits(backedUpSize)
//                         const backupId = new ObjectId().toHexString()
//                         const { dataId } = await Utils.saveLargeData(data, backupId)

//                         await DriveArchive.create({
//                             jobId: app._id,
//                             jobName: app.filters.jobName,
//                             workspaceId: app.appId,
//                             filters: itemFilters,
//                             backups: [{ id: backupId, dataId }],
//                             size: backedUpSize,
//                             clientId: googleWorkspace.clientId
//                         })

//                         if (user) {
//                             await Utils.sendArchiveCompletionMail(user.email, {
//                                 id: backupId,
//                                 size: formattedSize,
//                                 name: googleWorkspace.displayName,
//                                 date: new Date().toISOString(),
//                                 newBackupFilesCnt: data.length,
//                                 newBackupFileSize: formattedSize,
//                                 note: 'Job Name: ' + app.filters.jobName
//                             })
//                         }
//                     }
//                 }
//             })
//         })
//         app.state = 'completed'
//         await app.save()
//         return true
//     }
// }

exports.progress4 = async app => {
    if (app.type === 'Slack') {
        await archiveSlack(app)
    }  else if (app.type === 'FlaggedCollections') {
        
        const user = await User.findOne({ _id: app.createdBy });
        try {
            
            let messageQueue = [];
            let messageIds = []
            let totalSize = 0
            const backupId = new ObjectId().toHexString(); // Created once
            let flaggedArchive = await FlaggedArchive.findById(app.archiveId);
            const flaggedCollections = await FlaggedCollection.find({collectionId: app.appId}, {_id: 0})
            for (let index = 0; index < flaggedCollections.length; index++) {
                let val = {...flaggedCollections[index].toObject()};
                let originVal = {...val}
                // originVal = { ...originVal, ...(val.data || {}) };
                // originVal = { ...originVal, type: val.type };

                if (val.type === 'outlook') {
                    const ms365Workspace = await MS365Workspace.findById(val.data.workspaceId)
                    let token = await ms365Controller.getAccessToken(ms365Workspace.orgId);
                    if (!token) {
                        app.state = 'error';
                        app.note = 'No token';
                        await app.save();
                        return false;
                    }
                    // handle attachments
                    if (originVal.data?.attachments) {
                        for (let attachment of originVal.data.attachments) {
                            try {
                                const attachmentContentUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(val.data.userEmail)}/messages/${val.data.id}/attachments/${attachment.id}/$value`;
                                
                                const attachmentContent = await Utils.fetchGraphAPIWithRateLimit(attachmentContentUrl, { headers: {Authorization: `Bearer ${token}`}, responseType: 'arraybuffer' }, async newToken => {
                                    token = newToken;
                                }, ms365Workspace.orgId);
                                const fileName = `FlaggedCollections/${flaggedArchive.id}_${attachment.id}`;
                                await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, fileName, attachmentContent);
                                totalSize += parseInt(attachment.size)
                                //Add queue to index file contents to ElasticSearch
                                await Utils.addIndexQueue('FlaggedCollections', {
                                    workspaceId: app.appId,
                                    archiveId: app.archiveId,
                                    fileId: attachment.id,
                                    fileName: attachment.name,
                                    fileType: attachment.contentType,
                                    size: attachment.size,
                                    s3Key: fileName,
                                    owner: app.owner,
                                    collectedBy: app.createdBy
                                })

                                attachment.s3Key = fileName
                            } catch (error) {
                                console.log("====Flagged collections====")
                                console.log(error, attachment);

                                throw error;
                            }
                        }
                    }
                    val.data.attachments = originVal.data.attachments
                    
                    val.body = Utils.html2plainText(val.data?.content);
                    val.archiveId = app.archiveId;
                    val.workspaceName = ms365Workspace.displayName;
                    val.userId = ms365Workspace.clientId; // deprecated
                    val.owner = app.owner;
                    val.createdBy = app.createdBy;
                    val.createdAt = flaggedArchive.createdAt;
                    val.archiveName = app.filters.jobName;
                    val.hash = Utils.generateHash(originVal)
                    addIndex({
                        index: config.ELASTIC_INFO.FLAGGED_INDEX,
                        id: `${flaggedArchive._id}_${originVal.data.id}`,
                        body: val
                    });
                    messageIds.push({ id: val.data.id, attachments: val.data.attachments });
                    originVal.hash = val.hash
                } else if (val.type === 'gmail') {
                    try {
                        let auth;
                        const googleWorkspace = await GoogleWorkspace.findById(val.data.workspaceId);
                        if (val.data.isPersonal !== 'true') {
                            auth = await google.auth.getClient({
                                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                                clientOptions: { subject: val.data.userId },
                            });
                        } else {
                            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
                        }

                        const gmail = google.gmail({ version: 'v1', auth: val.data.isPersonal !== 'true' ? auth : oauth2ClientTest });

                        // get full message of gmail
                        const messageDetails = await gmail.users.messages.get({
                            userId: 'me',
                            id: val.data.id,
                            format: 'full',
                        })

                        const getAttachments = (parts) => {
                            if (!parts) return [];
                            const attachments = [];
                    
                            parts.forEach((part) => {
                                if (part.body?.attachmentId) {
                                    attachments.push({
                                        attachmentId: part.body.attachmentId,
                                        filename: part.filename,
                                        mimeType: part.mimeType,
                                        size: part.body.size
                                    });
                                } else if (part.parts) {
                                    attachments.push(...getAttachments(part.parts));
                                }
                            });
                    
                            return attachments;
                        };
                    
                        const attachments = getAttachments(messageDetails.data?.payload?.parts);

                        if (attachments.length > 0) {
                            console.log(attachments.length);
                            for (let attachment of attachments) {
                                try {
                                    // Fetch the attachment
                                    const attachmentResponse = await gmail.users.messages.attachments.get({
                                        userId: 'me',
                                        messageId: val.data.id,
                                        id: attachment.attachmentId,
                                    });

                                    const attachmentData = attachmentResponse.data.data; // Base64 encoded attachment data
                                    const attachmentBuffer = Buffer.from(attachmentData, 'base64');
                                    const fileName = `FlaggedCollections/${flaggedArchive.id}_${attachment.attachmentId}`;
                                    await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, fileName, attachmentBuffer);
                                    totalSize += parseInt(attachment.size);
                                    //Add queue to index file contents to ElasticSearch
                                    await Utils.addIndexQueue('FlaggedCollections', {
                                        workspaceId: app.appId,
                                        archiveId: app.archiveId,
                                        fileId: attachment.attachmentId,
                                        fileName: attachment.filename,
                                        fileType: attachment.mimeType,
                                        size: attachment.size,
                                        s3Key: fileName,
                                        owner: app.owner,
                                        collectedBy: app.createdBy
                                    })

                                    attachment.s3Key = fileName
                                } catch (error) {
                                    console.log("====Flagged collections====")
                                    console.log(error, attachment);

                                    throw error;
                                }
                            }

                            val.data.attachments = attachments
                            originVal.data.attachments = attachments
                        }
                        const getHtmlPart = (parts) => {
                            if (!parts) return '';
                            const part = parts.find(part => part.mimeType === 'text/html' || part.parts);
                            if (part) {
                                if (part.mimeType === 'text/html') {
                                    return part.body.data;
                                }
                                if (part.parts) {
                                    return getHtmlPart(part.parts);
                                }
                            }
                            return null;
                        };
                        const base64urlToBase64 = (base64url) => {
                            let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
                            while (base64.length % 4) {
                                base64 += '=';
                            }
                            return base64;
                        }
                        const decodeBase64 = (base64) => {
                            const bytes = atob(base64);
                            return decodeURIComponent(escape(bytes));
                        }
                        const decodeGmailData = (encodedData) => {
                            const base64 = base64urlToBase64(encodedData);
                            return decodeBase64(base64);
                        }
                        const getSafeHTMLContent = (emailData) => {
                            if (!emailData) return '';
                            const payload = emailData.payload;
                            let encodedHtml = '';
                            if (payload?.mimeType === 'text/html') {
                                encodedHtml = payload.body.data;
                            } else {
                                encodedHtml = getHtmlPart(payload.parts);
                            }
                            const decodedHtml = decodeGmailData(encodedHtml);
                            return decodedHtml;
                        };
                        const html = getSafeHTMLContent(messageDetails.data)
                        val.body = Utils.html2plainText(html);
                        val.data.html = html
                        val.data.attachments = attachments
                        originVal.data.attachments = attachments
                        originVal.data.html = html
                        val.archiveId = app.archiveId;
                        val.workspaceName = googleWorkspace.displayName;
                        val.userId = googleWorkspace.clientId; // deprecated
                        val.owner = app.owner;
                        val.createdBy = app.createdBy;
                        val.createdAt = flaggedArchive.createdAt;
                        val.archiveName = app.filters.jobName;
                        val.hash = Utils.generateHash(originVal)
                        addIndex({
                            index: config.ELASTIC_INFO.FLAGGED_INDEX,
                            id: `${flaggedArchive._id}_${originVal.data.id}`,
                            body: val
                        });
                        messageIds.push({ id: val.data.id, attachments: attachments });
                        originVal.hash = val.hash
                    } catch (error) {
                        console.log("====Flagged error====")
                        console.log(error);

                        throw error;
                    }
                } else if (val.type === 'googledrive') {
                    try {
                        let auth;
                        const googleWorkspace = await GoogleWorkspace.findById(val.data.workspaceId);
                        if (val.data.isPersonal !== 'true') {
                            auth = await google.auth.getClient({
                                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                                clientOptions: { subject: val.data.userId },
                            });
                        } else {
                            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
                        }

                        const drive = google.drive({ version: 'v3', auth: val.data.isPersonal !== 'true' ? auth : oauth2ClientTest });
                        try {
                            let response;
                            if (googleMimeTypes.includes(val.data.type)) {
                                let exportMime;
                                switch(val.data.type) {
                                    case 'application/vnd.google-apps.document':
                                        exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                        break;
                                    case 'application/vnd.google-apps.spreadsheet':
                                        exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                        break;
                                    case 'application/vnd.google-apps.presentation':
                                        exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                                        break;
                                    default:
                                        exportMime = 'application/pdf';
                                }
                
                                response = await drive.files.export({
                                    fileId: val.data.id,
                                    mimeType: exportMime
                                }, { responseType: 'stream' });
                            } else {
                                response = await drive.files.get(
                                    { fileId: val.data.id, alt: 'media' },
                                    { responseType: 'stream' }
                                );
                            }
        
                            const s3Key = `FlaggedCollections/${app.archiveId}/${val.data.id}/${val.data.label}`;
                            const passStream = new PassThrough();
                            response.data.pipe(passStream);
                            await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, s3Key, passStream);
                            console.log(`File uploaded to S3: ${s3Key}`);
                            totalSize += parseInt(val.data.size)
                            //Add queue to index file contents to ElasticSearch
                            await Utils.addIndexQueue('FlaggedCollections', {
                                workspaceId: app.appId,
                                archiveId: app.archiveId,
                                fileId: val.data.id,
                                fileName: val.data.label,
                                fileType: val.data.type,
                                size: val.data.size,
                                s3Key,
                                owner: app.owner,
                                collectedBy: app.createdBy
                            })
                            originVal.s3Key = s3Key;
                            val.s3Key = s3Key
                        } catch (error) {
                            console.error('Error downloading file from Google Drive:', error);
                        }
                        val.archiveId = app.archiveId;
                        val.workspaceName = googleWorkspace.displayName;
                        val.userId = googleWorkspace.clientId; // deprecated
                        val.owner = app.owner;
                        val.createdBy = app.createdBy;
                        val.createdAt = flaggedArchive.createdAt;
                        val.archiveName = app.filters.jobName;
                        addIndex({
                            index: config.ELASTIC_INFO.FLAGGED_INDEX,
                            id: `${flaggedArchive._id}_${originVal.data.id}`,
                            body: val
                        });

                        messageIds.push({ id: val.data.id });
                    } catch (error) {
                        console.log("====Flagged google drive error====")
                        console.log(error);

                        throw error;
                    }
                } else if (val.type === 'onedrive') {
                    const ms365Workspace = await MS365Workspace.findById(val.data.workspaceId)
                    let token = await ms365Controller.getAccessToken(ms365Workspace.orgId);
                    if (!token) {
                        app.state = 'error';
                        app.note = 'No token';
                        await app.save();
                        return false;
                    }

                    val.hash = Utils.generateHash(val);
                    val.workspaceName = ms365Workspace.displayName;
                    val.userId = ms365Workspace.clientId; //deprecated
                    val.owner = app.owner;
                    val.collectedBy = app.createdBy;
                    val.archiveId = flaggedArchive._id;
                    val.createdAt = flaggedArchive.createdAt;
                    val.archiveName = app.filters.jobName;
                    const fileArr = val.data.name.split(".");
                    const fileType = fileArr[fileArr.length-1];
                    const downloadUrl = `https://graph.microsoft.com/v1.0/users/${val.data.userId}/drive/items/${val.data.id}/content`;
                    
                    const fileResponse = await axios({
                        method: 'get',
                        url: downloadUrl,
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        responseType: 'stream'
                    });
                    originVal.s3Key = `FlaggedCollections/${flaggedArchive._id}/${val.data.id}/${val.data.name}`;
                    val.s3Key = originVal.s3Key
                    originVal.hash = val.hash
                    const passStream = new PassThrough();
                    fileResponse.data.pipe(passStream);
                    await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, originVal.s3Key, passStream);
                    totalSize += parseInt(val.data.size)

                    // //Add queue to index file contents to ElasticSearch
                    addIndex({
                        index: config.ELASTIC_INFO.FLAGGED_INDEX,
                        id: `${flaggedArchive._id}_${originVal.data.id}`,
                        body: val
                    });
                    await Utils.addIndexQueue('FlaggedCollections', {
                        workspaceId: app.appId,
                        archiveId: app.archiveId,
                        fileId: val.data.id,
                        fileName: val.data.name,
                        fileType,
                        size: val.data.size,
                        s3Key: originVal.s3Key,
                        owner: app.owner,
                        collectedBy: app.createdBy
                    })

                    messageIds.push({ id: val.data.id });
                } else if (val.type === 'dropbox') {
                    const dropboxWorkspace = await DropboxWorkspace.findById(val.data.workspaceId);
                    if (!dropboxWorkspace) {
                        app.state = 'error';
                        app.note = 'Dropbox Workspace not found';
                        await app.save();
                        return false;
                    }

                    let accessToken = await dropboxController.refreshAccessToken(dropboxWorkspace.refreshToken, dropboxWorkspace.isPersonal);
                    if (!accessToken) {
                        app.state = 'error';
                        app.note = 'No token';
                        await app.save();
                        return false;
                    }

                    const accountId = await dropboxController.getMemberId(val.data.workspaceId, val.data.userId)
        
                    const dbx = new Dropbox({
                        accessToken,
                        selectUser: dropboxWorkspace.isPersonal == true ? null : accountId,
                    });

                    const resp = await dbx.filesDownload({ path: val.data.path });
                    originVal.s3Key = `FlaggedCollections/${app.archiveId}/${val.data.id}/${val.data.label}`;
                    await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, originVal.s3Key, resp.result.fileBinary);
                    totalSize += parseInt(val.data.size)

                    val.archiveId = flaggedArchive._id
                    val.workspaceName = dropboxWorkspace.displayName
                    val.userId = app.createdBy
                    val.owner = app.owner
                    val.createdBy = app.createdBy
                    val.archiveName = app.filters.jobName
                    val.s3Key = originVal.s3Key
                    const fileArr = val.data.label.split(".");
                    const fileType = fileArr[fileArr.length-1];
                    addIndex({
                        index: config.ELASTIC_INFO.FLAGGED_INDEX,
                        id: `${flaggedArchive._id}_${originVal.data.id}`,
                        body: val
                    });

                    await Utils.addIndexQueue('FlaggedCollections', {
                        workspaceId: app.appId,
                        archiveId: app.archiveId,
                        fileId: val.data.id,
                        fileName: val.data.label,
                        fileType,
                        size: val.data.size,
                        s3Key: originVal.s3Key,
                        owner: app.owner,
                        collectedBy: app.createdBy
                    })

                    messageIds.push({ id: val.data.id });
                } else if (val.type === 'slack') {
                    try {
                        const slackTeam = await SlackTeam.findOne({ _id: val.data.teamId });
                        const slackMember = await SlackMember.findOne({ team: val.data.teamId, user_id: val.data.userId });

                        if (originVal.data?.files) {
                            for (let i = 0; i < originVal.data.files.length; i++) {
                                const attachment = originVal.data.files[i]
                                try {
                                    const response = await axios({
                                        method: 'GET',
                                        url: attachment.url_private,
                                        headers: { Authorization: `Bearer ${slackMember.access_token || slackTeam.accessToken}` },
                                        responseType: 'stream'
                                    })
                                    const s3Key = `FlaggedCollections/${app.archiveId}/${attachment.id}/${attachment.name}`;
                                    const passStream = new PassThrough();
                                    response.data.pipe(passStream);
                                    await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, s3Key, passStream);
                                    totalSize += parseInt(attachment.size)
                                    //Add queue to index file contents to ElasticSearch
                                    await Utils.addIndexQueue('FlaggedCollections', {
                                        workspaceId: app.appId,
                                        archiveId: app.archiveId,
                                        fileId: attachment.id,
                                        fileName: attachment.name,
                                        fileType: attachment.filetype,
                                        size: attachment.size,
                                        s3Key,
                                        owner: app.owner,
                                        collectedBy: app.createdBy
                                    })

                                    attachment.s3Key = s3Key
                                    val.data.files[i].s3Key = s3Key
                                } catch (error) {
                                    console.log("====Flagged collections====")
                                    console.log(error, attachment);
    
                                    throw error;
                                }
                            }
                        }
                        
                        val.body = val.data?.message;
                        val.archiveId = app.archiveId;
                        val.workspaceName = slackTeam.displayName;
                        val.userId = app.owner; // deprecated
                        val.owner = app.owner;
                        val.createdBy = app.createdBy;
                        val.createdAt = flaggedArchive.createdAt;
                        val.archiveName = app.filters.jobName;
                        val.hash = Utils.generateHash(originVal)
                        addIndex({
                            index: config.ELASTIC_INFO.FLAGGED_INDEX,
                            id: `${flaggedArchive._id}_${originVal.data.ts}`,
                            body: val
                        });
                        messageIds.push({ id: val.data.ts, attachments: val.data.files });
                        originVal.hash = val.hash
                    } catch (error) {
                        throw error
                    }
                }
                messageQueue.push(originVal)
                if (messageQueue.length >= 300) {
                    const backedUpSize = messageQueue.reduce((acc, msg) => acc + Utils.getObjectBytes(msg), 0);
                    console.log(messageQueue)
                    const { dataId } = await Utils.saveLargeData(messageQueue, backupId);
                    totalSize += backedUpSize
                    await FlaggedArchive.updateOne(
                        { _id: flaggedArchive._id },
                        { size: totalSize, $push: { backups: dataId }, $inc: { totalCount: messageQueue.length } }
                    );

                    await BackupMessages.create({
                        archiveId: flaggedArchive._id,
                        backupId,
                        dataId,
                        messageIds: messageIds
                    });
                    await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: messageQueue.length } });
                    messageQueue = [] //reset message queue
                    messageIds = []
                }
            }
            console.log('messageQueue.length:', messageQueue.length);
            // process remaining message queue
            if (messageQueue.length > 0) {
                const backedUpSize = messageQueue.reduce((acc, msg) => acc + Utils.getObjectBytes(msg), 0);
                totalSize += backedUpSize
                const { dataId } = await Utils.saveLargeData(messageQueue, backupId);

                await FlaggedArchive.updateOne(
                    { _id: flaggedArchive._id },
                    { size: totalSize, $push: { backups: dataId }, $inc: { totalCount: messageQueue.length } }
                );

                await BackupMessages.create({
                    archiveId: flaggedArchive._id,
                    backupId,
                    dataId,
                    messageIds: messageIds
                });
                await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: messageQueue.length } });
                messageQueue = [] //reset message queue
                messageIds = []
            }

            if (user) {
                totalSize += flaggedArchive.backups.reduce((acc, backup) => acc + Utils.getObjectBytes(backup), 0);
                await Utils.sendArchiveCompletionMail(user.email, {
                    id: flaggedArchive._id.toString(),
                    type: 'FlaggedCollections',
                    size: Utils.formatSizeUnits(totalSize),
                    name: flaggedArchive.jobName,
                    date: new Date().toISOString(),
                    newBackupFilesCnt: flaggedArchive.backups.length * 300,
                    newBackupFileSize: Utils.formatSizeUnits(totalSize),
                    jobName: app.filters.jobName,
                    note: ''
                });
            }

            app.state = 'completed';
            await app.save()
            return true
        } catch (error) {
            app.state = 'error';
            app.note = error.message;
            const currentApp = await ArchiveState.findById(app._id);

            if (user) {
                await Utils.sendArchiveFailedMail(user.email, {
                    id: currentApp.archiveId,
                    type: currentApp.detailType,
                    name: currentApp.filters.jobName,
                    date: new Date().toISOString(),
                    jobName: app.filters.jobName,
                    note: error.message
                });
            }
        }
    } else if (app.type === 'MS365') {
        const ms365Workspace = await MS365Workspace.findOne({ _id: app.appId });
        if (!ms365Workspace) {
            app.state = 'error';
            app.note = 'MS365 Workspace not found';
            await app.save();
            return false;
        }

        let token = await ms365Controller.getAccessToken(ms365Workspace.orgId);
        if (!token) {
            app.state = 'error';
            app.note = 'No token';
            await app.save();
            return false;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const user = await User.findOne({ _id: ms365Workspace.clientId });

        try {
            for (let email of app.filters.userEmail) {
                for (let applicationItem of app.filters.application) {
                    const itemFilters = {
                        jobName: app.filters.jobName,
                        userEmail: email,
                        application: applicationItem,
                        keywords: app.filters.keywords,
                        filterByDateRange: app.filters.filterByDateRange,
                        dateRange: app.filters.dateRange,
                        recipientName: app.filters.recipientName,
                        attachmentName: app.filters.attachmentName,
                        filterWithContent: app.filters.filterWithContent
                    };
                    
                    if (applicationItem === 'Outlook') {
                        let messageQueue = [];
                        let outlookArchive;
                        const backupId = new ObjectId().toHexString(); // Created once
                        let totalSize = 0

                        outlookArchive = await OutlookArchive.findById(app.archiveId);
                        const allFolders = await Utils.fetchAllFolders(token, itemFilters.userEmail);
                        const processBatch = async (messages, folderPath, token, orgId, onTokenRefresh) => {
                            for (let message of messages) {
                                if (message.hasAttachments) {
                                    // Fetch attachment metadata with rate limit handling
                                    const attachmentsQuery = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments?$select=id,name,size,contentType`;
                                    const attachmentsResponse = await Utils.fetchGraphAPIWithRateLimit(attachmentsQuery, { headers: {Authorization: `Bearer ${token}`} }, onTokenRefresh, orgId);
                                    message.attachments = attachmentsResponse.value;
                        
                                    // Fetch each attachment content with rate limit handling
                                    for (let attachment of message.attachments) {
                                        try {
                                            const attachmentContentUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(itemFilters.userEmail)}/messages/${message.id}/attachments/${attachment.id}/$value`;
                                            
                                            const attachmentContent = await Utils.fetchGraphAPIWithRateLimit(attachmentContentUrl, { headers: {Authorization: `Bearer ${token}`}, responseType: 'arraybuffer' }, onTokenRefresh, orgId);
                                            const fileName = `Outlook/${outlookArchive.id}_${attachment.id}`;
                                            await AWS.uploadFile(config.AWS.OUTLOOK_BUCKET, fileName, attachmentContent);
                                            totalSize += attachment.size
                                            //Add queue to index file contents to ElasticSearch
                                            await Utils.addIndexQueue('Outlook', {
                                                workspaceId: app.appId,
                                                archiveId: app.archiveId,
                                                fileId: attachment.id,
                                                fileName: attachment.name,
                                                fileType: attachment.contentType,
                                                size: attachment.size,
                                                s3Key: fileName,
                                                owner: app.owner,
                                                collectedBy: app.createdBy
                                            })
                                        } catch (error) {
                                            console.log(error, attachment);
                                        }
                                    }
                                }
                                message.folderPath = folderPath;
                                messageQueue.push(message);
                                if (messageQueue.length >= 300) {
                                    await handleBatchProcessing();
                                }
                            }
                        };

                        const handleBatchProcessing = async () => {
                            const newMsgs = [];
                            let messageIds = [];
                            console.info('Indexing outlook messages to ElasticSearch...');
                            for (let val of messageQueue) {
                                const originVal = { ...val };
                                val.body = Utils.html2plainText(val.body?.content);
                                val.archiveId = outlookArchive._id;
                                val.workspaceName = ms365Workspace.displayName;
                                val.userId = ms365Workspace.clientId; // deprecated
                                val.owner = app.owner;
                                val.createdBy = app.createdBy;
                                val.createdAt = outlookArchive.createdAt;
                                val.archiveName = app.filters.jobName;
                                val.hash = Utils.generateHash(originVal)
                                addIndex({
                                    index: config.ELASTIC_INFO.OUTLOOK_INDEX,
                                    id: `${outlookArchive._id}_${val.id}`,
                                    body: val
                                });
                                messageIds.push({ id: val.id, attachments: val.attachments });

                                originVal.hash = val.hash
                                newMsgs.push(originVal)
                            }
                            const backedUpSize = newMsgs.reduce((acc, msg) => acc + Utils.getObjectBytes(msg), 0);
                            const { dataId } = await Utils.saveLargeData(newMsgs, backupId);
                            totalSize += backedUpSize
                            await OutlookArchive.updateOne(
                                { _id: outlookArchive._id },
                                { size: totalSize, $push: { backups: dataId }, $inc: { totalCount: messageQueue.length } }
                            );

                            await BackupMessages.create({
                                archiveId: outlookArchive._id,
                                backupId,
                                dataId,
                                messageIds: messageIds
                            });

                            console.info('Done indexing outlook messages');
                            console.log("Update ArchiveState");
                            await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: messageQueue.length } });
                            messageQueue = []; // Reset the queue
                        };

                        for (let folder of allFolders) {
                            await Utils.fetchOutlookMessages(token, { ...itemFilters, folderId: folder.id }, ms365Workspace.orgId, async newToken => {
                                token = newToken;
                            }, messages => processBatch(messages, folder.path, token, ms365Workspace.orgId, async newToken => {
                                token = newToken;
                            }));
                        }                    

                        if (messageQueue.length > 0) {
                            await handleBatchProcessing();
                        }

                        if (user) {
                            totalSize += outlookArchive.backups.reduce((acc, backup) => acc + Utils.getObjectBytes(backup), 0);
                            await Utils.sendArchiveCompletionMail(user.email, {
                                id: outlookArchive._id.toString(),
                                type: 'Outlook',
                                size: Utils.formatSizeUnits(totalSize),
                                name: ms365Workspace.displayName,
                                date: new Date().toISOString(),
                                newBackupFilesCnt: outlookArchive.backups.length * 300,
                                newBackupFileSize: Utils.formatSizeUnits(totalSize),
                                jobName: app.filters.jobName,
                                note: ''
                            });
                        }
                    } else if (applicationItem === 'OneDrive') {
                        const oneDriveArchive = await OneDriveArchive.findById(app.archiveId);

                        let totalSize = 0;
                        const keywordList = itemFilters.keywords?.toLowerCase().split(",").map(k => k.trim()) || [];
                        const start = itemFilters.filterByDateRange && new Date(itemFilters.dateRange.start)
                        const end = itemFilters.filterByDateRange && new Date(itemFilters.dateRange.end)

                        const processFolder = async (folderId = 'root', path = '') => {
                            const nodes = [];
                            const processData = async (data) => {
                                for (let item of data.value) {
                                    const nameMatches = keywordList.length === 0 || keywordList.some(keyword =>
                                        item.name.toLowerCase().includes(keyword)
                                    );
                                    const createdDate = new Date(item.createdDateTime);
                                    let lastModifiedDateTime = undefined
                                    if (item.lastModifiedDateTime)
                                        lastModifiedDateTime = new Date(item.lastModifiedDateTime)
                                    const inDateRange1 = (!start || createdDate >= start) && (!end || createdDate <= end);
                                    const inDateRange2 = lastModifiedDateTime && (!start || lastModifiedDateTime >= start) && (!end || lastModifiedDateTime <= end);
                                    const matches = nameMatches && (inDateRange1 || inDateRange2)
                                    const node = {
                                        id: item.id,
                                        baseId: oneDriveArchive._id,
                                        name: item.name,
                                        path: `${path}/${item.name}`,
                                        isFolder: item.folder !== undefined,
                                        downloadUrl: item.folder !== undefined ? '' : item['@microsoft.graph.downloadUrl'],
                                        size: item.size
                                    };
    
                                    if (!node.isFolder && node.downloadUrl && matches) {
    
                                        item.hash = Utils.generateHash(item);
                                        item.workspaceName = ms365Workspace.displayName;
                                        item.userId = ms365Workspace.clientId; //deprecated
                                        item.owner = app.owner;
                                        item.collectedBy = app.createdBy;
                                        item.archiveId = oneDriveArchive._id;
                                        item.createdAt = oneDriveArchive.createdAt;
                                        item.archiveName = itemFilters.jobName;
                                        const processVesrions = async (data) => {
                                            const versions = []
                                            for (let version of data.value) {
                                                const resp = await axios({
                                                    url: version['@microsoft.graph.downloadUrl'],
                                                    method: 'GET',
                                                    responseType: 'stream'
                                                });
            
                                                version.s3Key = `${oneDriveArchive._id}/${item.id}/${version.id}_${item.name}`;
                                                const passStream = new PassThrough();
                                                resp.data.pipe(passStream);
                                                await AWS.uploadFileStream(config.AWS.OUTLOOK_BUCKET, version.s3Key, passStream);
                                                totalSize += version.size
                                                await OneDriveArchive.updateOne({_id: app.archiveId}, {size: totalSize})
                                                versions.push(version)

                                                // //Add queue to index file contents to ElasticSearch
                                                await Utils.addIndexQueue('Onedrive', {
                                                    workspaceId: app.appId,
                                                    archiveId: app.archiveId,
                                                    fileId: `${item.id}_${version.id}`,
                                                    fileName: item.name,
                                                    fileType: item.file?.mimeType,
                                                    size: item.size,
                                                    s3Key: version.s3Key,
                                                    owner: app.owner,
                                                    collectedBy: app.createdBy
                                                })
                                            }
                                            node.versions = versions
                                            item.versions = versions
                                        }
                                        // Get version info of the file
                                        await Utils.fetchGraphAPIData2({
                                            accessToken: token,
                                            orgId: ms365Workspace.orgId,
                                            apiEndpoint: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/drive/items/${node.id}/versions`,
                                            processData: processVesrions,
                                            onTokenRefresh: async newToken => {
                                                token = newToken;
                                                headers.Authorization = `Bearer ${token}`;
                                            },
                                        });

                                        addIndex({
                                            index: config.ELASTIC_INFO.ONEDRIVE_INDEX,
                                            id: `${oneDriveArchive._id}_${item.id}`,
                                            body: item
                                        });

                                        await ArchiveState.updateOne({ _id: app.id }, { $inc: { processedCount: 1 } });
                                    }
                                    
                                    if (node.isFolder) {
                                        node.children = await processFolder(node.id, node.path);
                                    }
                                    if (matches)
                                        nodes.push(node);
                                }
                            };
    
                            await Utils.fetchGraphAPIData2({
                                accessToken: token,
                                orgId: ms365Workspace.orgId,
                                apiEndpoint: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/drive/items/${folderId}/children`,
                                processData,
                                onTokenRefresh: async newToken => {
                                    token = newToken;
                                    headers.Authorization = `Bearer ${token}`;
                                }
                            });
    
                            return nodes; // Return the children nodes
                        };
    
                        const result = await processFolder();
                        const { dataId, dataSize } = await Utils.saveLargeData(result, new ObjectId().toHexString());
    
                        await OneDriveArchive.updateOne(
                            { _id: oneDriveArchive._id },
                            { dataId, size: (totalSize + dataSize) }
                        );

                        if (user) {
                            await Utils.sendArchiveCompletionMail(user.email, {
                                id: oneDriveArchive._id.toString(),
                                type: 'OneDrive',
                                size: Utils.formatSizeUnits(totalSize + dataSize),
                                name: ms365Workspace.displayName,
                                date: new Date().toISOString(),
                                jobName: app.filters.jobName,
                                note: ''
                            });
                        }
                    }
                }
            }
            app.state = 'completed';
        } catch (error) {
            app.state = 'error';
            app.note = error.message;
            const currentApp = await ArchiveState.findById(app._id);

            if (user) {
                await Utils.sendArchiveFailedMail(user.email, {
                    id: currentApp.archiveId,
                    type: currentApp.detailType,
                    name: currentApp.filters.jobName,
                    date: new Date().toISOString(),
                    jobName: app.filters.jobName,
                    note: error.message
                });
            }
        }

        await app.save();
        return true;
    } else if (app.type === 'Google') {
        const googleWorkspace = await GoogleWorkspace.findOne({ _id: app.appId })
        if (!googleWorkspace) {
            app.state = 'error'
            app.note = 'Google Workspace not found'
            await app.save()
            return false
        }
        const user = await User.findOne({ _id: googleWorkspace.clientId })
        try {
            for (let email of app.filters.userEmail) {
                for (let applicationItem of app.filters.application) {
                    const itemFilters = {
                        jobName: app.filters.jobName,
                        userEmail: email,
                        application: applicationItem,
                        keywords: app.filters.keywords,
                        filterByDateRange: app.filters.filterByDateRange,
                        dateRange: app.filters.dateRange,
                        recipientName: app.filters.recipientName,
                        attachmentName: app.filters.attachmentName,
                        stateId: app.id,
                        owner: app.owner,
                        createdBy: app.createdBy
                    }
                    if (applicationItem === 'Gmail') {
                        const gmailArchive = await GmailArchive.findById(app.archiveId);
                        await Utils.fetchGraphGmailAPIData2(gmailArchive, itemFilters, googleWorkspace);
                        
                        if (gmailArchive && user) {
                            const totalSize = gmailArchive.backups.reduce((acc, backup) => acc + Utils.getObjectBytes(backup), 0);
                            await Utils.sendArchiveCompletionMail(user.email, {
                                id: gmailArchive._id.toString(),
                                type: 'Gmail',
                                size: Utils.formatSizeUnits(totalSize),
                                name: googleWorkspace.displayName,
                                date: new Date().toISOString(),
                                newBackupFilesCnt: gmailArchive.backups.length * 300,
                                newBackupFileSize: Utils.formatSizeUnits(totalSize),
                                jobName: app.filters.jobName,
                                note: '',
                            });
                        }
                    } else if (applicationItem === 'Drive') {
                        const googleDriveArchive = await DriveArchive.findById(app.archiveId);

                        const addElasticIndex = (file) => {
                            file.archiveId = googleDriveArchive._id
                            file.workspaceName = googleWorkspace.displayName
                            file.userId = googleWorkspace.clientId
                            file.owner = app.owner
                            file.createdBy = app.createdBy
                            file.createdAt = googleWorkspace.createdAt
                            file.archiveName = itemFilters.jobName
                            addIndex({
                                index: config.ELASTIC_INFO.GOOOGLEDRIVE_INDEX,
                                id: `${googleDriveArchive._id}_${file.id}`,
                                body: file
                            })
                        }

                        const {data, totalSize} = await Utils.fetchGraphDriveAPIData_v2(itemFilters, app.archiveId, addElasticIndex, googleWorkspace)
                        console.log("==============Result=================")
                        console.log(data)
                        if (data.length) {
                            const backedUpSize = Utils.getObjectBytes(data)
                            const formattedSize = Utils.formatSizeUnits(backedUpSize + totalSize)
                            const backupId = new ObjectId().toHexString()
                            const { dataId } = await Utils.saveLargeData(data, backupId)
    
                            await DriveArchive.updateOne({_id: googleDriveArchive._id}, {
                                filters: itemFilters,
                                backups: [{ id: backupId, dataId }],
                                size: backedUpSize + totalSize,
                                clientId: googleWorkspace.clientId
                            })
    
                            if (user) {
                                await Utils.sendArchiveCompletionMail(user.email, {
                                    id: backupId,
                                    size: formattedSize,
                                    type:'Google Drive',
                                    name: googleWorkspace.displayName,
                                    date: new Date().toISOString(),
                                    newBackupFilesCnt: data.length,
                                    newBackupFileSize: formattedSize,
                                    jobName: app.filters.jobName,
                                    note: ''
                                })
                            }
                        }
                    }
                }
            }

            app.state = 'completed'
        } catch (error) {
            app.state = 'error';
            app.note = error.message;
            const currentApp = await ArchiveState.findById(app._id);

            if (user) {
                await Utils.sendArchiveFailedMail(user.email, {
                    id: currentApp.archiveId,
                    name: currentApp.filters.jobName,
                    type: currentApp.detailType,
                    date: new Date().toISOString(),
                    jobName: app.filters.jobName,
                    note: currentApp.note
                });
            }
        }
        
        await app.save()

        return true
    } else if (app.type === 'Dropbox') {
        const dropboxWorkspace = await DropboxWorkspace.findById(app.appId);
        const user = await User.findOne({ _id: dropboxWorkspace.owner })
        if (!dropboxWorkspace) {
            app.state = 'error';
            app.note = 'Dropbox Workspace not found';
            await app.save();
            return false;
        }

        let accessToken = await dropboxController.refreshAccessToken(dropboxWorkspace.refreshToken, dropboxWorkspace.isPersonal);
        if (!accessToken) {
            app.state = 'error';
            app.note = 'No token';
            await app.save();
            return false;
        }
        
        try {
            const dropboxArchive = await DropboxArchive.findById(app.archiveId);
            for (const userEmail of app.filters.userEmail) {
                const accountId = await dropboxController.getMemberId(app.appId, userEmail)
        
                const dbx = new Dropbox({
                    accessToken,
                    selectUser: dropboxWorkspace.isPersonal == true ? null : accountId,
                });

                const itemFilters = {
                    jobName: app.filters.jobName,
                    userEmail,
                    keywords: app.filters.keywords,
                    filterByDateRange: app.filters.filterByDateRange,
                    dateRange: app.filters.dateRange,
                    stateId: app.id,
                    owner: app.owner,
                    createdBy: app.createdBy,
                    archiveId: dropboxArchive._id
                }
    
                const addElasticIndex = (file) => {
                    file.archiveId = dropboxArchive._id
                    file.workspaceName = dropboxWorkspace.displayName
                    file.userId = dropboxArchive.createdBy
                    file.owner = app.owner
                    file.createdBy = app.createdBy
                    file.createdAt = dropboxWorkspace.createdAt
                    file.archiveName = itemFilters.jobName
                    console.log("Indexing....")
                    console.log(file)
                    addIndex({
                        index: config.ELASTIC_INFO.DROPBOX_INDEX,
                        id: `${dropboxArchive._id}_${file.id}`,
                        body: file
                    })
                }

                const updateProgress = async () => {
                    await ArchiveState.updateOne({ archiveId: app.archiveId }, { $inc: { processedCount: 1 } });
                }

                try {
                    
                    const data = await Utils.fetchGraphDropboxAPIData(itemFilters, dbx, dropboxWorkspace, addElasticIndex, updateProgress)
        
                    // console.log('dropbox archive data:', JSON.stringify(data, null, 2))
                    console.log(data)
                    if (data.files.length || data.shared.length || data.deleted.length) {
                        const backedUpSize = Utils.getObjectBytes(data)
                        const formattedSize = Utils.formatSizeUnits(backedUpSize + data.totalFileSize)
                        const backupId = new ObjectId().toHexString()
                        const { dataId } = await Utils.saveLargeData(data, backupId)
        
                        await DropboxArchive.updateOne({_id: dropboxArchive._id}, {
                            filters: itemFilters,
                            backups: [{ id: backupId, dataId }],
                            size: backedUpSize + data.totalFileSize,
                        })
        
                        if (user) {
                            await Utils.sendArchiveCompletionMail(user.email, {
                                id: backupId,
                                size: formattedSize,
                                name: dropboxWorkspace.displayName,
                                type: 'Dropbox',
                                account: userEmail,
                                date: new Date().toISOString(),
                                newBackupFilesCnt: data.files.length + data.shared.length + data.deleted.length,
                                newBackupFileSize: formattedSize,
                                jobName: app.filters.jobName,
                                note: ''
                            })
                        }
                    }
                } catch (error) {
                    console.log(error)
                    throw error;
                }
            }
            app.state = 'completed'
        } catch (error) {
            console.log('dropbox archive error:', error)
            app.state = 'error'
            app.note = error.message;
            const currentApp = await ArchiveState.findById(app._id);

            if (user) {
                await Utils.sendArchiveFailedMail(user.email, {
                    id: currentApp.archiveId,
                    name: currentApp.filters.jobName,
                    type: currentApp.detailType,
                    date: new Date().toISOString(),
                    jobName: currentApp.filters.jobName,
                    note: error.message
                });
            }
        }
        
        await app.save()

        return true
    }
}

exports.processArchive2 = async (archiveList, note) => {
    for (const item of archiveList) {
        if (item.type === 'Slack') {
            const team = await SlackTeam.findOne({ _id: item.id })
            const archiveState = await ArchiveState.create({
                type: 'Slack',
                appId: item.id,
                state: 'queued',
                note
            })
            team.archiveState = archiveState
            await team.save()
        }
        //TO-DO other apps like googleworkspace microsoft365 etc
    }
}

exports.archives = async (req, res) => {
    let result = {}
    let slackArchives = []
    slackArchives = await Utils.slackArchives(req.userId)
    let tmp = await Utils.invitedArchives(req.userId, 'slack')
    if (tmp && tmp.length > 0) {
        if (slackArchives && slackArchives.length > 0) {
            slackArchives = slackArchives.concat(tmp)
        } else {
            slackArchives = tmp
        }
    }
    result['Slack'] = slackArchives 

    let outlookArchives = []
    outlookArchives = await Utils.outlookArchives(req.userId)
    tmp = await Utils.invitedArchives(req.userId, 'outlook')
    if (tmp && tmp.length > 0) {
        if (outlookArchives && outlookArchives.length > 0) {
            outlookArchives = outlookArchives.concat(tmp)
        } else {
            outlookArchives = tmp
        }
    }
    result['Outlook'] = outlookArchives

    let onedriveArchives = []
    onedriveArchives = await Utils.onedriveArchives(req.userId)
    tmp = await Utils.invitedArchives(req.userId, 'onedrive')
    if (tmp && tmp.length > 0) {
        if (onedriveArchives && onedriveArchives.length > 0) {
            onedriveArchives = onedriveArchives.concat(tmp)
        } else {
            onedriveArchives = tmp
        }
    }
    result['OneDrive'] = onedriveArchives

    let gmailArchives = []
    gmailArchives = await Utils.gmailArchives(req.userId)
    tmp = await Utils.invitedArchives(req.userId, 'gmail')
    if (tmp && tmp.length > 0) {
        if (gmailArchives && gmailArchives.length > 0) {
            gmailArchives = gmailArchives.concat(tmp)
        } else {
            gmailArchives = tmp
        }
    }
    result['Gmail'] = gmailArchives

    let gdriveArchives = []
    gdriveArchives = await Utils.gdriveArchives(req.userId)
    tmp = await Utils.invitedArchives(req.userId, 'gdrive')
    if (tmp && tmp.length > 0) {
        if (gdriveArchives && gdriveArchives.length > 0) {
            gdriveArchives = gdriveArchives.concat(tmp)
        } else {
            gdriveArchives = tmp
        }
    }
    result['Drive'] = gdriveArchives

    let dropboxArchives = []
    dropboxArchives = await Utils.dropboxArchives(req.userId)
    tmp = await Utils.invitedArchives(req.userId, 'dropbox')
    if (tmp && tmp.length > 0) {
        if (dropboxArchives && dropboxArchives.length > 0) {
            dropboxArchives = dropboxArchives.concat(tmp)
        } else {
            dropboxArchives = tmp
        }
    }
    result['Dropbox'] = dropboxArchives

    let flaggedArchives = []
    flaggedArchives = await Utils.flaggedArchives(req.userId)
    // tmp = await Utils.invitedArchives(req.userId, 'outlook')
    // if (tmp && tmp.length > 0) {
    //     if (outlookArchives && outlookArchives.length > 0) {
    //         outlookArchives = outlookArchives.concat(tmp)
    //     } else {
    //         outlookArchives = tmp
    //     }
    // }
    result['FlaggedCollections'] = flaggedArchives

    admin.logActions(req, { actionType: 'Get archives', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, data: result })
}

exports.applyArchives = async (req, res) => {
    await exports.processArchive2(req.body, `Manually archived`)
    admin.logActions(req, { actionType: 'Run archive', actionDetails: '', actionResult: 'Success' })
    res.json({ ok: true, data: [] })
}

exports.archivesLog = async (req, res) => {
    let result = []
    result = await ArchiveLog.find({}).sort({ createdAt: -1 })

    res.json({ ok: true, data: result })
}

exports.getArchiveCronTime = async (req, res) => {
    let time = -1
    const row = await ArchiveCron.findOne({ userid: req.userId })
    if (row) {
        time = row.time
    }
    res.json({ ok: true, data: time })
}

exports.setArchiveCronTime = async (req, res) => {
    const time = req.body
    const archive_cron_row = await ArchiveCron.findOne({ userid: req.userId })
    if (archive_cron_row) {
        archive_cron_row.time = time.time
        archive_cron_row.save()
    } else {
        const archive_cron_new_row = await ArchiveCron.create({
            userid: req.userId,
            time: time.time
        })
    }

    res.json({ ok: true })
}

exports.exportAll = async (req, res) => {
    const { userId, teamId, backupId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    const tokenWiredClient = getClient(team.accessToken)
    const archive_row = await SlackArchive.findOne({ team: teamId })

    try {
        const channels = []
        if (archive_row) {
            const backups = archive_row.backups.filter(e => e.id === backupId)
            if (backups.length < 1) {
                return res.json({ ok: true, data: channels })
            }
            const result = backups[0].directChannel
            const data = []
            for (const channel of result.channels) {
                if (channel.user === userId) continue
                const result = await Utils.getConversationHistoryWithThreads({
                    client: tokenWiredClient,
                    channelId: channel.id,
                    startDate,
                    endDate,
                    token: team.accessToken
                })
                data.push({ channel, data: result })
            }
            return res.json({ ok: true, data })
        } else {
            return res.json({ ok: true, data: [] })
        }
    } catch (error) {
        console.error('Error retrieving direct conversations:', error)
        return res.json({ ok: false, error })
    }
}

exports.slackArchiveMembers = async (req, res) => {
    const { teamId } = req.params
    const { members } = req.body
    const slackTeam = await SlackTeam.findById(teamId)
    let owner = ''
    if (slackTeam) {
        owner = slackTeam.clientId
    }
    for (const member of members) {
        const teamUser = await SlackMember.findById(member);
        const slackArchive = await SlackArchive2.create({
            team: teamId,
            memberId: member,
            email: teamUser.email,
            clientId: req.userId, // deprecated
            owner,
            createdBy: req.userId
        })
        await ArchiveState.create({
            type: 'Slack',
            appId: teamId,
            filters: { userId: member },
            state: 'queued',
            userId: req.userId, // deprecated
            archiveId: slackArchive.id,
            owner,
            createdBy: req.userId
        })
    }

    res.json({ ok: true })
}

exports.channels = async (req, res) => {
    const member = await SlackMember.findOne({ team: req.params.id, is_admin: true, is_owner: true, is_primary_owner: true })
    const accessToken = member.access_token
    if (accessToken == '') {
        return res.json({ ok: false, data: 'Administrator & Owner must install the workspace!' })
    }

    const channels = { public: [], private: [], direct: [], group: [] }
    try {
        const archive_row = await Archive.findOne({ team_id: req.params.id })
        if (archive_row) {
            const response = archive_row.channelList
            response.channels.forEach(channel => {
                if (channel.is_private && !channel.is_im && !channel.is_mpim && channel.is_channel) {
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

            const members = await SlackMember.find({ team: req.params.id, is_bot: false }).lean().sort({access_token: 1})
            channels.direct = members.map(user => ({
                id: user.user_id,
                name: user.name,
                display_name: user.display_name || user.real_name,
                avatar: user.avatar,
                color: user.color,
                email: user.email,
                authenticated: user.access_token !== ''
            }))
            // members.forEach(user => {
            //     channels.direct.push({
            //         id: user.user_id,
            //         name: user.name,
            //         display_name: user.display_name || user.real_name,
            //         avatar: user.avatar,
            //         color: user.color,
            //         email: user.email,
            //         authenticated: user.access_token === '' ? false : true
            //     })
            // })
        }
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error(`Error: ${error}`)
        res.json({ ok: true, data: error })
    }
}

exports.channels2 = async (req, res) => {
    const backupId = req.params.backupId
    const member = await SlackMember.findOne({ team: req.params.id, is_admin: true, is_owner: true, access_token: { $ne: '' } })
    const accessToken = member.access_token
    if (accessToken == '') {
        return res.json({ ok: false, data: 'Administrator & Owner must install the workspace!' })
    }

    const channels = { public: [], private: [], direct: [], group: [] }
    try {
        const archive_row = await SlackArchive.findOne({ team: req.params.id })
        if (archive_row) {
            const backups = archive_row.backups.filter(e => e.id === backupId)
            if (backups.length < 1) {
                return res.json({ ok: true, data: channels })
            }
            const response = backups[0].channelList
            response.channels.forEach(channel => {
                if (channel.is_private && !channel.is_im && !channel.is_mpim && channel.is_channel) {
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
        }
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error(`Error: ${error}`)
        res.json({ ok: true, data: error })
    }
}

exports.channels3 = async (req, res) => {
    const backupId = req.params.backupId
    const member = await SlackMember.findOne({ team: req.params.id, is_admin: true, is_owner: true, access_token: { $ne: '' } })
    const accessToken = member.access_token
    if (accessToken == '') {
        return res.json({ ok: false, data: 'Administrator & Owner must install the workspace!' })
    }

    const channels = { public: [], private: [], direct: [], group: [] }
    try {
        const archive_row = await SlackArchive.findOne({ team: req.params.id })
        if (archive_row) {
            const backups = archive_row.backups.filter(e => e.id === backupId)
            if (backups.length < 1) {
                return res.json({ ok: true, data: channels })
            }
            const response = await Utils.getLargeData(backups[0].dataId)
            console.log('GridFS: ', response)
            response.channelList &&
                response.channelList.channels.forEach(channel => {
                    if (channel.is_private && !channel.is_im && !channel.is_mpim && channel.is_channel) {
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
        }
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error(`Error: ${error}`)
        res.json({ ok: true, data: channels })
    }
}

exports.channels4 = async (req, res) => {
    const slackArchive = await SlackArchive2.findById(req.params.backupId)

    res.json({ ok: true, data: slackArchive?.channels || [] })
}

exports.members = async (req, res) => {
    const members = await SlackMember.find({ team: req.params.id })
    const result = {}
    for (const member of members) {
        result[member.user_id] = member
    }

    res.json({ ok: true, data: result })
}

exports.getPublicMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await Slack.findOne({ team_id: teamId })
    if (archive_row) {
        const conversationHistory = archive_row.conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPublicMessages2 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await SlackArchive.findOne({ team: teamId })
    if (archive_row) {
        const backups = archive_row.backups.filter(e => e.id === backupId)
        if (backups.length < 1) {
            return res.json({ ok: true, result: {} })
        }
        const conversationHistory = backups[0].conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPublicMessages3 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { startDate, endDate } = req.query
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await SlackArchive.findOne({ team: teamId })
    if (archive_row) {
        const backups = archive_row.backups.filter(e => e.id === backupId)
        if (backups.length < 1) {
            return res.json({ ok: true, result: {} })
        }
        // const conversationHistory = backups[0].conversationHistory
        const response = await Utils.getLargeData(backups[0].dataId)
        const result = response.conversationHistory ? response.conversationHistory[channelId] : []
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPublicMessages4 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { cursor = 0 } = req.query

    try {
        const slackArchive = await SlackArchive2.findById(backupId)
        const dataIds = slackArchive.dataIds.public[channelId]

        if (!dataIds) {
            throw new Error('No data found for the specified channel')
        }

        const currentCursor = Number.isNaN(parseInt(cursor)) ? 0 : parseInt(cursor)
        console.log("CurrentCurosr: ", currentCursor)
        const result = await Utils.getLargeData(dataIds[currentCursor])
        const nextCursor = (currentCursor + 1) < dataIds.length ? currentCursor + 1 : undefined

        res.json({ ok: true, result, nextCursor })
    } catch (error) {
        console.error("getPublicMessages4 -> ", error)
        res.status(500).json({ ok: false, error: error.message })
    }
}

exports.getPrivateMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await Archive.findOne({ team_id: teamId })
    if (archive_row) {
        const conversationHistory = archive_row.conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPrivateMessages2 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await SlackArchive.findOne({ team: teamId })
    if (archive_row) {
        const backups = archive_row.backups.filter(e => e.id === backupId)
        if (backups.length < 1) {
            return res.json({ ok: true, result: {} })
        }
        const conversationHistory = backups[0].conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPrivateMessages3 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const team = await SlackTeam.findOne({ _id: teamId })
    if (!team) {
        return res.json({ ok: false, msg: "Team doesn't not exist." })
    }
    if (!team.accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await SlackArchive.findOne({ team: teamId })
    if (archive_row) {
        const backups = archive_row.backups.filter(e => e.id === backupId)
        if (backups.length < 1) {
            return res.json({ ok: true, result: {} })
        }
        // const conversationHistory = backups[0].conversationHistory
        // const result = conversationHistory[channelId]
        const response = await Utils.getLargeData(backups[0].dataId)
        const result = response.conversationHistory ? response.conversationHistory[channelId] : []
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getPrivateMessages4 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { cursor = 0 } = req.query

    try {
        const slackArchive = await SlackArchive2.findById(backupId)
        const dataIds = slackArchive.dataIds.private[channelId]

        if (!dataIds) {
            throw new Error('No data found for the specified channel')
        }

        const currentCursor = Number.isNaN(parseInt(cursor)) ? 0 : parseInt(cursor)
        const result = await Utils.getLargeData(dataIds[currentCursor])
        const nextCursor = (currentCursor + 1) < dataIds.length ? currentCursor + 1 : undefined

        res.json({ ok: true, result, nextCursor })
    } catch (error) {
        console.error("getPrivateMessages4 -> ", error)
        res.status(500).json({ ok: false, error: error.message })
    }
}

exports.getGroupMessages4 = async (req, res) => {
    const { channelId, backupId } = req.params
    const { cursor = 0 } = req.query

    try {
        const slackArchive = await SlackArchive2.findById(backupId)
        const dataIds = slackArchive.dataIds.group[channelId]

        if (!dataIds) {
            throw new Error('No data found for the specified channel')
        }
        console.log("DataIds: ", dataIds)
        const currentCursor = Number.isNaN(parseInt(cursor)) ? 0 : parseInt(cursor)
        const result = await Utils.getLargeData(dataIds[currentCursor])
        const nextCursor = (currentCursor + 1) < dataIds.length ? currentCursor + 1 : undefined

        res.json({ ok: true, result, nextCursor })
    } catch (error) {
        console.error("getGroupMessages4 -> ", error)
        // res.status(500).json({ ok: false, error: error.message })
        res.json({ ok: false, result: [] })
    }
}

exports.getDirectMessages = async (req, res) => {
    const { teamId, channelId } = req.params
    const { accessToken } = req.query

    if (!accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await Archive.findOne({ team_id: teamId })
    if (archive_row) {
        const conversationHistory = archive_row.conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getDirectMessages2 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { accessToken } = req.query

    if (!accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const archive_row = await SlackArchive.findOne({ team: teamId })
    if (archive_row) {
        const backups = archive_row.backups.filter(e => e.id === backupId)
        if (backups.length < 1) {
            return res.json({ ok: true, result: {} })
        }
        const conversationHistory = backups[0].conversationHistory
        const result = conversationHistory[channelId]
        res.json({ ok: true, result })
    } else {
        res.json({ ok: true, result: {} })
    }
}

exports.getDirectMessages3 = async (req, res) => {
    const { teamId, channelId, backupId } = req.params
    const { accessToken } = req.query

    if (!accessToken) {
        return res.json({ ok: false, msg: 'You should authenticate first.' })
    }

    const slackArchive = await SlackArchive2.findById(backupId)
    try {
        const dataId = slackArchive.dataIds.direct[channelId]
        const messages = await Utils.getLargeData(dataId)

        res.json({ ok: true, result: messages })
    } catch (error) {
        console.log("getDirectMessages4 -> ", error)
        res.json({ ok: true, result: [] })
    }
}

exports.getDirectMessages4 = async (req, res) => {
    const { channelId, backupId } = req.params

    const { cursor = 0 } = req.query

    try {
        const slackArchive = await SlackArchive2.findById(backupId)
        const dataIds = slackArchive.dataIds.direct[channelId]

        if (!dataIds) {
            return res.json({ ok: false, result: [] })
        }
        console.log("DataIds: ", dataIds)
        const currentCursor = Number.isNaN(parseInt(cursor)) ? 0 : parseInt(cursor)
        const result = await Utils.getLargeData(dataIds[currentCursor])
        const nextCursor = (currentCursor + 1) < dataIds.length ? currentCursor + 1 : undefined

        res.json({ ok: true, result, nextCursor })
    } catch (error) {
        console.error("getGroupMessages4 -> ", error)
        // res.status(500).json({ ok: false, error: error.message })
        res.json({ ok: false, result: [] })
    }
}

exports.getDirectConversationList = async (req, res) => {
    const { userId, teamId } = req.params
    // const { accessToken } = req.query;
    const archive_row = await Archive.findOne({ team_id: teamId })

    try {
        const channels = []
        if (archive_row) {
            const result = archive_row.directChannel
            for (const channel of result.channels) {
                if (channel.user === userId) continue
                const member = await SlackMember.findOne({ user_id: channel.user })
                if (member) {
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
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error('Error retrieving direct conversations:', error)
        return res.json({ ok: false, error })
    }
}

exports.getDirectConversationList2 = async (req, res) => {
    const { userId, teamId, backupId } = req.params
    // const { accessToken } = req.query;
    const archive_row = await SlackArchive.findOne({ team: teamId })

    try {
        const channels = []
        if (archive_row) {
            const backups = archive_row.backups.filter(e => e.id === backupId)
            if (backups.length < 1) {
                return res.json({ ok: true, data: channels })
            }
            const result = backups[0].directChannel
            for (const channel of result.channels) {
                if (channel.user === userId) continue
                const member = await SlackMember.findOne({ user_id: channel.user })
                if (member) {
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
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error('Error retrieving direct conversations:', error)
        return res.json({ ok: false, error })
    }
}

exports.getDirectConversationList3 = async (req, res) => {
    const { userId, teamId, backupId } = req.params
    // const { accessToken } = req.query;
    const archive_row = await SlackArchive.findOne({ team: teamId })

    try {
        const channels = []
        if (archive_row) {
            const backups = archive_row.backups.filter(e => e.id === backupId)
            if (backups.length < 1) {
                return res.json({ ok: true, data: channels })
            }
            // const result = backups[0].directChannel
            const response = await Utils.getLargeData(backups[0].dataId)
            const result = response.directChannel
            for (const channel of result.channels) {
                if (channel.user === userId) continue
                const member = await SlackMember.findOne({ user_id: channel.user })
                if (member) {
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
        return res.json({ ok: true, data: channels })
    } catch (error) {
        console.error('Error retrieving direct conversations:', error)
        return res.json({ ok: false, error })
    }
}

exports.search = async (req, res) => {
    const query = req.query.q;
    const parameterObj = {};
    parameterObj.query = query;
    parameterObj.start = req.query.start;
    parameterObj.end = req.query.end;
    parameterObj.from = req.query.from;
    parameterObj.to = req.query.to;
    parameterObj.archives = req.query.archives;
    console.log('parameterObj:', JSON.stringify(parameterObj, null, 2));

    const userId = req.userId;
    const pageNumber = parseInt(req.query.pageNumber) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const selectedType = req.query.selectedType || 'all';

    let data = { slack: { total: 0, results: [] }, outlook: { total: 0, results: [] } };

    if (selectedType === 'slack' || selectedType === 'all') {
        const slackData = await slackSearch(parameterObj, userId, pageNumber, pageSize);
        data.slack = slackData;
    }

    if (selectedType === 'outlook' || selectedType === 'all') {
        // const outlookData = await outlookSearch(query, userId, pageNumber, pageSize);
        const outlookData = await outlookSearch(parameterObj, userId, pageNumber, pageSize);
        data.outlook = outlookData;
    }

    if (selectedType === 'onedrive' || selectedType === 'all') {
        const oneDriveData = await oneDriveSearch(parameterObj, userId, pageNumber, pageSize);
        data.onedrive = oneDriveData;
    }

    if (selectedType === 'gmail' || selectedType === 'all') {
        const gmailData = await gmailSearch(parameterObj, userId, pageNumber, pageSize);
        data.gmail = gmailData;
    }

    if (selectedType === 'googledrive' || selectedType === 'all') {
        const gmailData = await gDriveSearch(parameterObj, userId, pageNumber, pageSize);
        data.googledrive = gmailData;
    }

    if (selectedType === 'dropbox' || selectedType === 'all') {
        const dropboxData = await dropboxSearch(parameterObj, userId, pageNumber, pageSize);
        data.dropbox = dropboxData;
    }

    if (selectedType === 'files' || selectedType === 'all') {
        const filesData = await filesSearch(query, userId, pageNumber, pageSize);
        data.files = filesData;
    }

    if (selectedType === 'flagged' || selectedType === 'all') {
        const flaggedResult = await flaggedCollectionsSearch(query, userId, pageNumber, pageSize);
        data.flaggedCollections = flaggedResult;
    }

    res.json({ ok: true, data });
};

exports.delete = async (req, res) => {
    const { type, teamId, backupIds } = req.body
    console.log(type, teamId, backupIds)
    let info = {}
    try {
        if (type === 'Slack') {
            const slackArchives = await SlackArchive2.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'Slack'
            info.title = ''

            console.log("Slack Archives for deleting");
            console.log(slackArchives)
            if (slackArchives) {
                info.count = slackArchives.length
                info.id = info.count === 1 ? slackArchives[0].id : `${slackArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < slackArchives.length; i++) {
                    const slackArchive = slackArchives[i]
                    console.log("SlackArchive: ", slackArchive)
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: slackArchive.id }, { state: 'delete' })
                    info.size += slackArchive.size
                    let processedCount = 0
                    if (slackArchive.dataIds) {
                        for (const key of Object.keys(slackArchive.dataIds)) {
                            const channelType = slackArchive.dataIds[key]
                            for (const channelId of Object.keys(channelType)) {
                                for (const dataId of channelType[channelId]) {
                                    try {
                                        const messages = await Utils.getLargeData(dataId)
                                        // delete elasticsearch index
                                        for (const msg of messages) {
                                            const indexId = `${slackArchive.id}_${msg.ts}`
                                            await deleteSlackIndex(indexId)
        
                                            // Delete AWS S3 files
                                            if (msg.files) {
                                                for (const file of msg.files) {
                                                    await AWS.deleteS3File(config.AWS.OUTLOOK_BUCKET, file.s3Key);
                                                }
                                            }
                                        }
        
                                        // Delete gridfs
                                        await Utils.deleteLargeData(dataId)
                                    } catch (error) {
                                        console.log(error)
                                    }
                                }
    
                                processedCount += 1
                                await ArchiveState.updateOne({ archiveId: slackArchive.id }, { processedCount })
                            }
                        }
                    }
                }
            }
            // delete archive state
            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })
            //Delete from database
            await SlackArchive2.deleteMany({ _id: { $in: backupIds } })
        } else if (type === 'Outlook') {
            // Delete indexed data in ElasticSearch
            const outlookArchives = await OutlookArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'Outlook'
            info.title = ''
            console.log("Outlook Archives for deleting");
            console.log(outlookArchives)
            if (outlookArchives) {
                info.count = outlookArchives.length
                info.id = info.count === 1 ? outlookArchives[0].id : `${outlookArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < outlookArchives.length; i++) {
                    const outlookArchive = outlookArchives[i]
                    console.log("OutlookArchive: ", outlookArchive)
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: outlookArchive.id }, { state: 'delete' })
                    info.size += outlookArchive.size
                    await Utils.removeOutlookArchive2(outlookArchive)
                }
            }
            // delete archive state

            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await OutlookArchive.deleteMany({ _id: { $in: backupIds } })

        } else if (type === 'OneDrive') {
            // Delete indexed data in ElasticSearch
            const oneDriveArchives = await OneDriveArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'OneDrive'
            info.title = ''
            console.log("OneDrive Archives for deleting");
            console.log(oneDriveArchives)
            if (oneDriveArchives) {
                info.count = oneDriveArchives.length
                info.id = info.count === 1 ? oneDriveArchives[0].id : `${oneDriveArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < oneDriveArchives.length; i++) {
                    const oneDriveArchive = oneDriveArchives[i]
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: oneDriveArchive.id }, { state: 'delete' })
                    info.size += oneDriveArchive.size
                    try {
                        await Utils.removeOneDriveArchive(oneDriveArchive)
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
            // delete archive state
            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await OneDriveArchive.deleteMany({ _id: { $in: backupIds } })

        } else if (type === 'Gmail') {
            // Delete indexed data in ElasticSearch
            const gmailArchives = await GmailArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'Gmail'
            info.title = ''
            console.log("Gmail Archives for deleting");
            console.log(gmailArchives)
            if (gmailArchives) {
                info.count = gmailArchives.length
                info.id = info.count === 1 ? gmailArchives[0].id : `${gmailArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < gmailArchives.length; i++) {
                    const gmailArchive = gmailArchives[i]
                    console.log("GmailArchive: ", gmailArchive)
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: gmailArchive.id }, { state: 'delete' })
                    info.size += gmailArchive.size
                    await Utils.removeGmailArchive(gmailArchive)
                }
            }
            // delete archive state

            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await GmailArchive.deleteMany({ _id: { $in: backupIds } })

        } else if (type === 'Drive') {
            // Delete indexed data in ElasticSearch
            const googleDriveArchives = await DriveArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'Google Drive'
            info.title = ''
            console.log("Google Drive Archives for deleting");
            console.log(googleDriveArchives)
            if (googleDriveArchives) {
                info.count = googleDriveArchives.length
                info.id = info.count === 1 ? googleDriveArchives[0].id : `${googleDriveArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < googleDriveArchives.length; i++) {
                    const googleDriveArchive = googleDriveArchives[i]
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: googleDriveArchive.id }, { state: 'delete' })
                    info.size += googleDriveArchive.size
                    try {
                        await Utils.removeGoogleDriveArchive(googleDriveArchive)
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
            // delete archive state
            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await DriveArchive.deleteMany({ _id: { $in: backupIds } })

        } else if (type === 'Dropbox') {
            // Delete indexed data in ElasticSearch
            const dropboxArchives = await DropboxArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'Dropbox'
            info.title = ''
            console.log("Dropbox Archives for deleting");
            console.log(dropboxArchives)
            if (dropboxArchives) {
                info.count = dropboxArchives.length
                info.id = info.count === 1 ? dropboxArchives[0].id : `${dropboxArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < dropboxArchives.length; i++) {
                    const dropboxArchive = dropboxArchives[i]
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: dropboxArchive.id }, { state: 'delete' })
                    info.size += dropboxArchive.size
                    try {
                        await Utils.removeDropboxArchive(dropboxArchive)
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
            // delete archive state
            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await DropboxArchive.deleteMany({ _id: { $in: backupIds } })

        } else if (type === 'FlaggedCollections') {
            // Delete indexed data in ElasticSearch
            const flaggedArchives = await FlaggedArchive.find({ _id: { $in: backupIds } })
            info.dtDeleted = new Date().toISOString()
            info.type = 'FlaggedCollections'
            info.title = ''
            console.log("FlaggedCollection Archives for deleting");
            console.log(flaggedArchives)
            if (flaggedArchives) {
                info.count = flaggedArchives.length
                info.id = info.count === 1 ? flaggedArchives[0].id : `${flaggedArchives[0].id}...`
                info.size = 0
                for (let i = 0; i < flaggedArchives.length; i++) {
                    const flaggedArchive = flaggedArchives[i]
                    console.log("FlaggedArchive: ", flaggedArchive)
                    // Update Archive State
                    await ArchiveState.updateOne({ archiveId: flaggedArchive.id }, { state: 'delete' })
                    info.size += flaggedArchive.size
                    await Utils.removeFlaggedArchive(flaggedArchive)
                }
            }
            // delete archive state

            await ArchiveState.deleteMany({ archiveId: { $in: backupIds } })

            //Delete from database
            await FlaggedArchive.deleteMany({ _id: { $in: backupIds } })

        }
        const user = await User.findOne({ _id: req.userId })
        info.reason = 'Deleted by user'
        info.reason = 'manual'
        info.isRecovery = 'impossible'
        await Utils.sendArchiveDeletionMail(user.email, info)
        res.json({ ok: true })
    } catch (error) {
        console.log("Deleteing Error: ", error)
        res.json({ ok: false })
    }
}

exports.archiveOutlook = async (req, res) => {
    const { workspaceId, filters } = req.body
    const archiveState = await ArchiveState.create({
        type: 'Outlook',
        appId: workspaceId,
        filters,
        state: 'queued',
        userId: req.userId
    })

    res.json({ ok: true, data: archiveState })
}

exports.getArchiveOutlook = async (req, res) => {
    const { archiveId } = req.params;
    const { page = 1, limit = 50 } = req.query; // Default to page 1 and limit of 50 messages per page
    const outlookArchive = await OutlookArchive.findOne({ _id: archiveId });

    if (!outlookArchive || outlookArchive.backups.length === 0) {
        return res.status(404).json({ ok: false, message: 'No backups found' });
    }

    const messagesPerBackup = 300;
    const totalMessages = outlookArchive.totalCount;

    // Calculate which dataId and the starting index within that dataId to fetch messages from
    const globalStartIndex = (page - 1) * parseInt(limit);
    const backupIndex = Math.floor(globalStartIndex / messagesPerBackup);
    const startIndexInBackup = globalStartIndex % messagesPerBackup;

    let messages = [];
    try {
        let remainingLimit = parseInt(limit);
        let currentBackupIndex = backupIndex;

        while (remainingLimit > 0 && currentBackupIndex < outlookArchive.backups.length) {
            const currentDataId = outlookArchive.backups[currentBackupIndex];
            const allMessages = await Utils.getLargeData(currentDataId);
            const startIndex = currentBackupIndex === backupIndex ? startIndexInBackup : 0;
            const endIndex = Math.min(startIndex + remainingLimit, messagesPerBackup);
            messages = messages.concat(allMessages.slice(startIndex, endIndex));
            remainingLimit -= (endIndex - startIndex);
            currentBackupIndex++;
        }
    } catch (error) {
        console.log('Getting outlook archive GridFS: ', error);
    }

    messages = await Promise.all(messages.map(async (msg) => {
        const downloadLog = await OutlookDownloadLog.findOne({ messageId: msg.id });
        msg.downloadLogs = downloadLog ? downloadLog.logs : [];
        return msg;
    }));

    res.json({ ok: true, data: messages, total: totalMessages });
};

exports.getArchiveFlaggedCollections = async (req, res) => {
    const { archiveId } = req.params;
    // const { page = 1, limit = 50 } = req.query; // Default to page 1 and limit of 50 messages per page
    const flaggedArchive = await FlaggedArchive.findOne({ _id: archiveId });

    if (!flaggedArchive || flaggedArchive.backups.length === 0) {
        return res.status(404).json({ ok: false, message: 'No backups found' });
    }

    const totalMessages = flaggedArchive.totalCount;

    let messages = [];
    try {
        for (const dataId of flaggedArchive.backups) {
            const part = await Utils.getLargeData(dataId);
            messages = messages.concat(part)
        }
    } catch (error) {
        return res.json({ ok: false, data: []})
    }

    res.json({ ok: true, data: messages, total: totalMessages });
};

exports.archiveOnedrive = async (req, res) => {
    const { workspaceId, filters } = req.body
    const archiveState = await ArchiveState.create({
        type: 'OneDrive',
        appId: workspaceId,
        filters,
        state: 'queued',
        userId: req.userId
    })

    res.json({ ok: true, data: archiveState })
}

exports.getArchiveOnedrive = async (req, res) => {
    const { archiveId } = req.params
    const onedriveArchive = await OneDriveArchive.findOne({ _id: archiveId })
    if (onedriveArchive) {
        const backups = await Utils.getLargeData(onedriveArchive.dataId);
        if (backups) {
            onedriveArchive.backups = backups;
        }
    }
    res.json({ ok: true, data: onedriveArchive })
}

exports.downloadFileFromAWS = async (req, res) => {
    const { s3Key } = req.body;
    const bucketName = config.AWS.OUTLOOK_BUCKET; // Use the appropriate bucket name from your config

    try {
        const s3Stream = AWS.streamFileFromS3(bucketName, s3Key);

        s3Stream.on('error', (err) => {
            console.error('Error streaming file from S3:', err);
            res.status(500).json({ error: 'Error streaming file from S3' });
        });

        s3Stream.on('end', () => {
            console.log(`Successfully streamed ${s3Key} from bucket ${bucketName}`);
        });

        res.attachment(s3Key); // Set the file name for the download
        s3Stream.pipe(res);
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Error downloading file from S3' });
    }
}

exports.archiveJob = async (req, res) => {
    const { workspaceId, filters, totalCount } = req.body
    const workspace = await MS365Workspace.findById(workspaceId)
    const archiveState = await ArchiveState.create({
        type: 'MS365',
        appId: workspaceId,
        filters,
        state: 'queued',
        totalCount,
        userId: req.userId, //deprecated
        owner: workspace.clientId,
        createdBy: req.userId
    })
    if (filters.application[0] === 'Outlook') {
        const outlookArchive = await OutlookArchive.create({
            jobId: archiveState.id,
            jobName: filters.jobName,
            workspaceId,
            filters,
            backups: [],
            size: 0,
            clientId: req.userId, //deprecated
            owner: workspace.clientId,
            createdBy: req.userId
        });
        await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: outlookArchive.id, detailType: 'Outlook'})
        
    } else if (filters.application[0] === 'OneDrive') {
        const oneDriveArchive = await OneDriveArchive.create({
            jobId: archiveState._id,
            jobName: filters.jobName,
            workspaceId,
            filters,
            clientId: req.userId, //deprecated
            owner: workspace.clientId,
            createdBy: req.userId
        });
        await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: oneDriveArchive.id, detailType: 'OneDrive'})
    }

    res.json({ ok: true, data: archiveState })
}

exports.archiveGoogleJob = async (req, res) => {
    const { workspaceId, filters, totalCount } = req.body
    const googleWorkspace = await GoogleWorkspace.findById(workspaceId)
    const owner = googleWorkspace.clientId
    const archiveState = await ArchiveState.create({
        type: 'Google',
        appId: workspaceId,
        filters,
        state: 'queued',
        totalCount,
        userId: req.userId, //deprecated
        owner,
        createdBy: req.userId
    })

    if (filters.application[0] === 'Gmail') {
        const gmailArchive =  await GmailArchive.create({
            jobId: archiveState.id,
            jobName: filters.jobName,
            workspaceId,
            filters,
            backups: [],
            size: 0,
            clientId: req.userId, //deprecated
            owner, 
            createdBy: req.userId
        })
        await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: gmailArchive.id, detailType: 'Gmail'})
    } else if (filters.application[0] === 'Drive') {

        const driveArchive = await DriveArchive.create({
            jobId: archiveState.id,
            jobName: filters.jobName,
            workspaceId,
            filters,
            backups: [],
            size: 0,
            clientId: req.userId, //deprecated
            owner,
            createdBy: req.userId
        })
        await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: driveArchive.id, detailType: 'Drive'})
    }

    res.json({ ok: true, data: archiveState })
}

exports.getArchiveGmail = async (req, res) => {
    const { archiveId } = req.params;
    const { page = 1, limit = 50 } = req.query; // Default to page 1 and limit of 50 messages per page
    const gmailArchive = await GmailArchive.findOne({ _id: archiveId });

    if (!gmailArchive || gmailArchive.backups.length === 0) {
        return res.status(404).json({ ok: false, message: 'No backups found' });
    }

    const messagesPerBackup = 300;
    const totalMessages = gmailArchive.totalCount;

    // Calculate which dataId and the starting index within that dataId to fetch messages from
    const globalStartIndex = (page - 1) * parseInt(limit);
    const backupIndex = Math.floor(globalStartIndex / messagesPerBackup);
    const startIndexInBackup = globalStartIndex % messagesPerBackup;

    let messages = [];
    try {
        let remainingLimit = parseInt(limit);
        let currentBackupIndex = backupIndex;

        while (remainingLimit > 0 && currentBackupIndex < gmailArchive.backups.length) {
            const currentDataId = gmailArchive.backups[currentBackupIndex];
            const allMessages = await Utils.getLargeData(currentDataId);
            const startIndex = currentBackupIndex === backupIndex ? startIndexInBackup : 0;
            const endIndex = Math.min(startIndex + remainingLimit, messagesPerBackup);
            messages = messages.concat(allMessages.slice(startIndex, endIndex));
            remainingLimit -= (endIndex - startIndex);
            currentBackupIndex++;
        }
    } catch (error) {
        console.log('Getting outlook archive GridFS: ', error);
    }

    messages = await Promise.all(messages.map(async (msg) => {
        const downloadLog = await GmailDownloadLog.findOne({ messageId: msg.id });
        msg.downloadLogs = downloadLog ? downloadLog.logs : [];
        return msg;
    }));

    res.json({ ok: true, data: messages, total: totalMessages });
}

exports.getArchiveDrive = async (req, res) => {
    const { archiveId } = req.params
    const driveArchive = await DriveArchive.findOne({ _id: archiveId })
    if (driveArchive) {
        const backups = await Utils.getLargeData(driveArchive.backups[0]?.dataId);
        if (backups) {
            driveArchive.backups = backups;
        }
    }
    res.json({ ok: true, data: driveArchive })
}

exports.getArchiveOutlookBody = async (req, res) => {
    const { archiveId, messageId } = req.params
    console.log(archiveId, messageId)
    const outlookArchive = await OutlookArchive.findOne({ _id: archiveId })
    console.log('======================Outlook Archive==================')
    console.log(outlookArchive)
    let result = null
    try {
        const messages = await Utils.getLargeData(outlookArchive.backups[0].dataId)
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].id === messageId) {
                result = messages[i]
                break
            }
        }
    } catch (error) {
        console.log(error)
    }

    res.json({ ok: true, data: result })
}

exports.getArchiveOutlookBody2 = async (req, res) => {
    const { archiveId, messageId } = req.params;

    try {
        const backupMessage = await BackupMessages.findOne({ archiveId, messageIds: { $elemMatch: { id: messageId } } })

        const messages = await Utils.getLargeData(backupMessage.dataId);
        const result = messages.find(message => message.id === messageId);

        if (!result) {
            return res.status(404).json({ ok: false, message: 'Message not found' });
        }

        res.json({ ok: true, data: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.archiveGmailMessage = async (req, res) => {
    const { archiveId, messageId } = req.params;

    try {
        const backupMessage = await BackupMessages.findOne({ archiveId, messageIds: { $elemMatch: { id: messageId } } })

        const messages = await Utils.getLargeData(backupMessage.dataId);
        const result = messages.find(message => message.id === messageId);

        if (!result) {
            return res.status(404).json({ ok: false, message: 'Message not found' });
        }

        res.json({ ok: true, data: result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.downloadOutlookMSG = async (req, res) => {
    const { archiveId, messageId } = req.params;

    try {
        console.log(`Looking for backupMessage with archiveId: ${archiveId} and messageId: ${messageId}`);
        const backupMessage = await BackupMessages.findOne({ archiveId, messageIds: { $elemMatch: { id: messageId } } });

        if (!backupMessage) {
            console.log('Backup message not found');
            return res.status(404).json({ ok: false, message: 'Backup message not found' });
        }

        const messages = await Utils.getLargeData(backupMessage.dataId);
        const message = messages.find(message => message.id === messageId);

        if (!message) {
            console.log('Message not found');
            return res.status(404).json({ ok: false, message: 'Message not found' });
        }

        const content = await Utils.generateArchiveOutlookEml(message, archiveId)

        // const attachments = message.hasAttachments ? message.attachments : []
        // const zipFilePath = path.join(__dirname, `${message.hash}.zip`);
        // const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // output.on('close', () => {
        //     console.log(`Created ZIP file: ${zipFilePath} (${archive.pointer()} total bytes)`);

        //     res.setHeader('Content-Disposition', `attachment; filename="${message.hash}.zip"`);
        //     res.setHeader('Content-Type', 'application/zip');

        //     res.sendFile(zipFilePath, (err) => {
        //         if (err) {
        //             console.log(`Error in sending file: ${err}`);
        //             return res.status(500).json({ ok: false, message: 'Error in sending file' });
        //         }

        //         console.log('File sent successfully');
        //         fs.unlink(zipFilePath, (unlinkErr) => {
        //             if (unlinkErr) {
        //                 console.log(`Error deleting temporary file: ${unlinkErr}`);
        //             }
        //             console.log(`Deleted temporary file: ${zipFilePath}`);
        //         });

        //         // Log outlook download
        //         OutlookDownloadLog.addLog(messageId, { userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash })
        //     });
        // });

        archive.on('error', (err) => {
            throw err;
        });

        archive.on('end', () => {
            OutlookDownloadLog.addLog(messageId, { userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash })
        });

        // archive.pipe(output);
        archive.pipe(res);

        // Append email content
        archive.append(content, { name: `${message.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'No subject'}_${message.hash}.eml` });
        await archive.finalize();

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.bulkDownloadOutlookMSG = async (req, res) => {
    const { archiveId } = req.params;
    const { messageIds } = req.body;
    const { type } = req.query

    if (type !== 'entire') {
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ ok: false, message: 'No message IDs provided' });
        }
    }
    let jobName = ''
    let keywords = ''
    const archive = await OutlookArchive.findById(archiveId)
    if (archive) {
        jobName = archive.jobName
        keywords = archive.filters?.keywords
    }
    try {
        
        let backupMessages
        let selectedMessages
        let downloadedLog = []
        if (type === 'entire') {
            backupMessages = await BackupMessages.find({ archiveId });
        } else {
            backupMessages = await BackupMessages.find({ archiveId, messageIds: { $elemMatch: { id: { $in: messageIds } } } });
        }

        if (!backupMessages) {
            console.log('Backup message not found');
            return res.status(404).json({ ok: false, message: 'Backup message not found' });
        }
        
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });

        archive.on('end', () => {
            for (const message of downloadedLog) {
                OutlookDownloadLog.addLog(message.id, { userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash })
            }
        });
        archive.pipe(res);
        res.setTimeout(3000000)
        
        for (const backupMessage of backupMessages) {
            const messages = await Utils.getLargeData(backupMessage.dataId);
            selectedMessages = type === 'entire' ? messages : messages.filter(message => messageIds.includes(message.id));

            for (const message of selectedMessages) {
                const content = await Utils.generateArchiveOutlookEml(message, archiveId);
                const folderName = `${message.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'no_subject'}_${message.hash}`;
                archive.append(content, { name: `${folderName}.eml` });
                downloadedLog.push({id: message.id, hash: message.hash})
            }
        }
        await archive.finalize();

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.bulkDownloadGmail = async (req, res) => {
    const { archiveId } = req.params;
    const { messageIds } = req.body;
    const { type } = req.query

    if (type !== 'entire') {
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ ok: false, message: 'No message IDs provided' });
        }
    }
    let jobName = ''
    let keywords = ''
    const archive = await GmailArchive.findById(archiveId)
    if (archive) {
        jobName = archive.jobName
        keywords = archive.filters?.keywords
    }
    try {
        
        let backupMessages
        let selectedMessages
        let downloadedLog = []
        if (type === 'entire') {
            backupMessages = await BackupMessages.find({ archiveId });
        } else {
            backupMessages = await BackupMessages.find({ archiveId, messageIds: { $elemMatch: { id: { $in: messageIds } } } });
        }

        if (!backupMessages) {
            console.log('Backup message not found');
            return res.status(404).json({ ok: false, message: 'Backup message not found' });
        }
        
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });

        archive.on('end', () => {
            for (const message of downloadedLog) {
                GmailDownloadLog.addLog(message.id, { userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash })
            }
        });
        archive.pipe(res);
        res.setTimeout(3000000)
        
        for (const backupMessage of backupMessages) {
            const messages = await Utils.getLargeData(backupMessage.dataId);
            selectedMessages = type === 'entire' ? messages : messages.filter(message => messageIds.includes(message.id));

            for (const message of selectedMessages) {
                const content = await Utils.generateArchiveGmailEml(message);
                const folderName = `${message.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'no_subject'}_${message.hash}`;
                archive.append(content, { name: `${folderName}.eml` });
                downloadedLog.push({id: message.id, hash: message.hash})
            }
        }
        await archive.finalize();

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.bulkDownloadOutlookSearchResult = async (req, res) => {
    const { messages } = req.body; // Assuming message IDs are sent in the body as an array

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, message: 'No message IDs provided' });
    }

    try {
        let selectedMessages = []
        for (let message of messages) {
            const backupMessage = await BackupMessages.findOne({ archiveId: message.archiveId, messageIds: { $elemMatch: { id: message.id } } });

            if (!backupMessage) {
                console.log('Backup message not found');
                return res.status(404).json({ ok: false, message: 'Backup message not found' });
            }

            const msg = await Utils.getLargeData(backupMessage.dataId);
            const m = msg.find(item => item.id === message.id)
            selectedMessages.push({ message: m, filename: message.filename, archiveId: message.archiveId});
        }


        if (selectedMessages.length === 0) {
            console.log('No messages found');
            return res.status(404).json({ ok: false, message: 'No messages found' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            throw err;
        });

        archive.on('end', () => {
            for (const message of selectedMessages) {
                OutlookDownloadLog.addLog(message.id, { userId: req.userId, downloadedAt: new Date().toISOString() })
            }
        });

        archive.pipe(res);

        for (const message of selectedMessages) {
            const content = await Utils.generateArchiveOutlookEml(message.message, message.archiveId);
            const folderName = message.filename.replace('.eml', '')
            archive.append(content, { name: `${folderName}/${message.filename}` });
        }

        await archive.finalize();

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.bulkDownloadGmailSearchResult = async (req, res) => {
    const { messages } = req.body; // Assuming message IDs are sent in the body as an array

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, message: 'No message IDs provided' });
    }

    try {
        let selectedMessages = []
        for (let message of messages) {
            const backupMessages = await BackupMessages.find({ archiveId: message.archiveId, messageIds: { $elemMatch: { id: message.id } } });
            console.log(backupMessages)
            for (const backupMessage of backupMessages) {
                const msg = await Utils.getLargeData(backupMessage.dataId);
                selectedMessages.push({ message: msg.find(item => item.id = message.id), filename: message.filename });
            }
        }
        if (selectedMessages.length === 0) {
            console.log('No messages found');
            return res.status(404).json({ ok: false, message: 'No messages found' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            throw err;
        });
        
        archive.on('end', () => {
            for (const message of selectedMessages) {
                GmailDownloadLog.addLog(message.id, { userId: req.userId, downloadedAt: new Date().toISOString() })
            }
        });

        archive.pipe(res);

        for (const message of selectedMessages) {
            const content = await Utils.generateArchiveGmailEml(message.message);
            archive.append(content, { name: message.filename });
        }

        await archive.finalize();

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.addDownloadGmailLog = async (req, res) => {
    const { id } = req.body;

    GmailDownloadLog.addLog(id, { userId: req.userId, downloadedAt: new Date().toISOString() })
    res.json({ ok: true })
};

exports.getS3SignedUrl = (req, res) => {
    const { s3Key, mimetype } = req.body
    const fileUrl = AWS.getPresignedUrl(config.AWS.OUTLOOK_BUCKET, s3Key, 60 * 60, mimetype);
    console.log("Pre Signed Url: ", fileUrl)

    res.json({ ok: true, fileUrl })
}

exports.getS3Image = async (req, res) => {
    const { s3Key, filetype } = req.body
    const data = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, s3Key)
    res.json({ ok: true, data: `data:image/${filetype};base64,${data?.toString('base64')}` })
}

exports.s3FileDownload = async (req, res) => {
    const { s3Key, filename } = req.query
    try {
        const s3Stream = AWS.streamFileFromS3(config.AWS.OUTLOOK_BUCKET, s3Key);

        s3Stream.on('error', (err) => {
            console.error('Error streaming file from S3:', err);
            res.status(500).json({ error: 'Error streaming file from S3' });
        });

        s3Stream.on('end', () => {
            console.log(`Successfully streamed ${s3Key} from bucket ${config.AWS.OUTLOOK_BUCKET}`);
        });
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        // res.attachment(s3Key); // Set the file name for the download
        s3Stream.pipe(res);
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Error downloading file from S3' });
    }
}

exports.s3FileDownload2 = async (req, res) => {
    const { s3Key, filename } = req.query;
    
    try {
        const s3Stream = AWS.streamFileFromS3(config.AWS.OUTLOOK_BUCKET, s3Key);

        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download.zip'}"`);
        res.setHeader('Content-Type', 'application/zip');

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error creating zip file' });
            }
        });

        s3Stream.on('error', (err) => {
            console.error('Error streaming file from S3:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file from S3' });
            }
        });

        archive.pipe(res);

        archive.append(s3Stream, { name: filename || s3Key.split('/').pop() });

        await archive.finalize();

        console.log(`Successfully created and streaming zip file for ${s3Key}`);

    } catch (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file from S3' });
        }
    }
};

exports.archiveDropbox = async (req, res) => {
    const { workspaceId, filters, totalCount } = req.body
    const workspace = await DropboxWorkspace.findById(workspaceId)
    const archiveState = await ArchiveState.create({
        type: 'Dropbox',
        appId: workspaceId,
        filters,
        state: 'queued',
        totalCount,
        userId: req.userId,
        owner: workspace.owner,
        createdBy: req.userId
    })
    
    const dropboxArchive = await DropboxArchive.create({
        jobId: archiveState.id,
        jobName: filters.jobName,
        workspaceId,
        filters,
        backups: [],
        size: 0,
        clientId: filters.userEmail[0],
        owner: workspace.owner,
        createdBy: req.userId
    });
    await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: dropboxArchive.id, detailType: 'Dropbox'})
        

    res.json({ ok: true, data: archiveState })
}

exports.archiveSlack = async (req, res) => {
    const { workspaceId, filters, totalCount } = req.body
    const workspace = await SlackTeam.findById(workspaceId)
    const archiveState = await ArchiveState.create({
        type: 'Slack',
        appId: workspaceId,
        filters,
        state: 'queued',
        totalCount,
        userId: req.userId, //deprecated
        owner: workspace.owner || workspace.clientId,
        createdBy: req.userId
    })

    const slackArchive = await SlackArchive2.create({
        team: workspaceId,
        memberId: filters.user[0].id,
        jobId: archiveState.id,
        jobName: filters.jobName,
        filters,
        email: filters.user[0].email,
        clientId: req.userId, // deprecated
        owner: workspace.owner || workspace.clientId,
        createdBy: req.userId
    });
    await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: slackArchive.id, detailType: 'Slack'})
        

    res.json({ ok: true, data: archiveState })
}

exports.getArchiveDropbox = async (req, res) => {
    const { workspaceId, archiveId } = req.params
    const workspace = await DropboxWorkspace.findById(workspaceId)
    const dropboxArchive = await DropboxArchive.findOne({_id: archiveId, workspaceId})
    if (dropboxArchive) {
        const backups = await Utils.getLargeData(dropboxArchive.backups[0]?.dataId);
        
        return res.json({ ok: true, data: backups })
    }

    res.json({ ok: false, data: {} })
}

exports.getArchiveProgress = async (req, res) => {
    const { userId } = req.params
    const archiveStates = await ArchiveState.find({
        $or: [
          { userId }, // deprecated
          { owner: userId },
          {createdBy: userId}
        ],
        // $or: [
        //     {state: 'progress'},
        //     {state: 'queued'},
        //     {state: 'completed'}
        // ]
      })

    res.json({ ok: true, data: archiveStates })
}

exports.downloadFlaggedCollectionsItem = async (req, res) => {
    const { archiveId, messageId } = req.params;

    try {
        console.log(`Looking for backupMessage with archiveId: ${archiveId} and messageId: ${messageId}`);
        const backupMessage = await BackupMessages.findOne({ archiveId, messageIds: { $elemMatch: { id: messageId } } });

        if (!backupMessage) {
            console.log('Backup message not found');
            return res.status(404).json({ ok: false, message: 'Backup message not found' });
        }

        const messages = await Utils.getLargeData(backupMessage.dataId);
        let message = messages.find(message => message.data.id === messageId || message.data.ts === messageId);

        if (!message) {
            console.log('Message not found');
            return res.status(404).json({ ok: false, message: 'Message not found' });
        }

        if (message.type === 'outlook') {
            const content = await Utils.generateArchiveOutlookEml(message.data)
    
            // const attachments = message.data.hasAttachments ? message.data.attachments : []
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
    
            archive.on('error', (err) => {
                throw err;
            });

            archive.on('end', () => {
                OutlookDownloadLog.addLog(messageId, { userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash })
            });
    
            archive.pipe(res);
    
            // Append email content
            archive.append(content, { name: `${message.data.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'No subject'}_${message.hash}.eml` });
    
            await archive.finalize();
        } else if (message.type === 'gmail') {
            const content = Utils.genGmail2Eml(message.data)
    
            const attachments = message.data.attachments || []
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
    
            archive.on('error', (err) => {
                throw err;
            });
    
            archive.pipe(res);
    
            // Append email content
            archive.append(content, { name: `${message.data.payload.headers.find(h => h.name === 'Subject')?.value?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'No subject'}_${message.hash}.eml` });
    
            // Append attachments
            for (const attachment of attachments) {
                const attachmentContent = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                if (!attachmentContent) continue;
                archive.append(Buffer.from(attachmentContent), { name: attachment.filename });
            }
    
            await archive.finalize();
        } else if (message.type === 'slack') {
            const attachments = message.data.files || []
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
    
            archive.on('error', (err) => {
                throw err;
            });
    
            archive.pipe(res);
    
            // Append email content
            archive.append(message.data.message, { name: 'message.txt' });
    
            // Append attachments
            for (const attachment of attachments) {
                const attachmentContent = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                if (!attachmentContent) continue;
                archive.append(Buffer.from(attachmentContent), { name: attachment.name });
            }
    
            await archive.finalize();
        }

    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
}

const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    if (text.length > maxLength) {
      return `${text.substring(0, maxLength)}...`;
    }
    return text;
  };

exports.bulkDownloadFlaggedCollections = async (req, res) => {
    const { archiveId } = req.params;
    const { messageIds } = req.body

    try {
        console.log(`Looking for backupMessage with archiveId: ${archiveId} and messageId: ${messageIds}`);
        const backupMessages = await BackupMessages.find({ archiveId, messageIds: { $elemMatch: { id: {$in: messageIds} } } });

        if (backupMessages) {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
    
            archive.on('error', (err) => {
                throw err;
            });
    
            archive.pipe(res);

            for (const backupMessage of backupMessages) {
                if (!backupMessage) {
                    console.log('Backup message not found');
                    continue
                }
        
                const allmessages = await Utils.getLargeData(backupMessage.dataId);
                let messages = allmessages.filter(message => messageIds.includes(message.data.id) || messageIds.includes(message.data.ts));
                for (const message of messages) {
                    if (!message) {
                        console.log('Message not found');
                        continue
                    }
            
                    if (message.type === 'outlook') {
                        const content = await Utils.generateArchiveOutlookEml(message.data)
                        // const attachments = message.data.hasAttachments ? message.data.attachments : []
                        const folderName = `outlook_${message.data.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'No subject'}`
                        archive.append(content, { name: `${folderName}/${message.hash}.eml` });
                
                        // Append attachments
                        // for (const attachment of attachments) {
                        //     const attachmentContent = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                        //     if (!attachmentContent) continue;
                        //     archive.append(Buffer.from(attachmentContent), { name: `${folderName}/${attachment.name}` });
                        // }
                    } else if (message.type === 'gmail') {
                        const content = Utils.genGmail2Eml(message.data)
                        const folderName = `gmail_${message.data.payload.headers.find(h => h.name === 'Subject')?.value?.replace(/[^a-z0-9]/gi, '_')}`
                        archive.append(content, { name: `${folderName}/${message.hash}.eml` });
    
                        // Append attachments
                        if (message.data.attachments) {
                            for (const attachment of message.data.attachments) {
                                const attachmentContent = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                                if (!attachmentContent) continue;
                                archive.append(Buffer.from(attachmentContent), { name: `${folderName}/${attachment.filename}` });
                            }
                        }
                    } else if (message.type === 'slack') {
                        const attachments = message.data.files || []
                        const folderName = `slack_${truncateText(message.data.message, 20).replace(/[^a-z0-9]/gi, '_')}`
                        archive.append(JSON.stringify(message.data, null, 2), { name: `${folderName}/message.txt` });
    
                        // Append attachments
                        for (const attachment of attachments) {
                            const attachmentContent = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, attachment.s3Key);
                            if (!attachmentContent) continue;
                            archive.append(Buffer.from(attachmentContent), { name: `${folderName}/${attachment.name}` });
                        }
                    } else if (message.type === 'onedrive' || message.type === 'googledrive' || message.type === 'dropbox') {
                        const folderName = `${message.type}_${message.data.label}`
                        const buff = await AWS.downloadFileAsBuffer(config.AWS.OUTLOOK_BUCKET, message.s3Key)
                        if (!buff) continue
                        archive.append(JSON.stringify(message.data, null, 2), { name: `${folderName}/metadata.json` });
                        archive.append(Buffer.from(buff, 'binary'), { name: `${folderName}/${message.data.label}` });
                    }
                }
            }

            await archive.finalize();
        }
    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
}