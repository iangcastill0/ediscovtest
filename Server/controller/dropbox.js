const axios = require('axios');
const { Dropbox } = require('dropbox');
const moment = require('moment');
const querystring = require('querystring');
const Utils = require('./utils');
const DropboxWorkspace = require('../models/dropboxworkspace')
const DropboxMembers = require('../models/dropboxmembers')
const config = require('../config/app.config')
const admin = require("./admin");
const userController = require('../controller/user.js')

exports.refreshAccessToken = async (refreshToken, isPersonal) => {
    if( isPersonal == true ) isPersonal = 'true';
    try {
        const refreshData = querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: isPersonal == 'true' ? config.DROPBOX.PERSONAL.APP_KEY : config.DROPBOX.TEAM.APP_KEY,
            client_secret: isPersonal == 'true' ? config.DROPBOX.PERSONAL.APP_SECRET : config.DROPBOX.TEAM.APP_SECRET,
        });

        const refreshResponse = await axios.post('https://api.dropbox.com/oauth2/token', refreshData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // console.log("Refresed access token: ", refreshResponse.data)

        const { access_token, expires_in } = refreshResponse.data;

        // Update the database with the new access token
        // await Utils.updateAccessTokenInDatabase(refreshToken, access_token);

        return access_token;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new Error('Failed to refresh access token.');
    }
};

