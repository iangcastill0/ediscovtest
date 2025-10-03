const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const inviteUsers = require('../controller/invite_users');
// router.use(checkHeader)


router.get('/invite/users', authJWT.verifyToken, authJWT.checkTrial,  inviteUsers.invites);
router.get('/invite/accept', inviteUsers.accept);
router.post('/invite/send', authJWT.verifyToken, authJWT.checkTrial, inviteUsers.sendInvite);
router.post('/invite/update', authJWT.verifyToken, authJWT.checkTrial, inviteUsers.updateInvite);
router.post('/invite/remove', authJWT.verifyToken,  authJWT.checkTrial, inviteUsers.removeInvite);

module.exports = router;