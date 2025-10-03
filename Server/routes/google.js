const express = require('express');
const router = express.Router();
const config = require("../config/app.config");
const { google } = require('googleapis');
const GoogleWorkspace = require("../models/googleworkspaces");
const GoogleUser = require("../models/googleusers");
const fs = require('fs');
const path = require('path');
const googleController = require('../controller/google.js');
const authJWT = require('../middleware/authJwt');
const userController = require('../controller/user.js')
const admin = require('../controller/admin')
const utils = require('../utils')
const { oauth2ClientTest } = require('../services/googleClient.js')

const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_APP_INFO.CLIENT_ID,
    config.GOOGLE_APP_INFO.CLIENT_SECRET,
    config.GOOGLE_APP_INFO.REDIRECT_URI
);

router.get('/google/add-organization', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {

    const userId = req.userId

    if (!userId) {
        admin.logActions(req, { actionType: 'Install ms365 workspace', actionDetails: 'Not authenticated', actionResult: 'Failed' })
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

    const authUrl = oauth2ClientTest.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/admin.directory.customer.readonly',
            'https://www.googleapis.com/auth/admin.directory.domain.readonly',
            'https://www.googleapis.com/auth/admin.directory.user.readonly',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/gmail.readonly'],
        prompt: 'consent'
    });
    const { state } = req.query;
    const googleUserId = state.split('_')[0];
    let isPersonal = false
    try {
        isPersonal = state.split('_')[1] === 'personal';
    } catch (error) {
        
    }
    if (googleUserId) {
        req.session.googleUserId = googleUserId;
        req.session.isPersonal = isPersonal
    } else {
        req.session.googleUserId = '';
    }
    res.redirect(authUrl);
});

router.get('/google/add-personal', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    const userId = req.userId

    if (!userId) {
        admin.logActions(req, { actionType: 'Install ms365 workspace', actionDetails: 'Not authenticated', actionResult: 'Failed' })
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

    const authUrl = oauth2ClientTest.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile', 
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.readonly'
        ],
        prompt: 'consent'
    });
    const { state } = req.query;
    const googleUserId = state.split('_')[0];
    let isPersonal = false
    try {
        isPersonal = state.split('_')[1] === 'personal';
    } catch (error) {
        
    }
    if (googleUserId) {
        req.session.googleUserId = googleUserId;
        req.session.isPersonal = isPersonal
    } else {
        req.session.googleUserId = '';
    }
    res.redirect(authUrl);
});

router.get('/google/add-organization-service', authJWT.checkTrial, async (req, res) => {
    try {
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.readonly' ],
            clientOptions: { subject: 'dsuperdeveloper777@digitalforensicservices.com' },
        });
        const gmail = google.gmail({version: 'v1', auth});
        console.log('service auth:', auth)
        const result = await gmail.users.messages.list({
            userId: 'me',
        });
        const messages = result.data.messages;
        if (!messages || messages.length === 0) {
            console.log('No messages found.');
            return;
        }
        console.log('messages:', messages);
          
    } catch (err) {
        console.log('using google service err:', err);
        return true;
    }
});

