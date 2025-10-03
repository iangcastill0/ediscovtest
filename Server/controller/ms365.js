const axios = require('axios');
const qs = require('qs');
const archiver = require('archiver');
const User = require('../models/user')
const MS365Workspace = require("../models/ms365workspaces");
const MS365User = require("../models/ms365users");
const OutlookArchive = require("../models/outlook_archive");
const OnedriveArchive = require("../models/onedrive_archive");
const OutlookDownloadLog = require("../models/outlook_download_log")
const ArchiveState = require("../models/archive_state") 

const Utils = require('./utils');
const admin = require("./admin");
const config = require("../config/app.config");
const fs = require('fs')
const path = require('path')

exports.workspaces = async (req, res) => {
    const { includeInvites } = req.query
    let result = [];
    const workspaces = await MS365Workspace.find({ clientId: req.userId });
    if (workspaces) {
        for (let i = 0; i < workspaces.length; i++) {
            const users = await MS365User.find({ workspaceId: workspaces[i]._id });
            result.push({
                workspace: workspaces[i],
                users,
            });
        }
    }

    const invitedWorkspaces = includeInvites == 'false' ? [] : await Utils.invitedWorkspaces(req.userId, 'ms365')
    if (invitedWorkspaces && invitedWorkspaces.length > 0) {
        result = result.concat(invitedWorkspaces)
    }

    admin.logActions(req, { actionType: 'Get MS365 Workspaces', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: result });
}

exports.removeWorkspaces = async (req, res) => {
    // TO-DO remove workspace and everything associated with it.

    let info = {}
    const { workspaceId } = req.params;
    info.dtDeleted = new Date().toISOString()
    const workspace = await MS365Workspace.findById(workspaceId)
    info.name = workspace.displayName
    info.id = workspaceId
    info.type = "Microsoft365"
    const members = await MS365User.find({ workspaceId })
    info.cntMember = members.length
    info.reason = 'By the User'
    info.method = 'Manual'
    info.isRecovery = 'impossible'
    // Remove all users in the workspace.
    await MS365User.deleteMany({ workspaceId });

    //Remove all archives
    const outlookArchives = await OutlookArchive.find({ workspaceId });
    info.cntArchive = outlookArchives?.length
    const outlookArcIds = []
    for (const item of outlookArchives) {
        outlookArcIds.push(item.id)
        await ArchiveState.updateOne({ archiveId: item.id }, { state: 'delete' })
        await Utils.removeOutlookArchive2(item)
    }
    await ArchiveState.deleteMany({ archiveId: { $in: outlookArcIds } })
    await OutlookArchive.deleteMany({ workspaceId })

    // Remove One drive archives
    const onedriveArchives = await OnedriveArchive.find({workspaceId})
    const onedriveArcIds = []
    for (const onedriveArc of onedriveArchives) {
        onedriveArcIds.push(onedriveArc.id)
        await ArchiveState.updateOne({ archiveId: onedriveArc.id }, { state: 'delete' })
        await Utils.removeOneDriveArchive(onedriveArc)
    }
    // delete archive state
    await ArchiveState.deleteMany({ archiveId: { $in: onedriveArcIds } })
    await OnedriveArchive.deleteMany({ workspaceId })

    // delete workspace
    await MS365Workspace.deleteOne({_id: workspaceId })
    const user = await User.findById(req.userId)
    await Utils.sendWorkspaceDeletionMail(user.email, info);

    admin.logActions(req, { actionType: 'Remove MS365 Workspaces', actionDetails: workspaceId, actionResult: 'Success' });

    res.json({ ok: true, data: 'Success' });
}

exports.users = async (req, res) => {
    const users = await MS365User.find({ workspaceId: req.params.workspaceId });
    admin.logActions(req, { actionType: 'Get MS365 users of an organization', actionDetails: `The organization id is ${req.params.workspaceId}`, actionResult: 'Success' });
    res.json({ ok: true, data: users || [] });
}

