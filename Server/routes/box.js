const express = require('express');
const router = express.Router();
const authJWT = require('../middleware/authJwt');
const boxController = require('../controller/box.js');

router.get('/box/install-personal', authJWT.verifyToken, authJWT.checkTrial, boxController.installPersonal);
router.get('/box/install-enterprise/:enterpriseId', authJWT.verifyToken, authJWT.checkTrial, boxController.installEnterprise);
router.get('/box/oauth/callback', authJWT.verifyToken, authJWT.checkTrial, boxController.oauthCallback);

router.get('/box/workspaces', authJWT.verifyToken, authJWT.checkTrial, boxController.workspaces);
router.get('/box/workspace/:workspaceId/members', authJWT.verifyToken, authJWT.checkTrial, boxController.members);
router.get('/box/workspace/:workspaceId/members/:userId/files', authJWT.verifyToken, authJWT.checkTrial, boxController.files);
// router.get('/box/workspace/:workspaceId/members/:userId/files/:fileId/download', authJWT.verifyToken, authJWT.checkTrial, boxController.downloadFile);
// router.get('/box/workspace/:workspaceId/members/:userId/files/shared', authJWT.verifyToken, authJWT.checkTrial, boxController.shared);
// router.get('/box/workspace/:workspaceId/members/:userId/files/deleted', authJWT.verifyToken, authJWT.checkTrial, boxController.deleted);
// router.get('/box/workspace/:workspaceId/members/:userId/logs', authJWT.verifyToken, authJWT.checkTrial, boxController.logs);


module.exports = router;