router.get('/google/auth-redirect-test', async (req, res) => {
    const { code } = req.query;
    console.log('==test redirect function==');
    console.log(code)
    try {
        const { tokens } = await oauth2ClientTest.getToken(code);
        req.session.tokens = tokens;
        oauth2ClientTest.setCredentials(tokens);
        console.log(tokens)
        if (!req.session.isPersonal) {
            const admin = google.admin({version: 'directory_v1', auth: oauth2ClientTest});
            try {
                const res1 = await admin.customers.get({
                    customerKey: 'my_customer'
                });
                // console.log('Domain Information:', res1.data);
                let workspace = await GoogleWorkspace.findOne({ orgId: res1.data.id });
                if (workspace) {
                    workspace.displayName = res1.data.customerDomain;
                    workspace.orgObject = res1.data;
                    workspace.accessToken = tokens;
                    workspace.clientId = req.session.googleUserId;
                    await workspace.save();
                } else {
                    // Create a new workspace
                    workspace = new GoogleWorkspace({
                        orgId: res1.data.id,
                        displayName: res1.data.customerDomain,
                        orgObject: res1.data,
                        accessToken: tokens,
                        clientId : req.session.googleUserId,
                    });
                    await workspace.save();
                }

                try {
                    const result = await admin.users.list({
                        customer: 'my_customer',
                        maxResults: 100,
                        orderBy: 'email'
                    });
                    // console.log('Workspace domain users:', JSON.stringify(result.data.users, null, 2));
                    result.data.users.map(async (userInfo) => {
                        // Check if the user already exists
                        let user = await GoogleUser.findOne({ workspaceId: workspace._id, userId: userInfo.id });
                        if (user) {
                            user.displayName = userInfo.name.fullName;
                            user.mail = userInfo.primaryEmail;
                            user.isAdmin = userInfo.isAdmin;
                            user.save();
                        } else {
                            user = new GoogleUser({
                                workspaceId: workspace._id, userId: userInfo.id, displayName: userInfo.name.fullName, mail: userInfo.primaryEmail, isAdmin: userInfo.isAdmin 
                            });
                            user.save();
                        }
                    });
                } catch (error) {
                    console.log('get users error:', error);
                }
            } catch (error) {
                console.error('Google domain info store api an error:', error);
                res.redirect('/google/error/1')
            }
            res.redirect('/google/apps?instruction=true');
        } else { // case of personal account
            const people = google.people({ version: 'v1', auth: oauth2ClientTest });
            try {
                // Retrieve user profile information including the Google ID
                const res = await people.people.get({
                    resourceName: 'people/me',
                    personFields: 'names,emailAddresses',
                });

                console.log(res.data);

                // Extract necessary information
                const userInfo = {
                    id: res.data.resourceName ? res.data.resourceName.split('/')[1] : '', // Extract the Google ID from the resourceName
                    name: res.data.names ? res.data.names[0].displayName : '',
                    email: res.data.emailAddresses ? res.data.emailAddresses[0].value : '',
                };
                // console.log('Domain Information:', res1.data);
                let workspace = await GoogleWorkspace.findOne({ orgId: userInfo.id });
                if (workspace) {
                    workspace.displayName = userInfo.name;
                    workspace.orgObject = userInfo;
                    workspace.accessToken = tokens;
                    workspace.clientId = req.session.googleUserId;
                    workspace.isPersonal = true
                    await workspace.save();
                } else {
                    // Create a new workspace
                    workspace = new GoogleWorkspace({
                        orgId: userInfo.id,
                        displayName: userInfo.name,
                        orgObject: userInfo,
                        accessToken: tokens,
                        clientId : req.session.googleUserId,
                        isPersonal: true
                    });
                    await workspace.save();
                }

                try {
                    // Check if the user already exists
                    let user = await GoogleUser.findOne({ workspaceId: workspace._id, userId: userInfo.id });
                    if (user) {
                        user.displayName = userInfo.name;
                        user.mail = userInfo.email;
                        user.isAdmin = true;
                        user.save();
                    } else {
                        user = new GoogleUser({
                            workspaceId: workspace._id, userId: userInfo.id, displayName: userInfo.name, mail: userInfo.email, isAdmin: true
                        });
                        user.save();
                    }
                } catch (error) {
                    console.log('get users error:', error);
                }
            } catch (error) {
                console.error('Google personal info store api an error:', error);
                res.redirect('/google/error/1')
            }
            res.redirect('/google/apps?instruction=false');
        }
        
    } catch (error) {
        console.error('Error retrieving access token', error);
        res.redirect('/google/apps');
    }
});

router.get('/google/workspace/users', authJWT.checkTrial, async (req, res) => {
    try {
        oauth2ClientTest.setCredentials(req.session.tokens);
        const admin = google.admin({version: 'directory_v1', auth: oauth2ClientTest});
        const result = await admin.users.list({
            customer: 'my_customer',
            maxResults: 100,
            orderBy: 'email'
        });
        console.log('Workspace domain users:', JSON.stringify(result.data.users, null, 2))
        res.json({ ok: true, data: result.data.users || [] });
    } catch (error) {
        console.log('get users error:', error);
        res.json({ ok: false, data: [] });
    }
});
//

router.get('/google/getTokens', (req, res) => {
    if (req.session.tokens) {
        res.json({ tokens: req.session.tokens });
    } else {
        res.status(401).send('No tokens found, user needs to authenticate.');
    }
});

