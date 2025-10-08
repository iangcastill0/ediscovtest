const axios = require('axios');
const querystring = require('querystring');
const BoxSDKA = require('box-node-sdk')
const config = require("../config/app.config");
const Utils = require('./utils');
const admin = require("./admin");
const User = require('../models/user');
const BoxWorkspace = require('../models/boxworkspace');
const BoxMember = require('../models/boxmember');

const sdkConfig = {
    boxAppSettings: {
      clientID: config.BOX_INFO.boxAppSettings.clientID,
      clientSecret: config.BOX_INFO.boxAppSettings.clientSecret,
      appAuth: {
        keyID: config.BOX_INFO.boxAppSettings.appAuth.publicKeyID,
        privateKey: config.BOX_INFO.boxAppSettings.appAuth.privateKey.replace(/\\n/g, '\n'),
        passphrase: config.BOX_INFO.boxAppSettings.appAuth.passphrase
      }
    },
    enterpriseID: config.BOX_INFO.enterpriseID
  };
const boxSdk = new BoxSDKA(sdkConfig.boxAppSettings)

exports.getBoxAccessToken = async (workspaceId) => {
    try {
      const workspace = await BoxWorkspace.findById(workspaceId);
  
      if (!workspace) {
        throw new Error('Workspace not found.');
      }
  
      // If no refresh token, cannot refresh
      if (!workspace.refreshToken) {
        throw new Error('No refresh token available for this workspace.');
      }
  
      // Request a new access token from Box
      const tokenResponse = await axios.post(
        'https://api.box.com/oauth2/token',
        querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: workspace.refreshToken,
          client_id: config.BOX_INFO_PERSONAL.CLIENT_ID,
          client_secret: config.BOX_INFO_PERSONAL.CLIENT_SECRET,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
  
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
  
      // Update tokens in the database
      workspace.accessToken = access_token;
      workspace.refreshToken = refresh_token;
      workspace.tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
      await workspace.save();
  
      console.log(`✅ Box access token refreshed for workspace ${workspace.displayName}`);
  
      // Return new access token
      return access_token;
    } catch (error) {
      console.error('❌ Error refreshing Box access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh Box access token.');
    }
  };  

exports.installPersonal = (req, res) => {
    const { token, state } = req.query;
    const authUrl = `https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${config.BOX_INFO_PERSONAL.CLIENT_ID}&redirect_uri=${config.BOX_INFO_PERSONAL.REDRIECT_URI}&state=${state}`;

    res.redirect(authUrl);
};

exports.installEnterprise = async (req, res) => {
    const { enterpriseId } = req.params;
  
    if (!enterpriseId) {
      return res.status(400).json({ ok: false, error: "Enterprise ID is required" });
    }
  
    try {
      // Get enterprise app auth client
      const adminClient = boxSdk.getAppAuthClient('enterprise', enterpriseId);
  
      // Fetch enterprise info
      const resp = await adminClient.get(`/enterprises/${enterpriseId}`);
      const enterpriseInfo = resp.body
      if (!enterpriseInfo || !enterpriseInfo.name) {
        throw new Error("Failed to retrieve enterprise information");
      }
  
      const enterpriseName = enterpriseInfo.name;
  
      // Prepare workspace data
      const workspaceData = {
        displayName: enterpriseName,
        isPersonal: false,
        teamId: enterpriseId,
        enterpriseName,
        installedAt: new Date(),
      };
  
      // Create or update workspace
      const workspace = await BoxWorkspace.findOneAndUpdate(
        { teamId: enterpriseId },
        workspaceData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
  
      // Get all members with marker pagination
      let allMembers = [];
      let marker = null;
  
      do {
        const membersResponse = await adminClient.users.getAll({
          limit: 1000,
          marker: marker || undefined,
        });
  
        allMembers = allMembers.concat(membersResponse.entries);
        marker = membersResponse.next_marker || null;
      } while (marker);
  
      console.log(`Found ${allMembers.length} members to process`);
  
      // Bulk upsert members
      const batchSize = 100;
      for (let i = 0; i < allMembers.length; i += batchSize) {
        const batch = allMembers.slice(i, i + batchSize);
  
        const bulkOperations = batch
          .filter((member) => member.id)
          .map((member) => ({
            updateOne: {
              filter: {
                memberId: member.id,
                workspaceId: workspace._id,
              },
              update: {
                $set: {
                  workspaceId: workspace._id,
                  memberId: member.id,
                  name: member.name,
                  login: member.login,
                  email: member.login,
                  language: member.language,
                  timezone: member.timezone,
                  created_at: member.created_at,
                  modified_at: member.modified_at,
                  space_amount: member.space_amount,
                  space_used: member.space_used,
                  max_upload_size: member.max_upload_size,
                  status: member.status,
                  job_title: member.job_title,
                  phone: member.phone,
                  address: member.address,
                  avatar_url: member.avatar_url,
                  notification_email: member.notification_email,
                  lastSynced: new Date(),
                },
              },
              upsert: true,
            },
          }));
  
        if (bulkOperations.length > 0) {
          await BoxMember.bulkWrite(bulkOperations, { ordered: false });
        }
      }
  
      // Update workspace with sync information
      await BoxWorkspace.findByIdAndUpdate(workspace._id, {
        lastSynced: new Date(),
        memberCount: allMembers.length,
        syncStatus: "completed",
      });
  
      return res.json({
        ok: true,
        message: "Enterprise and members stored successfully.",
        data: {
          enterpriseId,
          enterpriseName,
          totalMembers: allMembers.length,
          workspaceId: workspace._id,
        },
      });
    } catch (error) {
      console.error("Error during enterprise installation:", error);
  
      if (error.statusCode === 404) {
        return res.status(404).json({
          ok: false,
          error: "Enterprise not found or access denied",
        });
      }
  
      if (error.statusCode === 401 || error.statusCode === 403) {
        return res.status(403).json({
          ok: false,
          error: "Authentication failed. Please check your Box app credentials.",
        });
      }
  
      if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
        return res.status(503).json({
          ok: false,
          error: "Box API is temporarily unavailable. Please try again later.",
        });
      }
  
      return res.status(500).json({
        ok: false,
        error: "Failed to install enterprise.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
  

exports.oauthCallback = async (req, res) => {
    const { code, state } = req.query;
    const [userId, accountType] = state.split('_');

    if (!code) {
        return res.status(400).send('No authorization code received.');
    }

    try {
        const tokenResponse = await axios.post('https://api.box.com/oauth2/token', querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            client_id: config.BOX_INFO_PERSONAL.CLIENT_ID,
            client_secret: config.BOX_INFO_PERSONAL.CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Fetch user information
        const boxClient = new Box({
            clientID: config.BOX_INFO_PERSONAL.CLIENT_ID,
            clientSecret: config.BOX_INFO_PERSONAL.CLIENT_SECRET,
        });

        const client = boxClient.getBasicClient(access_token);
        const currentUser = await client.users.get(client.CURRENT_USER_ID);
        const {id, ...userInfo} = currentUser;
        console.log("Box User Information")
        console.log(currentUser, userInfo)
        // Store workspace and user data
        const workspaceData = {
            displayName: currentUser.name,
            teamId: currentUser.id,
            isPersonal: accountType === 'personal',
            accessToken: access_token,
            refreshToken: refresh_token,
            owner: userId
        };

        let workspace = await BoxWorkspace.findOne({ teamId: currentUser.id });
        if (!workspace) {
            workspace = new BoxWorkspace(workspaceData);
            await workspace.save();
        }

        const member = await BoxMember.findOne({workspaceId: workspace._id, memberId: currentUser.id})
        if (member) {
            await BoxMember.updateOne({workspaceId: workspace._id, memberId: currentUser.id}, userInfo)
        } else {
            await BoxMember.create({workspaceId: workspace._id, memberId: currentUser.id, ...userInfo})
        }

        // // Fetch folders and files (Root Folder)
        // const rootFolder = await client.folders.get(client.ROOT_FOLDER);
        // await storeFolderStructure(client, rootFolder, workspace._id);

        res.redirect(`/box`); // Redirect back to the frontend
    } catch (error) {
        console.error('Error during Box OAuth process:', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication failed.');
    }
};

// const storeFolderStructure = async (client, folder, workspaceId) => {
//     const items = await client.folders.getItems(folder.id, { fields: 'name,size,modified_at' });

//     for (const item of items.entries) {
//         if (item.type === 'folder') {
//             const folderData = {
//                 name: item.name,
//                 boxId: item.id,
//                 parent: folder.id,
//                 workspace: workspaceId,
//                 type: 'folder'
//             };
//             // Store folder data in your database (e.g., a 'File' or 'Item' model)
//             // await File.create(folderData); 
//             await storeFolderStructure(client, item, workspaceId); // Recurse for subfolders
//         } else if (item.type === 'file') {
//             const fileData = {
//                 name: item.name,
//                 boxId: item.id,
//                 parent: folder.id,
//                 size: item.size,
//                 modifiedAt: item.modified_at,
//                 workspace: workspaceId,
//                 type: 'file'
//             };
//             // Store file data in your database
//             // await File.create(fileData);
//         }
//     }
// };

exports.workspaces = async (req, res) => {
    const { includeInvites } = req.query
    let result = [];
    const workspaces = await BoxWorkspace.find({owner: req.userId}, {accessToken: 0, refreshToken: 0});
    console.log(workspaces, req.userId)
    if (workspaces) {
        for (let i = 0; i < workspaces.length; i++) {
            const users = await BoxMember.find({ workspaceId: workspaces[i]._id });
            result.push({
                workspace: workspaces[i],
                users,
            });
        }
    }

    const invitedWorkspaces = includeInvites == 'false' ? [] : await Utils.invitedWorkspaces(req.userId, 'box')
    if (invitedWorkspaces && invitedWorkspaces.length > 0) {
        result = result.concat(invitedWorkspaces)
    }

    admin.logActions(req, { actionType: 'Get Box Workspaces', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: result, clientId: config.BOX_INFO.boxAppSettings.clientID});
}

exports.members = async (req, res) => {
    const users = await BoxMember.find({ workspaceId: req.params.workspaceId });
    admin.logActions(req, { actionType: 'Get Box Members', actionDetails: "", actionResult: 'Success' });

    res.json({ ok: true, data: users || [] });
}

exports.files = async (req, res) => {
    const { workspaceId, userId } = req.params; // userId = team member email
    const { isPersonal } = req.query;
  
    const boxWorkspace = await BoxWorkspace.findById(workspaceId);
    if (!boxWorkspace) {
      return res.json({ ok: false, msg: "The Box workspace does not exist." });
    }
  
    try {
      let client;
  
      if (isPersonal === "true" || boxWorkspace.isPersonal) {
        const boxWorkspace = await BoxWorkspace.findById(workspaceId);
        let accessToken = boxWorkspace.accessToken;

        // Use the personal Box API client
        const boxSdkPersonal = new BoxSDKA({
            clientID: config.BOX_INFO_PERSONAL.CLIENT_ID,
            clientSecret: config.BOX_INFO_PERSONAL.CLIENT_SECRET,
        });

        client = boxSdkPersonal.getBasicClient(accessToken);

        try {
            // Test token validity (e.g., fetch current user)
            await client.users.get(client.CURRENT_USER_ID);
        } catch (err) {
            if (err.statusCode === 401) {
            console.log('🔄 Access token expired. Refreshing...');
            accessToken = await exports.getBoxAccessToken(workspaceId);
            client = boxSdkPersonal.getBasicClient(accessToken);
            } else {
            throw err;
            }
        }
      } else {
        // Enterprise app auth
        const adminClient = boxSdk.getAppAuthClient("enterprise", boxWorkspace.teamId);
        // If specific user is requested, impersonate
        if (userId) {
          const member = await BoxMember.findOne({ workspaceId: boxWorkspace._id, email: userId });
          if (!member) {
            return res.status(404).json({ ok: false, msg: "Member not found in this workspace." });
          }
          client = boxSdk.getAppAuthClient("user", member.memberId);
        } else {
          client = adminClient;
        }
      }
  
      // Recursive fetch
      const fetchVersionHistory = async (fileId) => {
        try {
          const versions = await client.files.getVersions(fileId, { limit: 10 });
          return versions.entries.map((v) => ({
            id: v.id,
            modifiedTime: v.modified_at,
            size: v.size,
          }));
        } catch (err) {
          console.error(`Error fetching versions for file ${fileId}:`, err.message);
          return [];
        }
      };
  
      const fetchAllFiles = async (folderId = "0") => {
        const items = [];
        let offset = 0;
        const limit = 1000;
  
        while (true) {
          const resp = await client.folders.getItems(folderId, {
            limit,
            offset,
            fields: "id,name,type,size,created_at,modified_at,sha1",
          });
  
          for (const item of resp.entries) {
            let formattedItem = {
              key: item.id,
              label: item.name,
              data: {
                id: item.id,
                label: item.name,
                size: (item.size || 0).toString(),
                formattedSize: `${((item.size || 0) / 1024 / 1024).toFixed(2)} MB`,
                type: item.type,
                path: item.id, // Box doesn’t expose full path like Dropbox
                createdTime: item.created_at || null,
                modifiedTime: item.modified_at || null,
                md5Checksum: item.sha1 || "N/A",
                thumbnailLink: null, // need to call thumbnails endpoint if needed
                versionHistory: item.type === "file" ? await fetchVersionHistory(item.id) : [],
              },
              icon: item.type === "folder" ? "pi pi-fw pi-folder" : "pi pi-fw pi-file",
              children: [],
            };
  
            if (item.type === "folder") {
              formattedItem.children = await fetchAllFiles(item.id);
            }
  
            items.push(formattedItem);
          }
  
          if (resp.entries.length < limit) break;
          offset += limit;
        }
  
        return items;
      };
  
      const filesAndFolders = await fetchAllFiles("0");
  
      admin.logActions(req, {
        actionType: "Get Box Files and Folders",
        actionDetails: "",
        actionResult: "Success",
      });
  
      res.json({ ok: true, data: filesAndFolders });
    } catch (error) {
      console.error("Error fetching Box files:", error);
      admin.logActions(req, {
        actionType: "Get Box Files and Folders",
        actionDetails: error.message,
        actionResult: "Failure",
      });
      res.status(500).json({ ok: false, msg: "Failed to fetch Box files and folders.", error: error.message });
    }
  };
  
