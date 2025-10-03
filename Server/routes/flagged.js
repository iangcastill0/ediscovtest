const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const flaggedController = require('../controller/flagged');


router.get('/flagged-collections/collectionList', authJWT.verifyToken, authJWT.checkTrial, flaggedController.getCollectionList);
router.post('/flagged-collections/createCollectionList', authJWT.verifyToken, authJWT.checkTrial, flaggedController.createFlaggedList);
router.post('/flagged-collections/storeFlaggedCollections', authJWT.verifyToken, authJWT.checkTrial, flaggedController.storeFlaggedCollection)
router.get('/flagged-collections/storedFlaggedCollections/:collectionId', authJWT.verifyToken, authJWT.checkTrial, flaggedController.getFlaggedCollections)
router.get('/flagged-collections/storedCollectionsMap/:type', authJWT.verifyToken, authJWT.checkTrial, flaggedController.getStoredCollectionsMap)
router.delete('/flagged-collections/:type/storedCollection/:id/:dataId', authJWT.verifyToken, authJWT.checkTrial, flaggedController.deleteStoredCollection)
router.post('/flagged-collections/archive/:collectionId/:collectionName', authJWT.verifyToken, authJWT.checkTrial, flaggedController.archive)
router.delete('/flagged-collections/remove/:id', authJWT.verifyToken, authJWT.checkTrial, flaggedController.deleteCollection)
router.post('/flagged-collections/multiremove', authJWT.verifyToken, authJWT.checkTrial, flaggedController.multiRemoveCollections);
router.post('/flagged-collections/bulkdownload', authJWT.verifyToken, authJWT.checkTrial, flaggedController.bulkDownload);

module.exports = router;