router.get('/google/workspaces', authJWT.verifyToken, authJWT.checkTrial, googleController.workspaces);
router.get('/google/workspace/:workspaceId/users', authJWT.verifyToken, authJWT.checkTrial, googleController.users);
router.get('/google/workspace/:userId/gmail', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const userId = req.params.userId;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.readonly' ],
            clientOptions: { subject: userId },
        });
        const gmail = google.gmail({version: 'v1', auth});
        let inboxMessageList = [];
        let sentMessageList = [];
        let trashMessageList = [];

        try {
            const gmailInboxResponse = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                labelIds :['INBOX'],
            });
            const inboxMessagesDetails = await Promise.all(
                gmailInboxResponse.data.messages.map( message => 
                    gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date']
                    })
                )
            );
            inboxMessageList = inboxMessagesDetails.map(res => res.data);
        } catch (e) {
            inboxMessageList = [];
        }
        try {
            const gmailSentResponse = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                labelIds :['SENT'],
            });
            const sentMessagesDetails = await Promise.all(
                gmailSentResponse.data.messages.map( message => 
                    gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date']
                    })
                )
            );
            sentMessageList = sentMessagesDetails.map(res => res.data);
        } catch (e) {
            sentMessageList = [];
        }
        try {
            const gmailTrashResponse = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 10,
                q: 'in:trash',
            });
            const trashMessagesDetails = await Promise.all(
                gmailTrashResponse.data.messages.map( message => 
                    gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date']
                    })
                )
            );
            trashMessageList = trashMessagesDetails.map(res => res.data);
        } catch (e) {
            trashMessageList = [];
        }
        res.json({ inboxMessageList, sentMessageList, trashMessageList });
    } catch (err) {
        console.log('using google service err:', err);
        res.json({ inboxMessageList:[], sentMessageList:[], trashMessageList:[] });
    }
});

router.get('/google/workspace/:workspaceId/users/:userId/emails', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { 
            pageToken = '', 
            labelId, 
            isPersonal,
            q = '',           // Keywords search
            from = '',        // From email filter
            to = '',          // To email filter
            after = '',       // Start date (UNIX timestamp)
            before = ''       // End date (UNIX timestamp)
        } = req.query;

        let auth;
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
        }

        const gmail = google.gmail({ version: 'v1', auth: (isPersonal !== 'true' ? auth : oauth2ClientTest) });

        try {
            let searchQuery = [];
            
            if (q) {
                searchQuery.push(`(${q})`);
            }
            
            if (from) {
                searchQuery.push(`from:${from}`);
            }
            
            if (to) {
                searchQuery.push(`to:${to}`);
            }
            
            if (after) {
                const afterDate = new Date(parseInt(after) * 1000).toISOString().split('T')[0];
                searchQuery.push(`after:${afterDate}`);
            }
            if (before) {
                const beforeDate = new Date(parseInt(before) * 1000).toISOString().split('T')[0];
                searchQuery.push(`before:${beforeDate}`);
            }
            
            const fullQuery = searchQuery.join(' ');

            const requestData = {
                userId: 'me',
                maxResults: 10,
                pageToken,
                q: fullQuery
            };

            if (labelId === 'trash') {
                requestData.q = requestData.q ? `${requestData.q} in:trash` : 'in:trash';
            } else if (labelId && labelId !== 'ALL') {
                requestData.labelIds = [labelId];
            }

            const gmailResponse = await gmail.users.messages.list(requestData);
            // Get additional details for each message
            if (gmailResponse.data?.messages) {
                const messagesDetails = await Promise.all(
                    gmailResponse.data?.messages?.map(message => 
                        gmail.users.messages.get({
                            userId: 'me',
                            id: message.id,
                            format: 'metadata',
                            metadataHeaders: ['From', 'To', 'Subject', 'Date']
                        })
                    )
                );
    
                const messageList = messagesDetails.map(res => res.data);
                
                res.json({
                    status: true,
                    messages: messageList,
                    nextPageToken: gmailResponse.data.nextPageToken
                });
            } else {
                res.json({
                    status: true,
                    messages: [],
                    nextPageToken: null
                });
            }
        } catch (e) {
            console.error('Error fetching emails:', e);
            res.status(500).json({
                status: false,
                message: 'Failed to fetch emails',
                error: e.message,
                messages: [],
                nextPageToken: ''
            });
        }
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(500).json({
            status: false,
            message: 'Authentication failed',
            error: err.message,
            messages: [],
            nextPageToken: ''
        });
    }
});

