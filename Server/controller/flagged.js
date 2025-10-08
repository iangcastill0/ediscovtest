const fs = require('fs')
const path = require('path')
const archiver = require('archiver');
const { google } = require('googleapis');
const { Dropbox } = require('dropbox');
const axios = require('axios')

const config = require("../config/app.config");
const CollectionList = require('../models/collection_list'); 
const FlaggedCollection = require("../models/flagged_collections");
const ArchiveState = require("../models/archive_state")
const FlaggedArchive = require("../models/flagged_archive")
const MS365Workspace = require("../models/ms365workspaces");
const GoogleWorkspace = require("../models/googleworkspaces");
const SlackTeam = require('../models/slack_team')
const SlackMember = require('../models/slack_member')
const DropboxWorkspace = require('../models/dropboxworkspace')
const DropboxMembers = require('../models/dropboxmembers')
const ms365Controller = require("./ms365")
const dropboxController = require("./dropbox")
const Utils = require('./utils');

const FLAGGED_COLLECTION_VERSION = 1

const oauth2ClientTest = new google.auth.OAuth2(
    config.GOOGLE_APP_INFO.CLIENT_ID,
    config.GOOGLE_APP_INFO.CLIENT_SECRET,
    config.GOOGLE_APP_INFO.REDIRECT_URI
);

