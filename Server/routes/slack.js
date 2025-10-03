const express = require('express');
const authJWT = require('../middleware/authJwt');
// const { checkHeader } = require('../utils');

const router = express.Router();
const slack = require('../controller/slack.js');
// router.use(checkHeader)

router.get('/slack/install', authJWT.verifyToken, authJWT.checkTrial, slack.install);
router.get('/slack/oauth_redirect', slack.oauth_redirect);
router.get('/slack/teams', authJWT.verifyToken, authJWT.checkTrial, slack.teams);
router.get('/slack/teams/:teamId/refresh', authJWT.verifyToken, authJWT.checkTrial, slack.refresh);
router.get('/slack/team/:id',authJWT.verifyToken, authJWT.checkTrial, slack.team);
router.get('/slack/team/:id/channels',authJWT.verifyToken, authJWT.checkTrial, slack.channels);
router.get('/slack/team/:teamId/users/:userId/channels',authJWT.verifyToken, authJWT.checkTrial, slack.channels2);
router.get('/slack/team/:id/members',authJWT.verifyToken, authJWT.checkTrial, slack.members);
router.get('/slack/team/:id/real-members',authJWT.verifyToken, authJWT.checkTrial, slack.realMembers);
router.get('/slack/team/:id/emojis',authJWT.verifyToken, authJWT.checkTrial, slack.emojis);
router.post('/slack/team/:id/channels/public/export',authJWT.verifyToken, authJWT.checkTrial, slack.publicChannelExport);
router.post('/slack/team/:id/channels/private/export',authJWT.verifyToken, authJWT.checkTrial, slack.privateChannelExport);
router.post('/slack/request-authenticate',authJWT.verifyToken, authJWT.checkTrial, slack.sendRequestAuth);
router.get('/slack/team/:teamId/public-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getPublicMessages);
router.get('/slack/team/:teamId/direct-conversation-list/:userId',authJWT.verifyToken, authJWT.checkTrial, slack.getDirectConversationList);
router.get('/slack/team/:teamId/export-all/:userId',authJWT.verifyToken, authJWT.checkTrial, slack.exportAll);
router.get('/slack/team/:teamId/direct-conversation-detail/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getDirectMessages);
router.get('/slack/team/:teamId/private-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getPrivateMessages);
router.get('/slack/team/:teamId/users/:userId/public-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getChannelMessages2);
router.get('/slack/team/:teamId/users/:userId/private-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getChannelMessages2);
router.get('/slack/team/:teamId/users/:userId/group-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getChannelMessages2);
router.get('/slack/team/:teamId/users/:userId/direct-conversation-detail/:channelId',authJWT.verifyToken, authJWT.checkTrial, slack.getDirectMessages2);
router.get('/slack/team/:teamId/counts', authJWT.verifyToken, authJWT.checkTrial, slack.getCountsByFilter2);
router.get('/slack/getFile', authJWT.verifyToken, authJWT.checkTrial, slack.getFile);
router.post('/slack/images-base64', authJWT.verifyToken, authJWT.checkTrial, slack.getBase64Images);
router.post('/v1.1/slack/images-base64', authJWT.verifyToken, authJWT.checkTrial, slack.getBase64Images1_1);
router.post('/slack/generate-pdf', authJWT.verifyToken, authJWT.checkTrial, slack.generate_pdf);
router.delete('/slack/remove-workspace/:teamId', authJWT.verifyToken, authJWT.checkTrial, slack.removeWorkspace);
router.get('/slack/download/:teamId/:filename', authJWT.verifyToken, authJWT.checkTrial, slack.fileDownload);


module.exports = router;