router.get('/google/gmail/isArchive', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { userId, keyword, startDate, endDate } = req.query;
        let after = '';
        let before = '';
        if(startDate !=='') after = `after:${startDate}`;
        if(endDate !=='') before = `before:${endDate}`;
        const query = `"${keyword}" ${after} ${before}`;
        console.log('filter query:', query);

        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/gmail.readonly' ],
            clientOptions: { subject: userId },
        });
        const gmail = google.gmail({version: 'v1', auth});
        try {
            const gmailResponse = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 5,
                q: query,
            });
            res.json(gmailResponse.data.messages);
        } catch (e) {
            console.log('filter err:', e);
            res.json([]);
        }
    } catch (err) {
        console.log('using google service err:', err);
        res.json([]);
    }
});

// Helper function to build tree structure for labels
function buildLabelTree(labels) {
    const labelMap = {};

    // Step 1: Create a map for all labels by id
    labels.forEach(label => {
        labelMap[label.id] = { ...label, children: [] };
    });

    // Step 2: Organize labels into a hierarchical structure based on "/" separator in label names
    const tree = [];
    labels.forEach(label => {
        const parts = label.name.split('/');
        let currentNode = null;

        // Traverse each part of the label name hierarchy
        for (let i = 0; i < parts.length; i++) {
            const labelPart = parts.slice(0, i + 1).join('/');
            const existingNode = Object.values(labelMap).find(l => l.name === labelPart);

            if (existingNode) {
                if (i === parts.length - 1) {
                    // If it's the last part, assign it to the current node
                    currentNode = existingNode;
                } else {
                    // Otherwise, continue traversing down the structure
                    if (!existingNode.children) {
                        existingNode.children = [];
                    }
                    currentNode = existingNode;
                }
            }
        }

        if (!currentNode.parentId) {
            tree.push(currentNode); // Add top-level labels to the tree root
        }
    });

    return tree;
}

router.get('/google/workspace/:workspaceId/users/:userId/gmail/labels', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;
        const { isPersonal } = req.query;

        let auth;
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
        }

        const gmail = google.gmail({ version: 'v1', auth: isPersonal !== 'true' ? auth : oauth2ClientTest });
        
        try {
            // Retrieve all labels
            const labelsResponse = await gmail.users.labels.list({
                userId: 'me',
            });
            
            const labels = labelsResponse.data.labels || [];
            const labelTree = buildLabelTree(labels);
            console.log('labelTree json:', JSON.stringify(labelTree, null, 2))

            res.json({ ok: true, labels: labels});
        } catch (e) {
            console.error('Error fetching Gmail labels:', e);
            res.status(500).json({ error: 'Error fetching Gmail labels' });
        }
    } catch (err) {
        console.error('Error setting up Google service:', err);
        res.status(500).json({ error: 'Error setting up Google service' });
    }
});



router.get('/google/workspace/:workspaceId/gmail/counts', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId, keyword, startDate, endDate, isPersonal } = req.query;

        // Set timeout for the response to prevent hanging
        req.setTimeout(30000); // 30 seconds timeout

        let after = startDate ? `after:${startDate}` : '';
        let before = endDate ? `before:${endDate}` : '';
        const query = keyword ? `"${keyword}" ${after} ${before}`.trim() : '';
        console.log('filter query:', query);

        // Initialize auth
        let auth;
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
            auth = oauth2ClientTest;
        }

        const gmail = google.gmail({ version: 'v1', auth });

        try {
            let totalCnt = 0;
            
            if (query) {
                // Use estimate count instead of fetching all messages
                const response = await gmail.users.messages.list({
                    userId: 'me',
                    q: query,
                    maxResults: 1, // We only need the result size estimate
                    includeSpamTrash: false
                });

                totalCnt = response.data.resultSizeEstimate || 0;
            } else {
                // For total count without filters, use the profile API
                const resp = await gmail.users.getProfile({ userId: 'me' });
                totalCnt = resp.data?.messagesTotal || 0;
            }

            res.json({ count: totalCnt });
        } catch (e) {
            console.error('Error filtering Gmail messages:', e);
            res.status(500).json({ error: 'Failed to get message count', details: e.message });
        }
    } catch (err) {
        console.error('Error using Google service:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

router.get('/google/drive/isArchive', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { userId } = req.query;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            clientOptions: { subject: userId },
        });
        const drive = google.drive({
            version: 'v3',
            auth
        });
        try {
            const response = await drive.files.list({
                pageSize: 5,
                fields: 'nextPageToken, files(id, name, mimeType, parents)',
                q: "'me' in owners"
            });
    
            const files = response.data.files;
            if (files.length) {
                res.json(files);
            } else {
                res.json([]);
            }
    
        } catch (error) {
            console.log('get google drive err:', error);
            res.json([]);
        }
    } catch (err) {
        console.log('using google service err:', err);
        res.json([]);
    }
});