const getAccountInfo = async (accessToken) => {
    try {
        const response = await axios.post(
            'https://api.dropboxapi.com/2/users/get_current_account',
            null, // No body is required
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Account info response
        return response.data;
    } catch (error) {
        console.error('Error fetching account information:', error.response?.data || error.message);
        throw new Error('Failed to fetch account information');
    }
};

exports.addPersonal = async (req, res) => {
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
    const url = `https://www.dropbox.com/oauth2/authorize?client_id=${config.DROPBOX.PERSONAL.APP_KEY}&response_type=code&state=${userId}&&token_access_type=offline&redirect_uri=${config.DROPBOX.PERSONAL.REDIRECT_URI}`
    res.redirect(url)
}

exports.addTeam = async (req, res) => {
    const userId = req.userId

    if (!userId) {
        admin.logActions(req, { actionType: 'Install dropbox workspace', actionDetails: 'Not authenticated', actionResult: 'Failed' })
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
    const url = `https://www.dropbox.com/oauth2/authorize?client_id=${config.DROPBOX.TEAM.APP_KEY}&response_type=code&state=${userId}&&token_access_type=offline&redirect_uri=${config.DROPBOX.TEAM.REDIRECT_URI}`
    res.redirect(url)
}

exports.redirectPersonal = async (req, res) => {
    try {
        const {code, state} = req.query;
        if (!code || !state) {
            return res.status(400).json({ error: 'Some parameters are missing.' });
        }

        const tokenRequestData = querystring.stringify({
            code: code,
            grant_type: 'authorization_code',
            client_id: config.DROPBOX.PERSONAL.APP_KEY,
            client_secret: config.DROPBOX.PERSONAL.APP_SECRET,
            redirect_uri: config.DROPBOX.PERSONAL.REDIRECT_URI,
        });

        const tokenResponse = await axios.post('https://api.dropbox.com/oauth2/token', tokenRequestData, {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log("Dropbox account data: ", tokenResponse)
        const { access_token, refresh_token, account_id } = tokenResponse.data;
        const dropBox = await DropboxWorkspace.findOne({teamId: account_id})
        
        if (dropBox && dropBox.owner !== state) {
            return res.redirect('/dropbox/install-failed?code=1') // Case of a same dropbox workspace is installed by another user
        }

        const accInfo = await getAccountInfo(access_token);
        // Store accInfo
        if (!dropBox) {
            const dropboxWorkspace = await DropboxWorkspace.create({
                teamId: accInfo.account_id,
                displayName: accInfo.name?.display_name,
                isPersonal: true,
                accessToken: access_token,
                refreshToken: refresh_token,
                owner: state
            })

            // add members
            await DropboxMembers.create({
                workspaceId: dropboxWorkspace._id,
                accountId: accInfo.account_id,
                email: accInfo.email,
                emailVerified: !accInfo.disabled,
                name: accInfo.name?.display_name,
            })
        } else {
            await DropboxWorkspace.updateOne({teamId: accInfo.account_id},{
                displayName: accInfo.name?.display_name,
                accessToken: access_token,
                refreshToken: refresh_token,
                owner: state
            })

            await DropboxMembers.updateOne({workspaceId: dropBox._id, accountId: accInfo.account_id},{
                email: accInfo.email,
                emailVerified: !accInfo.disabled,
                name: accInfo.name?.display_name,
            })
        }
        console.log("ACC: ", accInfo)
        res.redirect('/dropbox')
    } catch (error) {
        console.error('Error :', error);
        res.status(500).json({ error: 'Failed to exchange authorization code for access token.' });
    }
};

exports.redirectTeam = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || !state) {
            return res.status(400).json({ error: 'Missing parameters.' });
        }

        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post('https://api.dropbox.com/oauth2/token', null, {
            params: {
                code,
                grant_type: 'authorization_code',
                client_id: config.DROPBOX.TEAM.APP_KEY,
                client_secret: config.DROPBOX.TEAM.APP_SECRET,
                redirect_uri: config.DROPBOX.TEAM.REDIRECT_URI,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token, team_id } = tokenResponse.data;
        console.log(tokenResponse.data)
        // Initialize Dropbox client
        const dbx = new Dropbox({ accessToken: access_token });

        // Fetch team account information
        const teamInfoResponse = await dbx.teamGetInfo();
        const teamInfo = teamInfoResponse.result;
        console.log('Team Info: ', teamInfo);

        // Fetch all team members
        const membersListResponse = await dbx.teamMembersList();
        const members = membersListResponse.result.members;
        console.log("members: ", members)
        // Find the current user's admin status
        // const currentUser = members.find(member => member.profile.account_id === teamInfo.team_id);

        // if (!currentUser || !currentUser.role.is_team_admin) {
        //     return res.status(403).json({ error: 'The added account must have admin privileges.' });
        // }

        // Proceed with workspace creation/update
        const existingWorkspace = await DropboxWorkspace.findOne({ teamId: team_id });

        if (existingWorkspace && existingWorkspace.owner !== state) {
            return res.redirect('/dropbox/install-failed?code=1'); // Team already linked by another user
        }

        if (!existingWorkspace) {
            // Add new team workspace
            const newWorkspace = await DropboxWorkspace.create({
                teamId: team_id,
                displayName: teamInfo.name,
                accessToken: access_token,
                refreshToken: refresh_token,
                isPersonal: false,
                owner: state,
            });

            // Fetch and add team members
            const teamMembers = await fetchTeamMembers(dbx);
            for (const member of teamMembers) {
                await DropboxMembers.create({
                    workspaceId: newWorkspace._id,
                    memberId: member.profile.team_member_id,
                    accountId: member.profile.account_id,
                    email: member.profile.email,
                    emailVerified: member.profile.email_verified,
                    joinedOn: member.profile.joined_on,
                    name: member.profile.name.display_name,
                });
            }
        } else {
            // Update existing workspace
            await DropboxWorkspace.updateOne(
                { teamId: team_id },
                {
                    displayName: teamInfo.name,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    owner: state,
                }
            );

            // Update team members
            const teamMembers = await fetchTeamMembers(dbx);
            for (const member of teamMembers) {
                await DropboxMembers.updateOne(
                    { workspaceId: existingWorkspace._id, memberId: member.profile.team_member_id, accountId: member.profile.account_id },
                    {
                        email: member.profile.email,
                        emailVerified: member.profile.email_verified,
                        name: member.profile.name.display_name,
                    },
                    { upsert: true }
                );
            }
        }

        res.redirect('/dropbox');
    } catch (error) {
        console.error('Error:', error.message || error.response?.data);
        res.status(500).json({ error: 'Failed to add Dropbox team account. Please check if you are admin.' });
    }
};

// Fetch Dropbox team members using SDK
async function fetchTeamMembers(dbx) {
    let members = [];
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
        const response = cursor
            ? await dbx.teamMembersListContinue({ cursor })
            : await dbx.teamMembersList();

        members = members.concat(response.result.members);
        hasMore = response.result.has_more;
        cursor = response.result.cursor;
    }

    return members;
}


exports.workspaces = async (req, res) => {
    const { includeInvites } = req.query
    let result = [];
    const workspaces = await DropboxWorkspace.find({owner: req.userId});
    if (workspaces) {
        for (let i = 0; i < workspaces.length; i++) {
            const users = await DropboxMembers.find({ workspaceId: workspaces[i]._id });
            result.push({
                workspace: workspaces[i],
                users,
            });
        }
    }

    const invitedWorkspaces = includeInvites == 'false' ? [] : await Utils.invitedWorkspaces(req.userId, 'dropbox')
    if (invitedWorkspaces && invitedWorkspaces.length > 0) {
        result = result.concat(invitedWorkspaces)
    }

    admin.logActions(req, { actionType: 'Get Dropbox Workspaces', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: result });
}

exports.members = async (req, res) => {
    const users = await DropboxMembers.find({ workspaceId: req.params.workspaceId });
    admin.logActions(req, { actionType: 'Get Dropbox Members', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: users || [] });
}

exports.getMemberId = async (workspaceId, email) => {
    const member = await DropboxMembers.findOne({workspaceId, email})
    if (!member)
        return null

    return member.memberId
}

const getAccountId = async (workspaceId, email) => {
    const member = await DropboxMembers.findOne({workspaceId, email})
    if (!member)
        return null

    return member.accountId
}

exports.files = async (req, res) => {
    const { workspaceId, userId } = req.params; // userId is team member email
    const { isPersonal } = req.query;

    const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
    if (!dropboxWorkspace) {
        return res.json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
    }

    try {
        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);
        const accountId = await exports.getMemberId(workspaceId, userId)

        const dbx = new Dropbox({
            accessToken,
            selectUser: isPersonal == 'true' ? null : accountId,
        });

        const fetchVersionHistory = async (path) => {
            try {
                const revisionsResponse = await dbx.filesListRevisions({ path, limit: 10 });
                return revisionsResponse.result.entries.map((rev) => ({
                    id: rev.rev,
                    modifiedTime: rev.server_modified,
                    size: rev.size,
                }));
            } catch (error) {
                console.error(`Error fetching version history for ${path}:`, error);
                return [];
            }
        };

        const fetchAllFiles = async (path = '') => {
            try {
                const response = await dbx.filesListFolder({ path });
                const items = await Promise.all(
                    response.result.entries.map(async (item) => {
                        const size = item.size || 0;

                        const versionHistory =
                            item['.tag'] === 'file' ? await fetchVersionHistory(item.path_lower) : [];

                        const formattedItem = {
                            key: item.id,
                            label: item.name,
                            data: {
                                id: item.id,
                                label: item.name,
                                size: size.toString(),
                                formattedSize: `${(size / 1024 / 1024).toFixed(2)} MB`,
                                type: item['.tag'],
                                path: item.path_lower,
                                createdTime: item.client_modified || null,
                                modifiedTime: item.server_modified || null,
                                md5Checksum: item.content_hash || 'N/A',
                                thumbnailLink: item.thumbnail
                                    ? `https://content.dropboxapi.com/2/files/get_thumbnail/${item.id}`
                                    : null,
                                versionHistory,
                            },
                            icon: item['.tag'] === 'folder' ? 'pi pi-fw pi-folder' : 'pi pi-fw pi-file',
                            children: [],
                        };

                        if (item['.tag'] === 'folder') {
                            formattedItem.children = await fetchAllFiles(item.path_lower);
                        }

                        return formattedItem;
                    })
                );

                let cursor = response.result.cursor;
                while (response.result.has_more) {
                    const continueResponse = await dbx.filesListFolderContinue({ cursor });
                    cursor = continueResponse.result.cursor;
                    items.push(...await fetchAllFiles(cursor));
                }

                return items;
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchAllFiles(path);
                } else {
                    throw error;
                }
            }
        };

        const filesAndFolders = await fetchAllFiles();

        admin.logActions(req, {
            actionType: 'Get Dropbox Files and Folders',
            actionDetails: '',
            actionResult: 'Success',
        });

        res.json({ ok: true, data: filesAndFolders });
    } catch (error) {
        console.error('Error fetching Dropbox files:', error);
        admin.logActions(req, {
            actionType: 'Get Dropbox Files and Folders',
            actionDetails: error.message,
            actionResult: 'Failure',
        });
        res.status(500).json({ ok: false, msg: 'Failed to fetch Dropbox files and folders.', error: error.message });
    }
};

