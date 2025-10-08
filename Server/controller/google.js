const axios = require('axios');
const qs = require('qs');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const GoogleWorkspace = require("../models/googleworkspaces");
const GoogleUser = require("../models/googleusers");
const Utils = require('./utils');
const admin = require("./admin");
const config = require("../config/app.config");
const GmailArchive = require('../models/gmail_archive');
const ArchiveState = require('../models/archive_state');
const DriveArchive = require('../models/drive_archive');
const User = require('../models/user');
const { google } = require('googleapis');
const { oauth2ClientTest } = require('../services/googleClient.js')

exports.workspaces = async (req, res) => {
    const { includeInvites } = req.query 
    let result = [];
    const workspaces = await GoogleWorkspace.find({clientId: req.userId});
    if (workspaces) {
        for (let i = 0; i < workspaces.length; i++) {
            const users = await GoogleUser.find({ workspaceId: workspaces[i]._id });
            result.push({
                workspace: workspaces[i],
                users,
            });
        }
    }

    const invitedWorkspaces = includeInvites == 'false' ? [] : await Utils.invitedWorkspaces(req.userId, 'google')
    if (invitedWorkspaces && invitedWorkspaces.length > 0) {
        result = result.concat(invitedWorkspaces)
    }

    admin.logActions(req, { actionType: 'Get Google Workspaces', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: result });
}

exports.users = async (req, res) => {
    const users = await GoogleUser.find({ workspaceId: req.params.workspaceId });
    admin.logActions(req, { actionType: 'Get Google users of an organization', actionDetails: `The organization id is ${req.params.workspaceId}`, actionResult: 'Success' });
    res.json({ ok: true, data: users || [] });
}

exports.removeWorkspace = async (req, res) => {
    let info = {}
    const { workspaceId } = req.params;
    info.dtDeleted = new Date().toISOString()
    const workspace = await GoogleWorkspace.findById(workspaceId)
    info.name = workspace.displayName
    info.id = workspaceId
    info.type = "Google Workspace"
    const members = await GoogleUser.find({ workspaceId })
    info.cntMember = members.length
    info.reason = 'By the User'
    info.method = 'Manual'
    info.isRecovery = 'impossible'
    // Remove all users in the workspace.
    await GoogleUser.deleteMany({ workspaceId });

    //Remove all archives
    const gmailArchives = await GmailArchive.find({ workspaceId });
    info.cntArchive = gmailArchives?.length
    const gmailArcIds = []
    for (const item of gmailArchives) {
        gmailArcIds.push(item.id)
        await ArchiveState.updateOne({ archiveId: item.id }, { state: 'delete' })
        await Utils.removeGmailArchive(item)
    }
    await ArchiveState.deleteMany({ archiveId: { $in: gmailArcIds } })
    await GmailArchive.deleteMany({ workspaceId })

    // Remove One drive archives
    const gdriveArchives = await DriveArchive.find({workspaceId})
    const gdriveArcIds = []
    for (const gdriveArc of gdriveArchives) {
        gdriveArcIds.push(gdriveArc.id)
        await ArchiveState.updateOne({ archiveId: gdriveArc.id }, { state: 'delete' })
        await Utils.removeGoogleDriveArchive(gdriveArc)
    }
    // delete archive state
    await ArchiveState.deleteMany({ archiveId: { $in: gdriveArcIds } })
    await DriveArchive.deleteMany({ workspaceId })
    await GoogleWorkspace.deleteOne({_id: workspaceId})
    const user = await User.findById(req.userId)
    await Utils.sendWorkspaceDeletionMail(user.email, info);

    admin.logActions(req, { actionType: 'Remove Google Workspaces', actionDetails: workspaceId, actionResult: 'Success' });

    res.json({ ok: true, data: 'Success' });
}

exports.downloadSingleGmail = async (req, res) => {
    try {
        const {workspaceId, userId, mailId} = req.params;
        const {isPersonal} = req.query;
        let auth
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/gmail.readonly' ],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId)
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken)
        }
        const gmail = google.gmail({version: 'v1', auth: isPersonal !== 'true' ? auth : oauth2ClientTest });
        
        const zipPath = path.join(__dirname, `gmail_messages_${new Date().getTime()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);

            res.setHeader('Content-Disposition', 'attachment; filename="gmail_message.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.sendFile(zipPath, (err) => {
                if (err) {
                    console.log(`Error in sending zip file: ${err}`);
                    return res.status(500).json({ ok: false, message: 'Error in sending zip file' });
                }

                console.log('Zip file sent successfully');
                fs.unlink(zipPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.log(`Error deleting zip file: ${unlinkErr}`);
                    }
                    console.log(`Deleted zip file: ${zipPath}`);
                });

                // // Add log
                // for (const message of messages) {
                //     OutlookDownloadLog.addLog(message.id, {userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash})
                // }
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);  
        const [content, subject] = await Utils.gmailMessageToEml(gmail, mailId)
        archive.append(content, { name: `${subject?.replace(/[^a-z0-9]/gi, '_') || 'no_subject'}.eml` });

        await archive.finalize();

    } catch (err) {
        console.log('using google service err:', err);
        res.json(null);
    }
};

exports.bulkDownload = async (req, res) => {
    const {workspaceId, userId} = req.params
    const {messageIds, isPersonal} = req.body
    let auth
    if (isPersonal !== 'true') {
        auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
            clientOptions: { subject: userId },
        });
    } else {
        const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
        if (!googleWorkspace || !googleWorkspace.accessToken) {
            return res.json({ok: false, message: 'No authorized'})
        }
        oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
        auth = oauth2ClientTest;
    }

    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const zipPath = path.join(__dirname, `gmail_messages_${new Date().getTime()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);

            res.setHeader('Content-Disposition', 'attachment; filename="gmail_message.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.sendFile(zipPath, (err) => {
                if (err) {
                    console.log(`Error in sending zip file: ${err}`);
                    return res.status(500).json({ ok: false, message: 'Error in sending zip file' });
                }

                console.log('Zip file sent successfully');
                fs.unlink(zipPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.log(`Error deleting zip file: ${unlinkErr}`);
                    }
                    console.log(`Deleted zip file: ${zipPath}`);
                });
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);  
        
        for (const mailId of messageIds) {
            const [content, subject] = await Utils.gmailMessageToEml(gmail, mailId)
            archive.append(content, { name: `${subject?.replace(/[^a-z0-9]/gi, '_') || 'no_subject'}.eml` });
        }
        
        await archive.finalize();
    } catch (error) {
        res.json({ok: false, message: error.toString()});
    }
    
}

exports.appId = (req, res) => {
    
    res.json({ok: config.GOOGLE_APP_INFO.APP_ID ? true : false, appId: config.GOOGLE_APP_INFO.APP_ID})
}