exports.getUserToken = async (req, res) => {
    const user = await MS365User.findOne({ _id: req.params.userId });

    res.json({ ok: true, data: user ? user.accessToken : '' });
}

exports.requestAuthentication = async (req, res) => {
    const { workspaceId, to } = req.body;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    for (const mail of req.body.to) {
        const member = await MS365User.findOne({ mail, workspaceId });
        if (!member) continue;
        await Utils.sendMS365AuthRequest(mail, member._id, member.displayName, workspace.displayName);
    }
    admin.logActions(req, { actionType: 'Request ms365 authorization', actionDetails: `Send to ${req.body.to.join(',')}`, actionResult: 'Success' });
    res.json({ ok: true });
}

exports.getAccessToken = async (tenant) => {
    const tokenEndpoint = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const data = qs.stringify({
        client_id: config.MS365_APP_INFO.msalConfig.auth.clientId,
        scope: config.MS365_APP_INFO.SCOPES,
        client_secret: config.MS365_APP_INFO.msalConfig.auth.clientSecret,
        grant_type: 'client_credentials'
    });
    try {
        const resp = await axios.post(tokenEndpoint, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return resp.data.access_token;
    } catch (error) {
        throw error;
    }
}

exports.addOrganization = async (accessToken, clientId) => {
    // Headers, including the Authorization header with your access token
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.get(`${config.MS365_APP_INFO.GRAPH_BASE_URL}/organization`, { headers: headers });
        const orgObject = response.data.value[0];

        // Check if the workspace already exists
        let workspace = await MS365Workspace.findOne({ orgId: orgObject.id });
        if (workspace) {
            workspace.displayName = orgObject.displayName;
            workspace.orgObject = orgObject;
            workspace.accessToken = accessToken;
            workspace.clientId = clientId;
            await workspace.save();
        } else {
            // Create a new workspace
            workspace = new MS365Workspace({
                orgId: orgObject.id,
                displayName: orgObject.displayName,
                orgObject: orgObject,
                clientId
            });
            await workspace.save();
        }

        //Get users list in the workspace
        const resp = await axios.get(`${config.MS365_APP_INFO.GRAPH_BASE_URL}/users`, { headers: headers });
        const users = resp.data.value;
        console.log('tenant users:', JSON.stringify(resp.data, null, 2))
        users.map(async (userInfo) => {
            // Check if the user already exists
            let user = await MS365User.findOne({ workspaceId: workspace._id, userId: userInfo.id });
            let userInfoId = userInfo.id
            delete userInfo.id
            if (user) {
                user.displayName = userInfo.displayName;
                user.businessPhones = userInfo.businessPhones;
                user.givenName = userInfo.givenName;
                user.jobTitle = userInfo.jobTitle;
                user.mail = userInfo.mail;
                user.mobilePhone = userInfo.mobilePhone;
                user.displayName = userInfo.displayName;
                user.officeLocation = userInfo.officeLocation;
                user.preferredLanguage = userInfo.preferredLanguage;
                user.userPrincipalName = userInfo.userPrincipalName;
                user.save();
            } else {
                user = new MS365User({
                    ...userInfo, workspaceId: workspace._id, userId: userInfoId
                });
                await user.save();
            }
        });

    } catch (error) {
        throw error;
    }
}

exports.token = async (req, res) => {
    const { workspaceId } = req.params;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    try {
        const accessToken = await exports.getAccessToken(workspace.orgId);
        return res.json({
            ok: true,
            accessToken
        });
    } catch (error) {
        console.log(error);
        return res.json({
            ok: false
        })
    }
}