exports.downloadFile = async (req, res) => {
    const { workspaceId, userId, fileId } = req.params;
    const { isPersonal, filePath } = req.query;
    console.log("--------------------------------------------")
    console.log(isPersonal, filePath)
    // Find Dropbox workspace by ID
    const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
    if (!dropboxWorkspace) {
        return res.status(404).json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
    }

    try {
        // Refresh the Dropbox access token
        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);

        const memberId = await exports.getMemberId(workspaceId, userId)
        const dbx = new Dropbox({ accessToken, selectUser: isPersonal == 'true' ? null : memberId });

        // Download the file from Dropbox
        const response = await dbx.filesDownload({ path: filePath });
        const file = response.result;

        // Log success action
        admin.logActions(req, {
            actionType: 'Download Dropbox File',
            actionDetails: `File ID: ${fileId}`,
            actionResult: 'Success',
        });

        // Set headers for the file download
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Type', file.contentType || 'application/octet-stream');

        // Send the file content as the response
        return res.send(file.fileBinary);
    } catch (error) {
        console.error('Error downloading Dropbox file:', error);

        // Log failure action
        admin.logActions(req, {
            actionType: 'Download Dropbox File',
            actionDetails: error.message,
            actionResult: 'Failure',
        });

        return res.status(500).json({
            ok: false,
            msg: 'Failed to download the Dropbox file.',
            error: error.message,
        });
    }
};

