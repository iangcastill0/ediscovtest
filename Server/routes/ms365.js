const express = require('express');
var jwt = require("jsonwebtoken");

const router = express.Router();
const ms365Controller = require('../controller/ms365.js');
const MS365Tokens = require("../models/ms365tokens");
const authProvider = require('../config/ms365Provider');
const config = require("../config/app.config");
var fetch = require('../controller/ms365_fetch');
const REDIRECT_URI = config.MS365_APP_INFO.REDIRECT_URI;
const POST_LOGOUT_REDIRECT_URI = config.MS365_APP_INFO.POST_LOGOUT_REDIRECT_URI;
const GRAPH_ME_ENDPOINT = config.MS365_APP_INFO.GRAPH_ME_ENDPOINT;
const authJWT = require('../middleware/authJwt');
const msal = require('@azure/msal-node');
const userController = require('../controller/user.js')
const admin = require('../controller/admin')

const msalConfig = config.MS365_APP_INFO.msalConfig;
const pca = new msal.ConfidentialClientApplication(msalConfig);

router.get('/ms365/addWorkspace', (req, res) => {
  const authCodeUrlParameters = {
    scopes: config.MS365_APP_INFO.SCOPES,
    redirectUri: `${config.SITE_URL}/api/ms365/redirect`,
    state: req.userId
  };
  // Get URL to sign user in and consent to scopes needed for application
  pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
    console.log("-------------------ADD WORKSPACE-----------------")
    console.log(response);
    console.log("******END**********")
    res.redirect(response);
  }).catch((error) => console.log(JSON.stringify(error)));
});

router.get('/ms365/addTenant', authJWT.verifyToken,  async (req, res) => {
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

  const url = `https://login.microsoftonline.com/organizations/adminconsent?client_id=${config.MS365_APP_INFO.msalConfig.auth.clientId}&state=${userId}&redirect_uri=${config.MS365_APP_INFO.REDIRECT_URI}`

  return res.redirect(url)
})

router.get('/ms365/redirect', async (req, res) => {
  console.log("REQ: ", req.query);
  const { admin_consent, tenant, state } = req.query;
  if (!admin_consent) {
    return res.redirect('/ms365/installation/error/1');
  }

  try {
    const accessToken = await ms365Controller.getAccessToken(tenant);
    console.log("accessToken: ", accessToken);
    await ms365Controller.addOrganization(accessToken, state);
  } catch (error) {
    console.log(error);
    return res.redirect('/ms365/installation/error/2');
  }

  res.redirect('/ms365/apps');
});


router.get('/ms365', function (req, res, next) {
  // console.log('isAuthenticated', req.session.isAuthenticated)
  // console.log("=======Session==========")
  // console.log(req.session)
  // if(req.session.isAuthenticated){
  //   res.redirect('/api/ms365/acquireToken');
  // }else{
  res.redirect('/ms365/apps');
  // }
});

router.get('/ms365/signin', authProvider.login({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/api/ms365'
}));
router.get('/ms365/signinOnedrive', authProvider.login({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/api/ms365onedrive'
}));
router.get('/ms365/signinMslogs', authProvider.login({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/api/ms365logs'
}));
router.get('/ms365/signinSharepoint', authProvider.login({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/api/ms365sharepoint'
}));
router.get('/ms365/signinTeams', authProvider.login({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/api/ms365teams'
}));

router.get('/ms365/acquireToken', authProvider.acquireToken({
  scopes: config.MS365_APP_INFO.SCOPES,
  redirectUri: REDIRECT_URI,
  successRedirect: '/ms365/apps'
}));
router.post('/ms365/oauth_redirect', authProvider.handleRedirect());

router.get('/ms365/signout', authProvider.logout({
  postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI
}));


// custom middleware to check auth state
function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/api/ms365/signin'); // redirect to sign-in route
  }
  next();
};
function isAuthenticatedOnedrive(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/api/ms365/signinOnedrive'); // redirect to sign-in route
  }
  next();
};
function isAuthenticatedLogs(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/api/ms365/signinMslogs'); // redirect to sign-in route
  }
  next();
};
function isAuthenticatedSharepoint(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/api/ms365/signinSharepoint'); // redirect to sign-in route
  }
  next();
};
function isAuthenticatedTeams(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('/api/ms365/signinTeams'); // redirect to sign-in route
  }
  next();
};