router.get('/google/workspace/:workspaceId/drive/counts', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { userId, keyword, startDate, endDate, isPersonal } = req.query;

        // Authenticate using Google Auth client
        let auth;
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
            auth = oauth2ClientTest;
        }

        const drive = google.drive({ version: 'v3', auth });

        let totalFilesCount = 0;
        let totalSizeBytes = 0;
        let nextPageToken = null;

        // Construct the query based on the parameters
        let query = "'me' in owners and trashed = false"; // Query to get non-trashed files owned by the user

        // Add keyword filter for filename if provided
        if (keyword) {
            query += ` and name contains '${keyword}'`;
        }

        // Add date filters for createdTime and modifiedTime if provided
        if (startDate) {
            query += ` and (createdTime >= '${startDate}' or modifiedTime >= '${startDate}')`;
        }
        if (endDate) {
            query += ` and (createdTime <= '${endDate}' or modifiedTime <= '${endDate}')`;
        }

        do {
            try {
                const response = await drive.files.list({
                    pageSize: 1000, // Maximum allowed page size
                    fields: 'nextPageToken, files(id, size)', // Get both file IDs and sizes
                    q: query,
                    pageToken: nextPageToken,
                });

                // Process the files in this batch
                if (response.data.files && response.data.files.length > 0) {
                    totalFilesCount += response.data.files.length;
                    
                    // Sum up file sizes
                    response.data.files.forEach(file => {
                        if (file.size) {
                            totalSizeBytes += parseInt(file.size);
                        }
                    });
                }

                // Update the next page token
                nextPageToken = response.data.nextPageToken;

            } catch (error) {
                console.error('Error getting Google Drive files:', error);
                return res.status(500).json({ 
                    error: 'Failed to retrieve files from Google Drive',
                    details: error.message 
                });
            }
        } while (nextPageToken);

        // Send the response with count and total size
        res.json({ 
            count: totalFilesCount,
            totalSize: totalSizeBytes
        });

    } catch (err) {
        console.error('Error using Google service:', err);
        res.status(500).json({ 
            error: 'Internal server error',
            details: err.message 
        });
    }
});

router.get('/google/workspace/:userId/logs', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const userId = req.params.userId;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: [
                'https://www.googleapis.com/auth/admin.reports.audit.readonly',
                'https://www.googleapis.com/auth/admin.reports.usage.readonly'
            ],
            clientOptions: { subject: userId },
        });
        const reports = google.admin({version: 'reports_v1', auth});
        const applicationNames = ['login', 'drive', 'admin'];
        const allLogs = {};

        for (const appName of applicationNames) {
            try {
                const logsResponse = await reports.activities.list({
                    userKey: 'all',
                    applicationName: appName,
                    maxResults: 100
                });
                allLogs[appName] = logsResponse.data.items;
            } catch (error) {
                allLogs[appName] = [];
                console.error(`Error fetching activity logs for ${appName}:`, error);
            }
        }
        res.json({ login:allLogs.login, drive:allLogs.drive, admin:allLogs.admin });
    } catch (err) {
        console.log('using google service err:', err);
        res.json({ login:[], drive:[], admin:[] });
    }
});