exports.downloadOutlook = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    const accessToken = await exports.getAccessToken(workspace.orgId);

    const { message } = req.body;

    try {
        if (!message) {
            console.log('Message not found');
            return res.status(404).json({ ok: false, message: 'Message not found' });
        }

        const content = await Utils.generateOutlookEml(message, accessToken, userId);
        const hash = Utils.generateHash(message);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });


        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(res);

        // Append email content
        archive.append(content, { name: `${message.subject?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'No subject'}_${hash}.eml` });

        await archive.finalize();
        OutlookDownloadLog.addLog(message.id, { userId: req.userId, downloadedAt: new Date().toISOString(), hash })
    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.downloadAttachment = async (req, res) => {
    const { workspaceId, userId, messageId, attachmentId } = req.params;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    const accessToken = await exports.getAccessToken(workspace.orgId);

    const blobData = await Utils.getOutlookAttachment(accessToken, userId, messageId, attachmentId)
    
    res.send(blobData)
}

exports.downloadAttachment2 = async (req, res) => {
    const { workspaceId, userId, messageId, attachmentId } = req.params;
    const { fileName } = req.query
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    const accessToken = await exports.getAccessToken(workspace.orgId);

    const blobData = await Utils.getOutlookAttachment(accessToken, userId, messageId, attachmentId)

    try {
        const zipPath = path.join(__dirname, `outlook_messages_${new Date().getTime()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);

            res.setHeader('Content-Disposition', 'attachment; filename="outlook_message.zip"');
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
        archive.append(blobData, { name: fileName });

        await archive.finalize();
    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
}

async function fetchMessageWithRetry(userId, messageId, accessToken, maxRetries = 3) {
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            const response = await axios.get(
                `https://graph.microsoft.com/v1.0/users/${userId}/messages/${messageId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 429) {
                const retryAfter = parseInt(err.response.headers["retry-after"] || "5", 10);
                console.warn(
                    `Rate limited on message ${messageId}. Retrying after ${retryAfter}s (attempt ${attempt + 1})`
                );
                await new Promise(res => setTimeout(res, retryAfter * 1000));
                attempt++;
            } else {
                throw err;
            }
        }
    }

    throw new Error(`Failed to fetch message ${messageId} after ${maxRetries} retries`);
}

exports.bulkDownloadOutlook_v2 = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    const accessToken = await exports.getAccessToken(workspace.orgId);

    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ ok: false, message: "No message IDs provided" });
    }

    try {
        const zipPath = path.join(__dirname, `outlook_messages_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);

            res.setHeader("Content-Disposition", 'attachment; filename="outlook_messages.zip"');
            res.setHeader("Content-Type", "application/zip");
            res.sendFile(zipPath, err => {
                if (err) {
                    console.log(`Error in sending zip file: ${err}`);
                    return res.status(500).json({ ok: false, message: "Error in sending zip file" });
                }

                console.log("Zip file sent successfully");
                fs.unlink(zipPath, unlinkErr => {
                    if (unlinkErr) {
                        console.log(`Error deleting zip file: ${unlinkErr}`);
                    }
                    console.log(`Deleted zip file: ${zipPath}`);
                });

                // Logging
                for (const msg of fetchedMessages) {
                    OutlookDownloadLog.addLog(msg.id, {
                        userId: req.userId,
                        downloadedAt: new Date().toISOString(),
                        hash: msg.hash,
                    });
                }
            });
        });

        archive.on("error", err => { throw err; });
        archive.pipe(output);

        let fetchedMessages = [];
        for (const id of messageIds) {
            const message = await fetchMessageWithRetry(userId, id, accessToken);
            const content = await Utils.generateOutlookEml(message, accessToken, userId);
            const hash = Utils.generateHash(message);
            const folderName = `${message.subject?.replace(/[^a-z0-9]/gi, "_") || "no_subject"}_${hash}`;
            archive.append(content, { name: `${folderName}/${folderName}.eml` });

            // Uncomment if attachments needed
            // const attachments = await Utils.getOutlookAttachments(accessToken, message.id, userId);
            // for (const attachment of attachments) {
            //     const attachmentContent = await Utils.getAttachmentContent(accessToken, userId, message.id, attachment.id);
            //     archive.append(Buffer.from(attachmentContent, "base64"), { name: `${folderName}/${attachment.name}` });
            // }

            message.hash = hash;
            fetchedMessages.push(message);
        }

        await archive.finalize();
    } catch (error) {
        console.error(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: "Internal server error" });
    }
};

exports.bulkDownloadOutlook = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const workspace = await MS365Workspace.findOne({ _id: workspaceId });
    const accessToken = await exports.getAccessToken(workspace.orgId);

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ ok: false, message: 'No messages provided' });
    }

    try {
        const zipPath = path.join(__dirname, `outlook_messages_${new Date().getTime()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);

            res.setHeader('Content-Disposition', 'attachment; filename="outlook_messages.zip"');
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

                // Add log
                for (const message of messages) {
                    OutlookDownloadLog.addLog(message.id, {userId: req.userId, downloadedAt: new Date().toISOString(), hash: message.hash})
                }
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        for (const message of messages) {
            const content = await Utils.generateOutlookEml(message, accessToken, userId);
            const hash = Utils.generateHash(message)
            const folderName = `${message.subject?.replace(/[^a-z0-9]/gi, '_') || 'no_subject'}_${hash}`;
            archive.append(content, { name: `${folderName}/${folderName}.eml` });

            // const attachments = await Utils.getOutlookAttachments(accessToken, message.id, userId);

            // for (const attachment of attachments) {
            //     const attachmentContent = await Utils.getAttachmentContent(accessToken, userId, message.id, attachment.id);
            //     archive.append(Buffer.from(attachmentContent, 'base64'), { name: `${folderName}/${attachment.name}` });
            // }
            message.hash = hash
        }

        await archive.finalize();
    } catch (error) {
        console.log(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};

exports.outlookFolders = async (req, res) => {
    const {workspaceId, userId} = req.params
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId);
    
        const mailFolders = await Utils.outlookFolders(accessToken, userId)

        return res.json({ok:true, mailFolders})
    } catch (error) {
        console.log("ms365.js outlookFolders-> ", error)
    }

    return res.json({ok: false, mailFolders: []})
}

