const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const user = require('../controller/user');

router.post('/user/profile', authJWT.verifyToken, user.updateProfile);
router.post('/user/change-password', authJWT.verifyToken, user.changePassword);
router.post('/user/deactivate', authJWT.verifyToken, user.deactivateAccount);

router.get('/user/actions', authJWT.verifyToken, user.getUserActions);
router.get('/user/subscriptionPlanStatus', authJWT.verifyToken, user.subscriptionPlanStatus);
router.get('/redirect', user.redirect)
module.exports = router;