router.get('/google/workspace/:userId/drive', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const userId = req.params.userId;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            clientOptions: { subject: userId },
        });
        const drive = google.drive({
            version: 'v3',
            auth
        });
        try {
            const response = await drive.files.list({
                pageSize: 100,
                fields: 'nextPageToken, files(id, name, mimeType, parents)',
                q: "'me' in owners"
            });
    
            const files = response.data.files;
            if (files.length) {
                res.json(files);
            } else {
                res.json([]);
            }
    
        } catch (error) {
            console.log('get google drive err:', error);
            res.json([]);
        }
        
    } catch (err) {
        console.log('using google service err:', err);
        res.json([]);
    }
});

router.get('/google/workspace/:workspaceId/users/:userId/v2/drive', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const {workspaceId, userId} = req.params;
        const {isPersonal} = req.query

        let auth
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId)
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken)
        }
        const drive = google.drive({
            version: 'v3',
            auth: (isPersonal !== 'true' ? auth : oauth2ClientTest)
        });
        
        let allFiles = [];
        let nextPageToken = null;

        do {
            try {
                const response = await drive.files.list({
                    pageSize: 100,
                    fields: 'nextPageToken, files(id, name, mimeType, parents, size, thumbnailLink, createdTime, modifiedTime, owners, permissions, md5Checksum)',
                    q: "'me' in owners",
                    pageToken: nextPageToken || ''
                });
    
                const files = response.data.files;
                allFiles = allFiles.concat(files);
                nextPageToken = response.data.nextPageToken;
    
            } catch (error) {
                console.log('Error retrieving files:', error);
                res.status(500).json({ message: 'Error retrieving files', error });
                return;
            }
        } while (nextPageToken);

        if (allFiles.length) {
            res.json(allFiles);
        } else {
            res.json([]);
        }
        
    } catch (err) {
        console.log('Google service error:', err);
        res.status(500).json({ message: 'Google service error', error: err });
    }
});

router.get('/google/workspace/:workspaceId/users/:userId/v2/sharedDrive', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const {workspaceId, userId} = req.params;
        const {isPersonal} = req.query

        let auth
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId)
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken)
        }
        const drive = google.drive({
            version: 'v3',
            auth: (isPersonal !== 'true' ? auth : oauth2ClientTest)
        });
        
        let allFiles = [];
        let nextPageToken = null;

        do {
            try {
                const response = await drive.files.list({
                    pageSize: 100,
                    fields: 'nextPageToken, files(id, name, mimeType, parents, size, thumbnailLink, createdTime, modifiedTime, owners, permissions, md5Checksum)',
                    q: "sharedWithMe",
                    pageToken: nextPageToken || ''
                });
                // console.log('Files shared with me:', JSON.stringify(response.data.files, null, 2));
    
                const files = response.data.files;
                allFiles = allFiles.concat(files);
                nextPageToken = response.data.nextPageToken;
    
            } catch (error) {
                console.log('Error retrieving files:', error);
                res.status(500).json({ message: 'Error retrieving files', error });
                return;
            }
        } while (nextPageToken);

        if (allFiles.length) {
            res.json(allFiles);
        } else {
            res.json([]);
        }
        
    } catch (err) {
        console.log('Google service error:', err);
        res.status(500).json({ message: 'Google service error', error: err });
    }
});

router.get('/google/workspace/:userId/events', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const userId = req.params.userId;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/calendar'],
            clientOptions: { subject: userId },
        });
        const calendar = google.calendar({
            version: 'v3',
            auth
        });
        try {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: oneMonthAgo.toISOString(),
                maxResults: 100,
                singleEvents: true,
                orderBy: 'startTime'
            });
    
            const events = response.data.items;
            if (events.length) {
                res.json(events);
            } else {
                res.json([]);
            }
    
        } catch (error) {
            console.log('get google calendar events err:', error);
            res.json([]);
        }
        
    } catch (err) {
        console.log('using google service err:', err);
        res.json([]);
    }
});

router.get('/google/workspace/:userId/chatspaces', authJWT.verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const auth = await google.auth.getClient({
            keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
            scopes: ['https://www.googleapis.com/auth/chat.spaces.readonly', 'https://www.googleapis.com/auth/chat.messages.readonly'],
            clientOptions: { subject: userId },
        });
        const chat = google.chat({
            version: 'v1',
            auth
        });
        try {
            const response = await chat.spaces.list({});

            console.log('google chat spaces:', response.data);
            const spaces = response.data.spaces;
            if (spaces.length) {
                res.json(spaces);
            } else {
                res.json([]);
            }
    
        } catch (error) {
            console.log('get google chat spaces err:', error);
            res.json([]);
        }
        
    } catch (err) {
        console.log('using google service err:', err);
        res.json([]);
    }
});

