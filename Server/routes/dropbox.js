const express = require('express');
const authJWT = require('../middleware/authJwt');
// const { checkHeader } = require('../utils');

const router = express.Router();
const dropbox = require('../controller/dropbox.js');
// router.use(checkHeader)

router.get('/dropbox/add-personal', authJWT.verifyToken, authJWT.checkTrial, dropbox.addPersonal);
router.get('/dropbox/add-team',authJWT.verifyToken, authJWT.checkTrial, dropbox.addTeam);
router.get('/dropbox/oauth-personal', dropbox.redirectPersonal);
router.get('/dropbox/oauth-team', dropbox.redirectTeam);
router.get('/dropbox/workspaces', authJWT.verifyToken, authJWT.checkTrial, dropbox.workspaces);
router.get('/dropbox/workspace/:workspaceId/members', authJWT.verifyToken, authJWT.checkTrial, dropbox.members);
router.get('/dropbox/workspace/:workspaceId/members/:userId/files', authJWT.verifyToken, authJWT.checkTrial, dropbox.files);
router.get('/dropbox/workspace/:workspaceId/members/:userId/files/:fileId/download', authJWT.verifyToken, authJWT.checkTrial, dropbox.downloadFile);
router.get('/dropbox/workspace/:workspaceId/members/:userId/files/shared', authJWT.verifyToken, authJWT.checkTrial, dropbox.shared);
router.get('/dropbox/workspace/:workspaceId/members/:userId/files/deleted', authJWT.verifyToken, authJWT.checkTrial, dropbox.deleted);
router.get('/dropbox/workspace/:workspaceId/members/:userId/logs', authJWT.verifyToken, authJWT.checkTrial, dropbox.logs);
router.get('/dropbox/workspace/:workspaceId/counts', authJWT.verifyToken, authJWT.checkTrial, dropbox.counts);

module.exports = router;