exports.outlookFolderMessages = async (req, res) => {
    const {workspaceId, userId, folderId} = req.params;
    const {page, limit = 10, ...searchParams} = req.query; // Destructure all search params
    
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId);
    
        const {messages, totalCount} = await Utils.outlookFolderMessages(
            accessToken, 
            userId, 
            folderId, 
            page, 
            limit, 
            searchParams
        );
        
        return res.json({ ok: true, messages, totalCount });
    } catch (error) {
        console.error("ms365.js outlookFolders error:", error);
        return res.status(500).json({ ok: false, error: error.message, messages: [] });
    }
};

exports.oneDriveFolderItems = async (req, res) => {
    const {workspaceId, userId, folderId} = req.params
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId);
    
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${folderId}/children`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return res.json({ok:true, items: response.data.value});
        } catch (error) {
            console.error('Error listing items in folder', error);
            throw error;
        }
    } catch (error) {
        console.log("ms365.js outlookFolders-> ", error)
    }

    return res.json({ok: false, items: []})
}

exports.getOutlookCounts = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { keywords, startDate, endDate } = req.query;
    
    const keywordList = keywords?.toLowerCase().split(",").map(k => k.trim()) || [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // TO-DO
}


exports.getOnedriveCounts = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { keywords, startDate, endDate } = req.query;
    
    const keywordList = keywords?.toLowerCase().split(",").map(k => k.trim()) || [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // TO-DO

}

exports.filter = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { keywords, startDate, endDate } = req.query;
    
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId);
        
        const keywordList = keywords?.toLowerCase().split(",").map(k => k.trim()) || [];
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        let fileCount = 0;
        let folderCount = 0;
        
        async function traverseFolder(folderId = 'root') {
            const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${folderId}/children?$top=999`;

            const response = await axios.get(url, {
                    headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
        
            const items = response.data.value;
        
            for (const item of items) {
                const nameMatches = keywordList.length === 0 || keywordList.some(keyword =>
                    item.name.toLowerCase().includes(keyword)
                );
                const createdDate = new Date(item.createdDateTime);
                let lastModifiedDateTime = undefined
                if (item.lastModifiedDateTime)
                    lastModifiedDateTime = new Date(item.lastModifiedDateTime)
                const inDateRange1 = (!start || createdDate >= start) && (!end || createdDate <= end);
                const inDateRange2 = lastModifiedDateTime && (!start || lastModifiedDateTime >= start) && (!end || lastModifiedDateTime <= end);
                if (nameMatches && (inDateRange1 || inDateRange2)) {
                    if (item.folder) folderCount++;
                    else fileCount++;
                }
            
                // Recursively go into subfolders
                if (item.folder) {
                    await traverseFolder(item.id);
                }
            }
        }
        
        await traverseFolder();
        
        return res.json({
            ok: true,
            fileCount,
            folderCount
        });
    
    } catch (error) {
        console.error("Error in OneDrive recursive filter:", error.message);
        return res.status(500).json({ ok: false, error: error.message });
    }
};