router.get('/google/workspace/:workspaceId/users/:userId/:mailId', authJWT.verifyToken, authJWT.checkTrial, googleController.downloadSingleGmail);

router.get('/google/workspace/:workspaceId/users/:userId/attachments/:mailId/:attachmentId', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const { workspaceId, userId, mailId, attachmentId } = req.params;
        const { isPersonal } = req.query;

        let auth;
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleWorkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleWorkspace.accessToken);
        }

        const gmail = google.gmail({ version: 'v1', auth: isPersonal !== 'true' ? auth : oauth2ClientTest });

        // Fetch the attachment
        const attachmentResponse = await gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: mailId,
            id: attachmentId,
        });

        const attachmentData = attachmentResponse.data.data; // Base64 encoded attachment data
        const attachmentBuffer = Buffer.from(attachmentData, 'base64');

        // Set headers to prompt download
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="attachment-${attachmentId}"`,
        });

        // Send the file
        res.send(attachmentBuffer);
    } catch (err) {
        console.error('Error downloading attachment:', err);
        res.status(500).json({ error: 'Failed to download attachment.' });
    }
});

router.get('/google/fileDownload/:workspaceId/:userId/:fileId', authJWT.verifyToken, authJWT.checkTrial, async (req, res) => {
    try {
        const {workspaceId, userId, fileId} = req.params;
        const {isPersonal} = req.query;
        let auth;
        
        if (isPersonal !== 'true') {
            auth = await google.auth.getClient({
                keyFile: path.join(__dirname, '../config/completediscoverytestapp.json'),
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
                clientOptions: { subject: userId },
            });
        } else {
            const googleworkspace = await GoogleWorkspace.findById(workspaceId);
            oauth2ClientTest.setCredentials(googleworkspace.accessToken);
        }
        
        const drive = google.drive({
            version: 'v3',
            auth: (isPersonal !== 'true' ? auth : oauth2ClientTest)
        });

        try {
            const fileMetadata = await drive.files.get({
                fileId: fileId,
                fields: 'mimeType,name'
            });

            const mimeType = fileMetadata.data.mimeType;
            const fileName = fileMetadata.data.name;

            if (utils.googleMimeTypes.includes(mimeType)) {
                let exportMime;
                switch(mimeType) {
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

                const response = await drive.files.export({
                    fileId: fileId,
                    mimeType: exportMime
                }, { responseType: 'stream' });

                let extension = '.pdf';
                if (exportMime.includes('wordprocessingml')) extension = '.docx';
                if (exportMime.includes('spreadsheetml')) extension = '.xlsx';
                if (exportMime.includes('presentationml')) extension = '.pptx';

                res.setHeader('Content-Disposition', `attachment; filename="${fileName}${extension}"`);
                res.setHeader('Access-Control-Expose-Headers', 'content-type, content-length, etc');
                res.setHeader('Access-Control-Allow-Origin', '*');

                response.data
                    .on('end', () => console.log('File export completed.'))
                    .on('error', err => {
                        console.error('Error exporting file.', err);
                        res.status(500).send('Error exporting file');
                    })
                    .pipe(res);
            } else {
                const response = await drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }, { responseType: 'stream' });

                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Access-Control-Expose-Headers', 'content-type, content-length, etc');
                res.setHeader('Access-Control-Allow-Origin', '*');
                response.data
                    .on('end', () => console.log('File download completed.'))
                    .on('error', err => {
                        console.error('Error downloading file.', err);
                        res.status(500).send('Error downloading file');
                    })
                    .pipe(res);
            }
        } catch (error) {
            console.error('Failed to download file:', error);
            res.status(500).send('Failed to download file: ' + error.message);
        }
        
    } catch (err) {
        console.log('using google service err:', err);
        res.status(500).send('google service err');
    }
});

router.delete('/google/remove-workspace/:workspaceId', authJWT.verifyToken, authJWT.checkTrial, googleController.removeWorkspace)
router.post('/google/workspace/:workspaceId/users/:userId/bulk-download', authJWT.verifyToken, authJWT.checkTrial, googleController.bulkDownload)

module.exports = router;