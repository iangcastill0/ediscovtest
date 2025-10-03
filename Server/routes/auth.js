const express = require ('express');
const {verifySignUp} = require ('../middleware');
// const { checkHeader } = require('../utils');

const router = express.Router ();
const authController = require ('../controller/auth.js');
const {verifyToken} = require ('../middleware/authJwt');
// router.use(checkHeader)

router.post (
  '/auth/register',
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.signup
);

router.post (
  '/auth/register2',
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.signup2
);

router.post ('/auth/login', authController.signin);
router.get ('/auth/verify-email', authController.verifyEmail);
router.post ('/v2/auth/verify-email', authController.verifyEmail2);
router.post ('/auth/sendPhoneOTP', authController.sendPhoneOTP);
router.post ('/auth/verifyPhoneOTP', authController.verifyPhoneOTP);
router.post ('/auth/forgot-password', authController.forgotPassword);
router.post ('/auth/reset-password', authController.resetPassword);
router.post ('/auth/resend-code', authController.resendCode);
router.post ('/auth/resend-phone-code', authController.resendPhoneCode);
router.post ('/auth/send-phone-otp-update', verifyToken, authController.sendPhoneOTPforUpdate);
router.post ('/auth/update-phone', verifyToken, authController.updatePhoneNumber);
router.post ('/auth/validate-2fa-token', authController.verifyCode);
router.post('/auth/generate-secret', verifyToken,  authController.generateSecret)
router.post('/auth/verify-totp', authController.verifyTOTP)
router.post('/auth/verify-totp2', verifyToken, authController.verifyTOTP2)
router.post('/auth/remove-authenticator', verifyToken, authController.removeAuthenticator)
router.post('/auth/update-security', verifyToken, authController.updateSecurity)
router.post ('/auth/logout', verifyToken, authController.logout);
router.post ('/auth/signin-success', verifyToken, authController.signInSuccess);

router.get ('/account/me', verifyToken, authController.me);

module.exports = router;