exports.oneDriveSharedWithMe = async (req, res) => {
    const {workspaceId, userId} = req.params
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId); 
    
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/sharedWithMe`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return res.json({ok:true, items: response.data.value});
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log("ms365.js oneDriveSharedWithMe-> ", error)
    }

    return res.json({ok: false, items: []})
}

exports.oneDriveSharedByYou = async (req, res) => {
    const {workspaceId, userId} = req.params
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId); 
    
        try {
            let files = [];
            let nextLink = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root/children`;
            while (nextLink) {
                const response = await axios.get(nextLink, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const items = response.data.value;
        
                for (const item of items) {
                    const permissionsResponse = await axios.get(
                    `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${item.id}/permissions`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                    );
        
                    const sharedPermissions = permissionsResponse.data.value.filter(
                    (permission) =>
                        permission.grantedTo?.user?.id && permission.grantedTo.user.id !== item.createdBy.user.id
                    );
        
                    if (sharedPermissions.length > 0) {
                    files.push({
                        id: item.id,
                        name: item.name,
                        sharedWith: sharedPermissions.map((perm) => perm.grantedTo?.user?.displayName || 'Unknown'),
                    });
                    }
                }
        
                // Handle pagination
                nextLink = response.data['@odata.nextLink'];
            }
            return res.json({ok:true, items: files});
        } catch (error) {
            throw error;
        }
    } catch (error) {
        console.log("ms365.js oneDriveSharedWithMe-> ", error)
    }

    return res.json({ok: false, items: []})
}

exports.oneDriveItemVersions = async (req, res) => {
    const {workspaceId, userId, itemId} = req.params
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        const accessToken = await exports.getAccessToken(workspace.orgId);
    
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}/versions`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return res.json({ok:true, versions: response.data.value});
        } catch (error) {
            console.error('Error versions of items in folder', error);
            throw error;
        }
    } catch (error) {
        console.log("ms365.js oneDriveItemVersions-> ", error)
    }

    return res.json({ok: false, items: []})
}

exports.downloadOnedriveFile = async (req, res) => {
    const { workspaceId, userId, itemId } = req.params;
    try {
        const workspace = await MS365Workspace.findOne({ _id: workspaceId });
        if (!workspace) {
            return res.status(404).json({ ok: false, message: 'Workspace not found' });
        }

        const accessToken = await exports.getAccessToken(workspace.orgId);
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}`;
        
        const metadataResponse = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const fileMetadata = metadataResponse.data;
        const downloadUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}/content`;
        
        const fileResponse = await axios({
            method: 'get',
            url: downloadUrl,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.name}"`);
        res.setHeader('Content-Type', fileMetadata.file.mimeType || 'application/octet-stream');
        
        fileResponse.data.pipe(res);

        fileResponse.data.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                res.status(500).json({ ok: false, message: 'Error streaming file' });
            }
        });

    } catch (error) {
        console.error("Error in downloadOnedriveFile:", error);
        if (!res.headersSent) {
            res.status(500).json({ 
                ok: false, 
                message: 'Failed to download file',
                error: error.message 
            });
        }
    }
};