exports.shared = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { isPersonal } = req.query;

    try {
        // Validate input
        if (!workspaceId) {
            return res.status(400).json({ ok: false, msg: 'Workspace ID is required.' });
        }

        const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
        if (!dropboxWorkspace) {
            return res.json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
        }

        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);
        const memberId = await exports.getMemberId(workspaceId, userId)
        const dbx = new Dropbox({ accessToken, selectUser: isPersonal == 'true' ? null : memberId });

        // Recursive function to fetch shared files and folders
        const fetchSharedLinks = async (cursor = null) => {
            let sharedItems = [];
            try {
                let response;

                // Check if it's the first fetch or a continuation
                if (cursor) {
                    response = await dbx.sharingListSharedLinks({ cursor });
                } else {
                    response = await dbx.sharingListSharedLinks();
                }

                const { links, has_more, cursor: nextCursor } = response.result;
                console.log("**************Shared Links*****************")
                console.log(links)
                // Format the shared links
                

                sharedItems.push(...links);

                // Fetch additional pages if available
                if (has_more) {
                    const additionalItems = await fetchSharedLinks(nextCursor);
                    sharedItems = sharedItems.concat(additionalItems);
                }
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchSharedLinks(cursor);
                }
                throw error;
            }
            return sharedItems;
        };

        const sharedFilesAndFolders = await fetchSharedLinks();

        admin.logActions(req, {
            actionType: 'Get Shared Dropbox Files and Folders',
            actionDetails: '',
            actionResult: 'Success',
        });

        res.json({ ok: true, data: sharedFilesAndFolders });
    } catch (error) {
        console.error('Error fetching shared Dropbox files and folders:', error);
        admin.logActions(req, {
            actionType: 'Get Shared Dropbox Files and Folders',
            actionDetails: error.message,
            actionResult: 'Failure',
        });
        res.status(500).json({ ok: false, msg: 'Failed to fetch shared Dropbox files and folders.', error: error.message });
    }
};