exports.getCollectionList = async (req, res) => {
    try {
        const collectionList = await CollectionList.aggregate([
            { $match: { userId: req.userId } },

            {
                $lookup: {
                    from: "flaggedcollections",
                    let: { collectionIdStr: { $toString: "$_id" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", req.userId] },
                                        { $eq: ["$collectionId", "$$collectionIdStr"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "items"
                },
                
            },

            { $addFields: { itemCount: { $size: "$items" } } },
            { $project: { items: 0 } }
        ]);

        res.json({ ok: true, data: collectionList });
    } catch (error) {
        console.error("Get Collection List Error:", error.toString());
        res.json({ ok: false, data: [] });
    }
};

exports.createFlaggedList = async (req, res) => {
    const {name, color} = req.body
    try {
        const collections = await CollectionList.create({
            name,
            color,
            userId: req.userId
        })

        res.json({ok: true, data: collections})
    } catch (error) {
        console.log("Create Flagged Collection List Error: ", error.toString())
        res.json({ok: false})
    }
}

exports.storeFlaggedCollection = async (req, res) => {
    const {collectionId, type, data} = req.body
    try {
        const collection = await FlaggedCollection.create({
            userId: req.userId,
            collectionId,
            type,
            data
        })

        res.json({ok: true, data: collection})
    } catch (error) {
        console.log("Create Flagged Collection List Error: ", error.toString())
        res.json({ok: false})
    }
}

exports.getFlaggedCollections = async (req, res) => {
    const {collectionId} = req.params
    try {
        const collections = await FlaggedCollection.find({
            userId: req.userId,
            collectionId
        })

        res.json({ok: true, data: collections})
    } catch (error) {
        console.log("Create Flagged Collection List Error: ", error.toString())
        res.json({ok: false})
    }
}

exports.getStoredCollectionsMap = async (req, res) => {
    const { type } = req.params

    try {
        const result = {}
        const collections = await FlaggedCollection.find({
            userId: req.userId,
            type
        })

        let key = ''
        if (type === 'slack') {
            key = 'ts'
        } else {
            key = 'id'
        }
        
        collections.map((e) => {
            result[e.data[key]] = e.collectionId
        })

        res.json({ok: true, data: result})
    } catch (error) {
        console.log("Create Flagged Collection List Error: ", error.toString())
        res.json({ok: false})
    }
}

exports.deleteStoredCollection = async (req, res) => {
    const { type, id, dataId } = req.params;

    if (!type || !id || !dataId) {
        return res.status(400).json({ 
            ok: false, 
            message: 'Missing required parameters: type, id, or dataId' 
        });
    }

    try {
        const query = { 
            type, 
            collectionId: id 
        };

        if (type === 'slack') {
            query['data.ts'] = dataId;
        } else {
            query['data.id'] = dataId; 
        }

        const result = await FlaggedCollection.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                ok: false, 
                message: 'No matching document found to delete' 
            });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error("Delete Flagged Collection Error: ", error);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to delete collection',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.archive = async (req, res) => {
    const { collectionId, collectionName } = req.params;

    const collections = await FlaggedCollection.find({collectionId, userId: req.userId})
    if (collections) {
        
        // initial create models
        const archiveState = await ArchiveState.create({
            type: 'FlaggedCollections',
            appId: collectionId,
            filters: {
                jobName: collectionName
            },  
            state: 'queued',
            totalCount: collections.length,
            owner: req.userId,
            createdBy: req.userId
        })
    
        const flaggedArchive = await FlaggedArchive.create({
            jobId: collectionId,
            jobName: collectionName,
            filters: {
                jobName: collectionName
            },
            collectionId,
            backups: [],
            size: 0,
            owner: req.userId,
            createdBy: req.userId,
            version: FLAGGED_COLLECTION_VERSION
        });
        await ArchiveState.updateOne({_id: archiveState._id}, {archiveId: flaggedArchive.id, detailType: 'FlaggedCollections'})

        res.json({ok: true, data: archiveState})

    } else {
        res.json({ok: false, data: 'Empty collections'})
    }

};

exports.deleteCollection = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ 
            ok: false, 
            message: 'Missing required parameters: id' 
        });
    }

    try {
        const query = { 
            _id: id 
        };

        const result = await CollectionList.deleteOne(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                ok: false, 
                message: 'No matching document found to delete' 
            });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error("Delete Flagged Collection Error: ", error);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to delete collection',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.multiRemoveCollections = async (req, res) => {
    const {selected} = req.body
    try {

        const result = await FlaggedCollection.deleteMany({
            _id: { $in: selected }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                ok: false, 
                message: 'No matching document found to delete' 
            });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error("Delete Flagged Collections Error: ", error);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to delete collections',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

exports.bulkDownload = async (req, res) => {
    const { collectionIds } = req.body;

    if (!collectionIds || !Array.isArray(collectionIds) || collectionIds.length === 0) {
        return res.status(400).json({ ok: false, message: 'Invalid or empty collectionIds array' });
    }

    try {
        const collections = await FlaggedCollection.find({ _id: { $in: collectionIds } });
        
        if (!collections || collections.length === 0) {
            return res.status(404).json({ ok: false, message: 'No collections found with the provided IDs' });
        }

        const zipPath = path.join(__dirname, `flagged_messages_${new Date().getTime()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath} (${archive.pointer()} total bytes)`);
            res.setHeader('Content-Disposition', 'attachment; filename="flagged_messages.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.sendFile(zipPath, (err) => {
                if (err) {
                    console.log(`Error in sending zip file: ${err}`);
                    return res.status(500).json({ ok: false, message: 'Error in sending zip file' });
                }
                fs.unlink(zipPath, (unlinkErr) => {
                    if (unlinkErr) console.log(`Error deleting zip file: ${unlinkErr}`);
                    else console.log(`Deleted zip file: ${zipPath}`);
                });
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        const ms365Token = {};
        const googleAuth = {};

        for (const collection of collections) {
            try {
                if (!collection.type || !collection.data) {
                    console.warn(`Skipping collection ${collection._id}: missing type or data`);
                    continue;
                }

                const message = collection.data;
                let hash = ''
                let folderName = ''
                let auth;
                switch (collection.type) {
                    case 'outlook':
                        // Validate Outlook message structure
                        if (!message.workspaceId || !message.userId || !message.id || !message.subject) {
                            console.warn(`Skipping Outlook message ${collection._id}: missing required fields`);
                            continue;
                        }

                        let accessToken = ms365Token[message.workspaceId];
                        if (!accessToken) {
                            const workspace = await MS365Workspace.findOne({ _id: message.workspaceId });
                            if (!workspace) {
                                console.warn(`Skipping Outlook message ${collection._id}: workspace not found`);
                                continue;
                            }
                            accessToken = await ms365Controller.getAccessToken(workspace.orgId);
                            ms365Token[message.workspaceId] = accessToken;
                        }

                        const content = await Utils.generateOutlookEml(message, accessToken, message.userId);
                        hash = Utils.generateHash(message);
                        folderName = `${message.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'no_subject'}_${hash}`;
                        
                        archive.append(content, { name: `Outlook/${folderName}.eml` });

                        // if (message.attachments && Array.isArray(message.attachments)) {
                        //     for (const attachment of message.attachments) {
                        //         if (!attachment.id || !attachment.name) {
                        //             console.warn(`Skipping attachment in message ${collection._id}: missing id or name`);
                        //             continue;
                        //         }
                        //         try {
                        //             const attachmentContent = await Utils.getAttachmentContent(accessToken, message.userId, message.id, attachment.id);
                        //             archive.append(Buffer.from(attachmentContent, 'base64'), { name: `${folderName}/${attachment.name}` });
                        //             archive.append(JSON.stringify(attachment, null, 2), { name: `${folderName}/${attachment.name}.json` });
                        //         } catch (err) {
                        //             console.warn(`Failed to download attachment ${attachment.id} for message ${collection._id}:`, err);
                        //         }
                        //     }
                        // }
                        break;

                    case 'gmail':
                        if (!message.workspaceId || !message.userId || !message.id || !message.payload) {
                            console.warn(`Skipping Gmail message ${collection._id}: missing required fields`);
                            continue;
                        }

                        if (message.isPersonal !== 'true') {
                            auth = googleAuth[`${message.workspaceId}_${message.userId}`];
                            if (!auth) {
                                auth = await google.auth.getClient({
                                    keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                                    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                                    clientOptions: { subject: message.userId },
                                });
                                googleAuth[`${message.workspaceId}_${message.userId}`] = auth;
                            }
                        } else {
                            const googleWorkspace = await GoogleWorkspace.findById(message.workspaceId);
                            if (!googleWorkspace || !googleWorkspace.accessToken) {
                                console.warn(`Skipping personal Gmail message ${collection._id}: workspace not found or missing access token`);
                                continue;
                            }
                            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
                            auth = oauth2ClientTest;
                        }

                        const gmail = google.gmail({ version: 'v1', auth });
                        hash = Utils.generateHash(message);
                        const subject = message.payload.headers.find(h => h.name === 'Subject')?.value || "Unknown";
                        folderName = `${subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${hash}`;
                        try {
                            const [content, subject] = await Utils.gmailMessageToEml(gmail, message.id)
                            archive.append(content, {  name: `Gmail/${subject?.replace(/[^a-z0-9]/gi, '_') || 'no_subject'}.eml` });

                            // const attachments = Utils.getGmailAttachments(selectedMessagesDetails.data?.payload?.parts);
                            // if (attachments && Array.isArray(attachments)) {
                            //     for (const attachment of attachments) {
                            //         if (!attachment.attachmentId || !attachment.filename) {
                            //             console.warn(`Skipping attachment in Gmail message ${collection._id}: missing attachmentId or filename`);
                            //             continue;
                            //         }
                            //         try {
                            //             const attachmentResponse = await gmail.users.messages.attachments.get({
                            //                 userId: 'me',
                            //                 messageId: message.id,
                            //                 id: attachment.attachmentId,
                            //             });
                            //             const attachmentData = attachmentResponse.data?.data;
                            //             archive.append(Buffer.from(attachmentData, 'base64'), { name: `${folderName}/${attachment.filename}` });
                            //             archive.append(JSON.stringify(attachment, null, 2), { name: `${folderName}/${attachment.filename}.json` });
                            //         } catch (err) {
                            //             console.warn(`Failed to download Gmail attachment ${attachment.attachmentId} for message ${collection._id}:`, err);
                            //         }
                            //     }
                            // }
                        } catch (error) {
                            console.warn(`Skipping attachment in Gmail message ${collection._id}: missing attachmentId or filename`, error);
                            continue;
                        }
                        break;

                    case 'slack':
                        if (!collection.data.teamId || !collection.data.userId || !collection.data.message) {
                            console.warn(`Skipping Slack message ${collection._id}: missing required fields`);
                            continue;
                        }

                        const data = collection.data;
                        hash = Utils.generateHash(data);
                        folderName = `${data.message.substring(0, 15).replace(/[^a-z0-9]/gi, '_') || 'no subject'}_${hash}`;
                        
                        archive.append(JSON.stringify(data, null, 2), { name: `Slack/${folderName}/${folderName}.txt` });

                        if (data.files && Array.isArray(data.files)) {
                            for (const file of data.files) {
                                if (!file.id || !file.name || !file.url_private) {
                                    console.warn(`Skipping file in Slack message ${collection._id}: missing id, name, or url_private`);
                                    continue;
                                }
                                try {
                                    const filePath = path.join(config.SLACK_FILES_DIR, `${data.teamId}/${file.id}`);
                                    if (!fs.existsSync(filePath)) {
                                        const team = await SlackTeam.findOne({ _id: data.teamId });
                                        if (!team) {
                                            console.warn(`Skipping Slack file ${file.id}: team not found`);
                                            continue;
                                        }
                                        const member = await SlackMember.findOne({ team: data.teamId, user_id: data.userId });
                                        await Utils.downloadFileFromSlack(
                                            data.teamId,
                                            file.id,
                                            file.url_private,
                                            member?.access_token || team.accessToken
                                        );
                                    }
                                    archive.append(fs.readFileSync(filePath), { name: `Slack/${folderName}/${file.name}` });
                                    archive.append(JSON.stringify(file, null, 2), { name: `Slack/${folderName}/${file.name}.json` });
                                } catch (err) {
                                    console.warn(`Failed to download Slack file ${file.id} for message ${collection._id}:`, err);
                                }
                            }
                        }
                        break;

                    case 'onedrive':
                        if (!message.workspaceId || !message.userId || !message.id) {
                            console.warn(`Skipping OneDrive file ${collection._id}: missing required fields`);
                            continue;
                        }

                        let oneDriveAccessToken = ms365Token[message.workspaceId];
                        if (!oneDriveAccessToken) {
                            const workspace = await MS365Workspace.findOne({ _id: message.workspaceId });
                            if (!workspace) {
                                console.warn(`Skipping OneDrive file ${collection._id}: workspace not found`);
                                continue;
                            }
                            oneDriveAccessToken = await ms365Controller.getAccessToken(workspace.orgId);
                            ms365Token[message.workspaceId] = oneDriveAccessToken;
                        }

                        const downloadUrl = `https://graph.microsoft.com/v1.0/users/${message.userId}/drive/items/${message.id}/content`;
                        const fileHash = Utils.generateHash(message);
                        const oneDriveFolderName = `${message.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}_${fileHash}`;

                        try {
                            const fileResponse = await axios({
                                method: 'get',
                                url: downloadUrl,
                                headers: {
                                    Authorization: `Bearer ${oneDriveAccessToken}`
                                },
                                responseType: 'stream'
                            });

                            archive.append(fileResponse.data, { name: `Onedrive/${message.name}` });

                            archive.append(JSON.stringify({...message, hash: fileHash}, null, 2), { name: `Onedrive/${message.name}.json` });
                        } catch (err) {
                            console.warn(`Failed to download OneDrive file ${message.id}:`, err);
                            archive.append(`Error downloading file: ${err.message}`, {
                                name: `Onedrive/${message.name}_error.txt`
                            });
                        }
                        break;
                    case 'googledrive':
                        if (!message.workspaceId || !message.userId || !message.id) {
                            console.warn(`Skipping GoogleDrive file ${collection._id}: missing required fields`);
                            continue;
                        }

                        if (message.isPersonal !== 'true') {
                            auth = googleAuth[`${message.workspaceId}_${message.userId}`];
                            if (!auth) {
                                auth = await google.auth.getClient({
                                    keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                                    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                                    clientOptions: { subject: message.userId },
                                });
                                googleAuth[`${message.workspaceId}_${message.userId}`] = auth;
                            }
                        } else {
                            const googleWorkspace = await GoogleWorkspace.findById(message.workspaceId);
                            if (!googleWorkspace || !googleWorkspace.accessToken) {
                                console.warn(`Skipping personal Google drive message ${collection._id}: workspace not found or missing access token`);
                                continue;
                            }
                            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
                            auth = oauth2ClientTest;
                        }

                        hash = Utils.generateHash(message);
                        folderName = `${message.label.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}_${hash}`;

                        try {
                            const drive = google.drive({
                                version: 'v3',
                                auth
                            });
                            const response = await drive.files.get({
                                fileId: message.id,
                                alt: 'media'
                            }, { responseType: 'stream' });

                            archive.append(response.data, { name: `Googledrive/${message.label}` });

                            archive.append(JSON.stringify({...message, hash: hash}, null, 2), { name: `Googledrive/${message.label}.json` });
                        } catch (err) {
                            console.warn(`Failed to download GoogleDrive file ${message.id}:`, err);
                            archive.append(`Error downloading file: ${err.message}`, {
                                name: `Googledrive/${message.label}_error.txt`
                            });
                        }
                        break;
                    case 'dropbox':
                        if (!message.workspaceId || !message.userId || !message.id) {
                            console.warn(`Skipping Dropbox file ${collection._id}: missing required fields`);
                            continue;
                        }

                        const dropboxWorkspace = await DropboxWorkspace.findById(message.workspaceId);
                        if (!dropboxWorkspace) {
                            console.warn(`Skipping personal Dropbox ${collection._id}: workspace not found or missing access token`);
                            continue;
                        }

                        hash = Utils.generateHash(message);
                        folderName = `${message.label.replace(/[^a-z0-9.]/gi, '_').toLowerCase()}_${hash}`;

                        try {
                            const accessToken = await dropboxController.refreshAccessToken(dropboxWorkspace.refreshToken, message.isPersonal);

                            const memberId = await dropboxController.getMemberId(message.workspaceId, message.userId)
                            const dbx = new Dropbox({ accessToken, selectUser: message.isPersonal == 'true' ? null : memberId });

                            const response = await dbx.filesDownload({ path: message.path });
                            const file = response.result;


                            archive.append(file.fileBinary, { name: `Dropbox/${message.label}` });

                            archive.append(JSON.stringify({...message, hash: hash}, null, 2), { name: `Dropbox/${message.label}.json` });
                        } catch (err) {
                            console.warn(`Failed to download Dropbox file ${message.id}:`, err);
                            archive.append(`Error downloading file: ${err.message}`, {
                                name: `Dropbox/${message.label}_error.txt`
                            });
                        }
                        break;

                    default:
                        console.warn(`Skipping collection ${collection._id}: unknown type ${collection.type}`);
                }
            } catch (err) {
                console.error(`Error processing collection ${collection._id}:`, err);
                // Continue with next collection even if this one fails
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error(`Internal server error: ${error}`);
        res.status(500).json({ ok: false, message: 'Internal server error' });
    }
};