router.get('/ms365/id',
  isAuthenticated, // check if user is authenticated
  async function (req, res, next) {
    console.log('idTokenClaims', req.session.account.idTokenClaims)
    res.redirect('/ms365/apps');
  }
);

router.get('/ms365/profile',
  isAuthenticated, // check if user is authenticated
  async function (req, res, next) {
    try {
      return res.redirect('/ms365/outlook');
    } catch (error) {
      return res.redirect('/ms365/apps');
    }
  }
);
router.get('/ms365/profileOnedrive',
  isAuthenticatedOnedrive, // check if user is authenticated
  async function (req, res, next) {
    try {
      return res.redirect('/ms365/onedrive');
    } catch (error) {
      return res.redirect('/ms365/apps');
    }
  }
);
router.get('/ms365/profileMslogs',
  isAuthenticatedLogs, // check if user is authenticated
  async function (req, res, next) {
    try {
      return res.redirect('/ms365/mslogs');
    } catch (error) {
      return res.redirect('/ms365/apps');
    }
  }
);
router.get('/ms365/profileSharepoint',
  isAuthenticatedSharepoint, // check if user is authenticated
  async function (req, res, next) {
    try {
      return res.redirect('/ms365/sharepoint');
    } catch (error) {
      return res.redirect('/ms365/apps');
    }
  }
);
router.get('/ms365/profileTeams',
  isAuthenticatedTeams, // check if user is authenticated
  async function (req, res, next) {
    try {
      return res.redirect('/ms365/teams');
    } catch (error) {
      return res.redirect('/ms365/apps');
    }
  }
);

router.get('/ms365/getToken',
  isAuthenticated, // check if user is authenticated
  async function (req, res, next) {
    try {
      res.json({ ok: true, data: req.session.accessToken });
    } catch (error) {
      res.json({ ok: false, data: [] });
    }
  }
);

router.get('/ms365/inbox', isAuthenticated, async (req, res, next) => {
  try {
    const caseList = await fetch('https://graph.microsoft.com/beta/compliance/ediscovery/cases', req.session.accessToken);
    console.log('caseList', caseList);
    if(caseList.value.length > 0){
      const holdList = await fetch(`https://graph.microsoft.com/beta/compliance/ediscovery/cases/${caseList.value[0].id}/legalHolds`, req.session.accessToken);
      console.log('hold list', holdList);
    }
    res.redirect('/ms365/apps');
  } catch (error) {
    console.log('error', error);
    next(error);
  }
});

router.get('/ms365/workspaces', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.workspaces);
router.delete('/ms365/remove-workspace/:workspaceId', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.removeWorkspaces);
router.get('/ms365/workspace/:workspaceId/users', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.users);
router.get('/ms365/workspace/:workspaceId/token', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.token);
router.post('/ms365/request-authentication', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.requestAuthentication);
router.post('/ms365/:workspaceId/outlook/:userId/download', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.downloadOutlook)
router.get('/ms365/:workspaceId/outlook/:userId/messages/:messageId/attachments/:attachmentId/download', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.downloadAttachment)// deprecated
router.get('/ms365/:workspaceId/outlook/:userId/messages/:messageId/attachments/:attachmentId/downloadAttachment', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.downloadAttachment2)
router.post('/ms365/:workspaceId/outlook/:userId/bulkDownload', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.bulkDownloadOutlook)
router.post('/ms365/:workspaceId/outlook/:userId/bulkDownload_v2', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.bulkDownloadOutlook_v2)
router.get('/ms365/workspace/:workspaceId/users/:userId/outlook/folders', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.outlookFolders);
router.get('/ms365/workspace/:workspaceId/users/:userId/outlook/folders/:folderId/messages', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.outlookFolderMessages);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/items/:folderId', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.oneDriveFolderItems);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/filter', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.filter);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/versions/:itemId', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.oneDriveItemVersions);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/sharedwithme', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.oneDriveSharedWithMe);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/sharedbyyou', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.oneDriveSharedByYou);
router.get('/ms365/workspace/:workspaceId/users/:userId/outlook/getCounts', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.getOutlookCounts);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/getCounts', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.getOnedriveCounts);
router.get('/ms365/workspace/:workspaceId/users/:userId/onedrive/item/:itemId/download', authJWT.verifyToken, authJWT.checkTrial, ms365Controller.downloadOnedriveFile);
module.exports = router;