exports.deleted = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { isPersonal } = req.query;

    try {
        // Validate input
        if (!workspaceId) {
            return res.status(400).json({ ok: false, msg: 'Workspace ID is required.' });
        }

        const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
        if (!dropboxWorkspace) {
            return res.json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
        }

        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);
        const memberId = await exports.getMemberId(workspaceId, userId)
        const dbx = new Dropbox({ accessToken, selectUser: isPersonal == 'true' ? null : memberId });

        // Recursive function to fetch deleted files and folders
        const fetchDeletedItems = async (cursor = null) => {
            let deletedItems = [];
            try {
                let response;

                if (cursor) {
                    // Continue fetching deleted items using the cursor
                    response = await dbx.filesListFolderContinue({ cursor });
                } else {
                    // Initial fetch of deleted items
                    response = await dbx.filesListFolder({
                        path: '',
                        recursive: true,
                        include_deleted: true,
                    });
                }

                const { entries, has_more, cursor: nextCursor } = response.result;

                // Filter out only deleted files and folders
                const deletedEntries = entries.filter((entry) => entry['.tag'] === 'deleted');
                deletedItems.push(...deletedEntries);

                // Fetch additional pages if available
                if (has_more) {
                    const additionalItems = await fetchDeletedItems(nextCursor);
                    deletedItems = deletedItems.concat(additionalItems);
                }
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchDeletedItems(cursor);
                }
                throw error;
            }
            return deletedItems;
        };

        const deletedFilesAndFolders = await fetchDeletedItems();

        // Log successful action
        admin.logActions(req, {
            actionType: 'Get Deleted Dropbox Files and Folders',
            actionDetails: '',
            actionResult: 'Success',
        });

        res.json({ ok: true, data: deletedFilesAndFolders });
    } catch (error) {
        console.error('Error fetching deleted Dropbox files and folders:', error);

        // Log failure action
        admin.logActions(req, {
            actionType: 'Get Deleted Dropbox Files and Folders',
            actionDetails: error.message,
            actionResult: 'Failure',
        });

        res.status(500).json({
            ok: false,
            msg: 'Failed to fetch deleted Dropbox files and folders.',
            error: error.message,
        });
    }
};

exports.logs = async (req, res) => {
    const { workspaceId, userId } = req.params;
    const { isPersonal } = req.query;

    try {
        // Validate input
        if (!workspaceId) {
            return res.status(400).json({ ok: false, msg: 'Workspace ID is required.' });
        }

        const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
        if (!dropboxWorkspace) {
            return res.status(404).json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
        }

        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);
        const accountId = await getAccountId(workspaceId, userId);
        const dbx = new Dropbox({ accessToken });
        // const dbx = new Dropbox({ accessToken, selectUser: isPersonal === 'true' ? null : memberId });

        // Recursive function to fetch activity logs for a team member
        const fetchActivityLogs = async (cursor = null) => {
            let activityLogs = [];
            try {
                let response;

                if (cursor) {
                    // Continue fetching logs using the cursor
                    response = await dbx.teamLogGetEventsContinue({ cursor });
                } else {
                    // Initial fetch of activity logs
                    response = await dbx.teamLogGetEvents({
                        limit: 1000,
                        account_id: accountId,
                    });
                }

                const { events, has_more, cursor: nextCursor } = response.result;

                // Append logs
                activityLogs.push(...events);

                // Fetch additional pages if available
                if (has_more) {
                    const additionalLogs = await fetchActivityLogs(nextCursor);
                    activityLogs = activityLogs.concat(additionalLogs);
                }
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchActivityLogs(cursor);
                }
                throw error;
            }
            return activityLogs;
        };

        const teamMemberLogs = await fetchActivityLogs();

        // Log successful action
        admin.logActions(req, {
            actionType: 'Get Dropbox Team Member Logs',
            actionDetails: `Logs fetched for member ID: ${accountId}`,
            actionResult: 'Success',
        });

        res.json({ ok: true, data: teamMemberLogs });
    } catch (error) {
        console.error('Error fetching Dropbox team member logs:', error);

        // Log failure action
        admin.logActions(req, {
            actionType: 'Get Dropbox Team Member Logs',
            actionDetails: error.message,
            actionResult: 'Failure',
        });

        res.status(500).json({
            ok: false,
            msg: 'Failed to fetch Dropbox team member logs.',
            error: error.message,
        });
    }
};

