const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const archive = require('../controller/archive');

router.get('/archives', authJWT.verifyToken, authJWT.checkTrial, archive.archives);
router.post('/archives', authJWT.verifyToken, authJWT.checkTrial, archive.applyArchives);
router.get('/archivesLog', authJWT.verifyToken, authJWT.checkTrial, archive.archivesLog);
router.get('/archive/slack/:id/channels',authJWT.verifyToken, authJWT.checkTrial, archive.channels);
// router.get('/archive/slack/:id/channels/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.channels2);
// router.get('/archive/slack/:id/channels/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.channels3);
router.get('/archive/slack/:id/channels/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.channels4);
router.get('/archive/slack/:id/members',authJWT.verifyToken, authJWT.checkTrial, archive.members);
router.get('/archive/slack/:teamId/public-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, archive.getPublicMessages);
// router.get('/archive/slack/:teamId/public-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPublicMessages2);
// router.get('/archive/slack/:teamId/public-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPublicMessages3);
router.get('/archive/slack/:teamId/public-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPublicMessages4);
router.get('/archive/slack/:teamId/private-channel/:channelId',authJWT.verifyToken, authJWT.checkTrial, archive.getPrivateMessages);
// router.get('/archive/slack/:teamId/private-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPrivateMessages2);
// router.get('/archive/slack/:teamId/private-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPrivateMessages3);
router.get('/archive/slack/:teamId/private-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getPrivateMessages4);
router.get('/archive/slack/:teamId/group-channel/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getGroupMessages4);
router.get('/archive/slack/:teamId/direct-conversation-list/:userId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectConversationList);
// router.get('/archive/slack/:teamId/direct-conversation-list/:userId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectConversationList2);
router.get('/archive/slack/:teamId/direct-conversation-list/:userId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectConversationList3);
// router.get('/archive/slack/:teamId/direct-conversation-detail/:channelId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectMessages);
// router.get('/archive/slack/:teamId/direct-conversation-detail/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectMessages2);
// router.get('/archive/slack/:teamId/direct-conversation-detail/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectMessages3);
router.get('/archive/slack/:teamId/direct-conversation-detail/:channelId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.getDirectMessages4);
router.get('/archive/slack/:teamId/export-all/:userId/backup/:backupId',authJWT.verifyToken, authJWT.checkTrial, archive.exportAll);
router.post('/archive/slack/team/:teamId',authJWT.verifyToken, authJWT.checkTrial, archive.slackArchiveMembers); //deprecated
router.post('/archive/slackArchive',authJWT.verifyToken, authJWT.checkTrial, archive.archiveSlack);
router.get('/getArchiveCronTime', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveCronTime);
router.post('/setArchiveCronTime', authJWT.verifyToken, authJWT.checkTrial, archive.setArchiveCronTime);
router.get('/archive/search', authJWT.verifyToken, authJWT.checkTrial, archive.search);
router.post('/archive/delete', authJWT.verifyToken, authJWT.checkTrial, archive.delete);
router.post('/archive/outlook/', authJWT.verifyToken, authJWT.checkTrial, archive.archiveOutlook); // deprecated
router.get('/archive/outlook/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveOutlook);
router.post('/archive/onedrive/', authJWT.verifyToken, authJWT.checkTrial, archive.archiveOnedrive); // deprecated
router.get('/archive/onedrive/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveOnedrive);
router.post('/archive/:archiveId/onedrive/download', authJWT.verifyToken, authJWT.checkTrial, archive.downloadFileFromAWS);
router.post('/archive/:archiveId/googledrive/download', authJWT.verifyToken, authJWT.checkTrial, archive.downloadFileFromAWS);
router.post('/archive/msArchive/', authJWT.verifyToken, authJWT.checkTrial, archive.archiveJob); // archive ms365
router.post('/archive/googleArchive/', authJWT.verifyToken, authJWT.checkTrial, archive.archiveGoogleJob);
router.get('/archive/gmail/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveGmail);
router.post('/archive/:archiveId/gmail/download', authJWT.verifyToken, authJWT.checkTrial, archive.downloadFileFromAWS);
router.post('/archive/:archiveId/outlook/download', authJWT.verifyToken, authJWT.checkTrial, archive.downloadFileFromAWS);
router.get('/archive/drive/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveDrive);
router.get('/archive/outlook/:archiveId/body/:messageId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveOutlookBody2);
router.get('/archive/gmail/:archiveId/messages/:messageId', authJWT.verifyToken, authJWT.checkTrial, archive.archiveGmailMessage);
router.get('/archive/outlook/:archiveId/download/:messageId', authJWT.verifyToken, authJWT.checkTrial, archive.downloadOutlookMSG);
router.post('/archive/outlook/:archiveId/bulkDownload', authJWT.verifyToken, authJWT.checkTrial, archive.bulkDownloadOutlookMSG);
router.post('/archive/gmail/:archiveId/bulkDownload', authJWT.verifyToken, authJWT.checkTrial, archive.bulkDownloadGmail);
router.post('/archive/outlook/search-result/bulk-download', authJWT.verifyToken, authJWT.checkTrial, archive.bulkDownloadOutlookSearchResult);
router.post('/archive/gmail/search-result/bulk-download', authJWT.verifyToken, authJWT.checkTrial, archive.bulkDownloadGmailSearchResult);
router.post('/archive/gmail/addDownloadLog', authJWT.verifyToken, authJWT.checkTrial, archive.addDownloadGmailLog);
router.post('/archive/s3-signed-url', authJWT.verifyToken, authJWT.checkTrial, archive.getS3SignedUrl)
router.post('/archive/s3-image', authJWT.verifyToken, authJWT.checkTrial, archive.getS3Image)
router.get('/archive/s3/download', authJWT.verifyToken, authJWT.checkTrial, archive.s3FileDownload); //deprecated
router.get('/archive/s3/download_v2', authJWT.verifyToken, authJWT.checkTrial, archive.s3FileDownload2);

router.post('/archive/dropboxArchive', authJWT.verifyToken, authJWT.checkTrial, archive.archiveDropbox); // deprecated
router.get('/archive/dropbox/workspaces/:workspaceId/archives/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveDropbox)
router.get('/archive/progress/:userId', authJWT.verifyToken, archive.getArchiveProgress)

router.get('/archive/flagged-collections/:archiveId', authJWT.verifyToken, authJWT.checkTrial, archive.getArchiveFlaggedCollections);
router.get('/archive/flagged-collections/:archiveId/download/:messageId', authJWT.verifyToken, authJWT.checkTrial, archive.downloadFlaggedCollectionsItem);
router.post('/archive/flagged-collections/:archiveId/bulkDownload', authJWT.verifyToken, authJWT.checkTrial, archive.bulkDownloadFlaggedCollections);
module.exports = router;