exports.counts = async (req, res) => {
    const { workspaceId } = req.params;
    const { userId, keywords, isPersonal, startDate, endDate } = req.query;

    try {
        // Validate input
        if (!workspaceId) {
            return res.status(400).json({ ok: false, msg: 'Workspace ID is required.' });
        }

        const dropboxWorkspace = await DropboxWorkspace.findById(workspaceId);
        if (!dropboxWorkspace) {
            return res.status(404).json({ ok: false, msg: 'The Dropbox workspace does not exist.' });
        }

        const accessToken = await exports.refreshAccessToken(dropboxWorkspace.refreshToken, isPersonal);
        const memberId = await exports.getMemberId(workspaceId, userId);
        const accountId = await getAccountId(workspaceId, userId);
        const dbx = new Dropbox({ accessToken, selectUser: isPersonal == 'true' ? null : memberId });

        // Convert date strings to Date objects if they exist
        const startDateObj = startDate ? new Date(startDate) : null;
        const endDateObj = endDate ? new Date(endDate) : null;

        // Recursive function to fetch all files and filter them
        const fetchFiles = async (path = '', keywordFilter = null, cursor = null) => {
            let fileCount = 0;
            try {
                let response;

                if (cursor) {
                    // Continue fetching files using the cursor
                    response = await dbx.filesListFolderContinue({ cursor });
                } else {
                    // Initial fetch of files
                    response = await dbx.filesListFolder({
                        path: path || '',
                        recursive: true,
                    });
                }

                const { entries, has_more, cursor: nextCursor } = response.result;

                // Filter entries for files (not folders) with all conditions
                const filteredFiles = entries.filter((entry) => {
                    if (entry['.tag'] !== 'file') return false;
                    
                    // Keyword filter
                    if (keywordFilter && !entry.name.toLowerCase().includes(keywordFilter.toLowerCase())) {
                        return false;
                    }
                    
                    // Date range filter
                    const fileDate = new Date(entry.client_modified);
                    if (startDateObj && fileDate < startDateObj) return false;
                    if (endDateObj && fileDate > endDateObj) return false;
                    
                    return true;
                });

                // Count filtered files
                fileCount += filteredFiles.length;

                // Fetch additional pages if available
                if (has_more) {
                    const additionalFileCount = await fetchFiles(null, keywordFilter, nextCursor);
                    fileCount += additionalFileCount;
                }
            } catch (error) {
                if (error.status === 429) {
                    const retryAfter = error.headers['retry-after'] || 2;
                    console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                    return fetchFiles(path, keywordFilter, cursor);
                }
                throw error;
            }
            return fileCount;
        };

        // Fetch file counts with optional keyword filtering
        const keywordFilter = keywords || null;
        const fileCount = await fetchFiles('', keywordFilter);

        // Log successful action
        admin.logActions(req, {
            actionType: 'Get Dropbox File Counts',
            actionDetails: `File count fetched for member ID: ${accountId}, Keywords: ${keywords || 'None'}, Date range: ${startDate || 'No start'} to ${endDate || 'No end'}`,
            actionResult: 'Success',
        });

        res.json({ ok: true, count: fileCount });
    } catch (error) {
        console.error('Error fetching Dropbox file counts:', error);

        // Log failure action
        admin.logActions(req, {
            actionType: 'Get Dropbox File Counts',
            actionDetails: error.message,
            actionResult: 'Failure',
        });

        res.status(500).json({
            ok: false,
            msg: 'Failed to fetch Dropbox file counts.',
            error: error.message,
        });
    }
};


