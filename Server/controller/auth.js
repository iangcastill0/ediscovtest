const config = require ('../config/auth.config');
const appConfig = require ('../config/app.config');
const db = require ('../models');
const Utils = require ('./utils');
const User = db.user;
const admin = require ('./admin');
var parser = require ('ua-parser-js');

var jwt = require ('jsonwebtoken');
var bcrypt = require ('bcryptjs');
const crypto = require ('crypto');
const twilio = require ('twilio');
const speakeasy = require ('speakeasy');
const qrcode = require ('qrcode');
const SecurityActivity = require ('../models/security_activity');
const CDSecureToken = require('../models/cdsecuretoken');
const billingController = require('./billing')

const twilioClient = new twilio (
  config.Twilio.accountSID,
  config.Twilio.accountAuthToken
);

const userProtectFields = {
  password: 0,
  phoneCode: 0,
  secret: 0,
  secretTmp: 0,
  securityActivity: 0,
  twoFactorCode: 0,
  passwordResetToken: 0,
};

const generateQrcode = async email => {
  const secret = speakeasy.generateSecret ({
    name: `${appConfig.COMPANY_NAME}\n${email}`,
    issuer: "CompleteDiscovery"
  });

  try {

    // Set the initial time (UNIX timestamp in seconds)
    const initialTime = Math.floor(Date.now() / 1000); // Current time in seconds

    // Generate the TOTP URI, including the initial time as the "period"
    const otpUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: email,
      issuer: 'CompleteDiscovery',
      encoding: 'base32',
    });

    // const otpauthUrl =
    //   secret.otpauth_url +
    //   `&email=${encodeURIComponent (email)}&company=${encodeURIComponent (appConfig.COMPANY_NAME)}`;
    // const qrCode = await qrcode.toDataURL (otpauthUrl);
    const qrCode = await qrcode.toDataURL (otpUrl);

    return {secret: secret.base32, qrCode};
  } catch (err) {
    throw err;
  }
};

exports.signup = async (req, res) => {
  const existUser = await User.findOne (
    {email: req.body.email},
    userProtectFields
  );
  if (existUser) {
    admin.logActions (req, {
      email: req.body.email,
      actionType: 'SignUp',
      actionDetails: 'Already exists',
      actionResult: 'Failed',
    });
    res.send ({data: existUser, message: 'Already exists!'});
    return;
  }

  const mailVerificationToken = crypto.randomBytes (32).toString ('hex');
  const mailVerificationTokenExpires = new Date ();
  mailVerificationTokenExpires.setDate (
    mailVerificationTokenExpires.getDate () + 7
  ); // Token expires in 7 days

  const currentDate = new Date ();
  const trialEndDate = new Date ();
  trialEndDate.setDate (currentDate.getDate () + 30);
  const user = new User ({
    email: req.body.email,
    password: bcrypt.hashSync (req.body.password, 8),
    trialEndDate: Utils.get30DayFreeTrialEndDate (),
    roles: ['customer'],
    isMailVerified: false,
    mailVerificationToken,
    mailVerificationTokenExpires,
  });
  try {
    await user.save ();
    const verificationLink = `${req.protocol}://${req.get ('host')}/api/auth/verify-email?token=${mailVerificationToken}`;
    await Utils.sendMailVerification (req.body.email, verificationLink);
    admin.logActions (req, {
      email: req.body.email,
      actionType: 'SignUp',
      actionDetails: 'Sent email verification link successfully.',
      actionResult: 'Success',
    });
    res.send ({
      data: user,
      message: "We've sent the email verification link. Please check your email quickly!",
    });
  } catch (error) {
    admin.logActions (req, {
      email: req.body.email,
      actionType: 'SignUp',
      actionDetails: JSON.stringify (error, null, 2),
      actionResult: 'Failed',
    });
    res.status (500).send ({message: error});
  }
};

exports.signup2 = async (req, res) => {
  console.log('>>> SIGNUP2 ENDPOINT HIT <<<');
  console.log('Request body:', req.body);
  
  const existUser = await User.findOne (
    {email: req.body.email},
    userProtectFields
  );
  if (existUser) {
    console.log('User already exists:', req.body.email);
    admin.logActions (req, {
      email: req.body.email,
      actionType: 'SignUp',
      actionDetails: 'Already exists',
      actionResult: 'Failed',
    });
    res.send ({data: existUser, message: 'Already exists!'});
    return;
  }

  const currentDate = new Date ();
  const trialEndDate = new Date ();
  trialEndDate.setDate (currentDate.getDate () + 30);
  const twoFactorCode = Utils.generateTwoFactorCode ();
  console.log('Generated 2FA code:', twoFactorCode);
  console.log('Attempting to send email to:', req.body.email);
  
  const mailSendStatus = await Utils.sendTwoFactorMail (
    req.body.email,
    twoFactorCode
  );
  console.log('Mail send status:', mailSendStatus);
  if (mailSendStatus) {
    const user = new User ({
      email: req.body.email,
      password: bcrypt.hashSync (req.body.password, 8),
      trialEndDate: Utils.get30DayFreeTrialEndDate (),
      roles: ['customer'],
      isMailVerified: false,
      twoFactorCode,
      twoFactorExpire: Date.now () + 1000 * 60 * 10, // 10 minuts expiration
      // mailVerificationToken,
      // mailVerificationTokenExpires,
    });
    try {
      await user.save ();
      // const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${mailVerificationToken}`;
      // await Utils.sendMailVerification(req.body.email, verificationLink);
      admin.logActions (req, {
        email: req.body.email,
        actionType: 'SignUp',
        actionDetails: 'Sent email verification code successfully.',
        actionResult: 'Success',
      });
      res.send ({
        data: user,
        message: "We've sent the email verification code. Please check your email quickly!",
      });
    } catch (error) {
      admin.logActions (req, {
        email: req.body.email,
        actionType: 'SignUp',
        actionDetails: JSON.stringify (error, null, 2),
        actionResult: 'Failed',
      });
      res.status (500).send ({message: error});
    }
  } else {
    res
      .status (500)
      .send ({message: `Can't send the email verification code. Try it later`});
  }
};

exports.verifyEmail = async (req, res) => {
  const {token} = req.query;
  const user = await User.findOne ({mailVerificationToken: token});

  if (!user) {
    return res.status (500).send ({message: 'Invalid verification token'});
  }

  if (user.mailVerificationTokenExpires < new Date ()) {
    return res.status (500).send ({message: 'Verification token has expired'});
  }

  user.isMailVerified = true;
  user.mailVerificationToken = undefined;
  user.mailVerificationTokenExpires = undefined;
  user.registerProgress.emailVerification = true;
  try {
    await user.save ();
    res.redirect ('/login');
  } catch (error) {
    res.status (500).send ({message: error});
  }
};

exports.verifyEmail2 = async (req, res) => {
  const {email, code} = req.body;
  const user = await User.findOne ({email: email}); // Or however you identify the user

  if (!user) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'User not found.',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'User not found.'});
  }

  if (user.isSuspended) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'User suspended because inputed wrong code 5 times.',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'Temporary suspended!'});
  }

  if (user.twoFactorCode !== code) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'Invalid code',
      actionResult: 'Failed',
    });
    let wrongCnt = user.wrong2fa || 0;
    wrongCnt += 1;
    user.wrong2fa = wrongCnt;

    if (wrongCnt === 5) {
      user.isSuspended = true;
      user.wrong2fa = 0;
      await Utils.sendUserSuspendedPWD (email, user);
    }
    await user.save ();
    return res.json ({ok: false, message: 'Invalid code.'});
  }

  if (Date.now () > user.twoFactorExpire) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'Expired code',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'Code has expired.'});
  }

  // Clear the token once used successfully, optional but recommended
  user.twoFactorCode = undefined;
  user.twoFactorExpire = undefined;
  user.wrong2fa = 0;
  user.isMailVerified = true;
  user.twoStepEmail = true;
  user.registerProgress.emailVerification = true;
  await user.save ();
  admin.logActions (req, {
    email,
    actionType: 'Verify 2fa code',
    actionDetails: '',
    actionResult: 'Success',
  });

  // const ua = parser (req.headers['user-agent']);

  // // Get geolocation from ip
  // const ipAddress = req.headers['x-real-ip'];

  res.json ({ok: true});
};

exports.sendPhoneOTP = async (req, res) => {
  const {email, phoneNumber, countryCode} = req.body;
  const user = await User.findOne ({email});

  if (!user) {
    return res.status (500).send ({message: 'User not found!'});
  }

  twilioClient.verify.v2
    .services (config.Twilio.serviceSID)
    .verifications.create ({to: phoneNumber, channel: 'sms'})
    .then (verification => {
      user.country = countryCode;
      user.phoneNumber = phoneNumber;
      // user.phoneCode = verification
      user.phoneCodeExp = Date.now () + 10 * 60 * 1000; // 10 minutes expiration
      user.save ();
      res.json ({ok: true});
    })
    .catch (err => res.json ({ok: false, msg: err.toString ()}));
};

exports.sendPhoneOTPforUpdate = async (req, res) => {
  const {phoneNumber, countryCode} = req.body;
  const user = await User.findById (req.userId);

  if (!user) {
    return res.status (500).send ({message: 'User not found!'});
  }

  twilioClient.verify.v2
    .services (config.Twilio.serviceSID)
    .verifications.create ({to: phoneNumber, channel: 'sms'})
    .then (verification => {
      user.willUpdateCountry = countryCode;
      user.willUpdatePhoneNumber = phoneNumber;
      // user.phoneCode = verification
      user.willUpdatePhoneCodeExp = Date.now () + 10 * 60 * 1000; // 10 minutes expiration
      user.save ();
      res.json ({ok: true});
    })
    .catch (err => res.json ({ok: false, msg: err.toString ()}));
};

exports.verifyPhoneOTP = async (req, res) => {
  const {email, phoneOTP} = req.body;
  const user = await User.findOne ({email});

  if (!user) {
    return res.status (500).send ({message: 'User not found!'});
  }
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services (config.Twilio.serviceSID)
      .verificationChecks.create ({
        code: phoneOTP,
        to: user.phoneNumber,
      });

    if (verificationCheck.status !== 'approved') {
      return res.json ({ok: false, msg: 'Invalid OTP'});
    }
  } catch (error) {
    return res.json ({ok: false, msg: error.toString ()});
  }

  if (user.phoneCodeExp < Date.now ()) {
    return res.json ({ok: false, msg: 'OTP is expired! Please try again.'});
  }

  user.isPhoneVerified = true;
  user.twoStepPhone = true;
  user.registerProgress.phoneVerification = true;
  const {secret, qrCode} = await generateQrcode (email);
  user.secretTmp = secret;
  user.save ();
  res.json ({ok: true, qrCode});
};

exports.updatePhoneNumber = async (req, res) => {
  const {phoneOTP} = req.body;
  const user = await User.findById (req.userId);

  if (!user) {
    return res.status (500).send ({message: 'User not found!'});
  }
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services (config.Twilio.serviceSID)
      .verificationChecks.create ({
        code: phoneOTP,
        to: user.willUpdatePhoneNumber,
      });

    if (verificationCheck.status !== 'approved') {
      return res.json ({ok: false, msg: 'Invalid OTP'});
    }
  } catch (error) {
    return res.json ({ok: false, msg: error.toString ()});
  }

  if (user.willUpdatePhoneCodeExp < Date.now ()) {
    return res.json ({ok: false, msg: 'OTP is expired! Please try again.'});
  }
  user.isPhoneVerified = true;
  user.phoneNumber = user.willUpdatePhoneNumber;
  user.willUpdatePhoneNumber = '';
  user.save ();
  res.json ({ok: true});
};

exports.me = async (req, res) => {
  const user = await User.findOne ({_id: req.userId}, userProtectFields);
  const activeSubscription = await billingController.customerStatus(user.customerID, user.subscriptionID, user)
  const userObj = user.toObject ();
  userObj.activeSubscription = activeSubscription
  // userObj['isTwoFactored'] =
  //   Date.now () < user.twoFactored && !user.twoFactorCode;
  // let isTwoFactored = true
  // if (user.twoStepEmail && !user.twoStepEmailVerified) {
  //   isTwoFactored = false
  // }
  // if (user.twoStepPhone && !user.twoStepPhoneVerified) {
  //   isTwoFactored = false
  // }
  // if (user.isAuthenticator && !user.twoStepAuthenticatorVerified) {
    // isTwoFactored = false
  // }
  console.log(user.twoFactored)
  userObj['isTwoFactored'] = (Date.now () < user.twoFactored )
  admin.logActions (req, {
    email: user.email,
    actionType: 'account-me',
    actionDetails: 'Fetching account information',
    actionResult: 'Success',
  });
  res.json ({data: userObj});
};

exports.logout = async (req, res) => {
  const user = await User.findOne ({_id: req.userId});
  user.twoFactored = 0;
  user.twoFactorCode = '';
  user.twoFactorExpire = 0;
  user.twoStepAuthenticatorVerified = false
  user.twoStepEmailVerified = false
  user.twoStepPhoneVerified = false

  user.save ();
  admin.logActions (req, {
    email: user.email,
    actionType: 'logout',
    actionDetails: 'Logged out',
    actionResult: 'Success',
  });

  res.json ({ok: true});
};

exports.signInSuccess = async (req, res) => {
  const user = await User.findOne({_id: req.userId});
  if (!user) {
    return res.status(400).send('User not found!');
  }

  user.twoFactored = Date.now() + 1000 * 3600 * 24; // 24-hour session
  user.twoStepAuthenticatorVerified = false;
  user.twoStepEmailVerified = false;
  user.twoStepPhoneVerified = false;
  user.twoFactorCode = undefined;
  user.twoFactorExpire = undefined;
  user.wrong2fa = 0;

  await user.save();

  admin.logActions(req, {
    email: user.email,
    actionType: 'SignIn Success',
    actionDetails: 'Sign-in successful',
    actionResult: 'Success',
  });

  const ua = parser(req.headers['user-agent']);
  const ipAddress = req.headers['x-real-ip'];
  const geoData = await Utils.getGeolocation(ipAddress);

  await Utils.sendSignInSucceed(user.email, user, {
    os: ua.os.name,
    browser: ua.browser.name,
    ipAddress,
    geoData,
  });

  await Utils.sendPushNotification({
    email: user.email,
    title: 'Security Alert',
    message: `You have successfully signed in from ${geoData.city}, ${geoData.country}.\n Device: ${ua.browser.name} on ${ua.os.name}.\n If this was not you, please secure your account immediately.`
  });

  res.json({ok: true});
};


exports.signin = async (req, res) => {
  const {mobile} = req.query
  try {
    const user = await User.findOne ({
      email: req.body.email,
    });

    if (!user) {
      admin.logActions (req, {
        email: req.body.email,
        actionType: 'Login',
        actionDetails: 'User not found.',
        actionResult: 'Failed',
      });
      return res.status (404).send ({message: 'User not found.'});
    }

    if (!user.isRegistCompleted) {
      admin.logActions (req, {
        email: req.body.email,
        actionType: 'Login',
        actionDetails: 'User did not complete registration.',
        actionResult: 'Failed',
      });
      return res.status (401).send ({message: 'You did not complete the registration process.', detail: user.registerProgress});
    }

    var passwordIsValid = bcrypt.compareSync (
      req.body.password,
      user.password || ''
    );

    if (user.isSuspended) {
      return res.status (500).send ({
        serviceToken: null,
        message: 'You are temporary suspended. Please contact to support team!',
      });
    }

    if (!passwordIsValid) {
      admin.logActions (req, {
        email: req.body.email,
        actionType: 'Login',
        actionDetails: 'Invalid Password.',
        actionResult: 'Failed',
      });
      let num = user.wrongPwd || 0;
      num += 1;
      user.wrongPwd = num;
      if (num >= 5) {
        user.isSuspended = true;
        user.wrongPwd = 0;
        await Utils.sendUserSuspendedPWD (req.body.email, user);
      }

      user.save ();

      return res.status (500).send ({
        serviceToken: null,
        message: 'Invalid Password!',
      });
    }

    var token = jwt.sign ({id: user._id}, config.secret, {
      expiresIn: 86400, // 24 hours
    });

    if (user.twoStepEmail && !mobile) {
      const twoFactorCode = Utils.generateTwoFactorCode ();
      await Utils.sendTwoFactorMail (user.email, twoFactorCode);
      user.twoFactorCode = twoFactorCode;
      user.twoFactorExpire = Date.now () + 1000 * 60 * 10;
    }

    if (user.twoStepPhone && !mobile) {
      try {
        await twilioClient.verify.v2
          .services (config.Twilio.serviceSID)
          .verifications.create ({to: user.phoneNumber, channel: 'sms'});
        user.phoneCodeExp = Date.now () + 10 * 60 * 1000;
      } catch (error) {
        console.log ('SEND SMS ERROR: ', error);
      }
    }

    user.wrongPwd = 0;

    if (!user.isTrialOver) {
      //check trial period
      const currentDate = new Date ();
      user.isTrialOver = currentDate > user.trialEndDate;
    }
    await user.save ();

    user.twoFactorCode = 'xxxx';

    admin.logActions (req, {
      email: req.body.email,
      actionType: 'Login',
      actionDetails: 'Sent 2fa code',
      actionResult: 'Success',
    });
    res.status (200).send ({
      serviceToken: token,
      user,
    });
  } catch (error) {
    console.error (error);
    admin.logActions (req, {
      email: req.body.email,
      actionType: 'Login',
      actionDetails: JSON.stringify (error),
      actionResult: 'Failed',
    });
    res.status (500).send ({message: JSON.stringify (error)});
  }
};

exports.resendCode = async (req, res) => {
  const {email} = req.body;
  const user = await User.findOne ({
    email,
  });
  if (!user) {
    admin.logActions (req, {
      email,
      actionType: 'Resend 2fa code',
      actionDetails: 'Email is invalid',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'User not found.'});
  }
  const twoFactorCode = Utils.generateTwoFactorCode ();
  Utils.sendTwoFactorMail (user.email, twoFactorCode);
  user.twoFactorCode = twoFactorCode;
  user.twoFactorExpire = Date.now () + 1000 * 60 * 10;

  await user.save ();
  admin.logActions (req, {
    email,
    actionType: 'Resend 2fa code',
    actionDetails: '2fa code is generated.',
    actionResult: 'Success',
  });
  res.json ({ok: true});
};

exports.resendPhoneCode = async (req, res) => {
  const {email} = req.body;
  const user = await User.findOne ({
    email,
  });
  if (!user) {
    admin.logActions (req, {
      email,
      actionType: 'Resend phone code',
      actionDetails: 'User is invalid',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, msg: 'User not found.'});
  }
  if (!user.phoneNumber) {
    return res.json({ok: false, msg: 'The user does not have a phone number.'})
  }
  try {
    await twilioClient.verify.v2
            .services (config.Twilio.serviceSID)
            .verifications.create ({to: user.phoneNumber, channel: 'sms'});
          user.phoneCodeExp = Date.now () + 10 * 60 * 1000;
  } catch (error) {
    return res.json({ok: false, msg: error.toString()})
  }

  await user.save ();
  admin.logActions (req, {
    email,
    actionType: 'Resend phone code',
    actionDetails: 'Phone code is generated.',
    actionResult: 'Success',
  });
  res.json ({ok: true});
};

exports.verifyCode = async (req, res) => {
  const {email, code} = req.body;
  const user = await User.findOne ({email: email}); // Or however you identify the user

  if (!user) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'User not found.',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'User not found.'});
  }

  if (user.isSuspended) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'User suspended because inputed wrong code 5 times.',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'Temporary suspended!'});
  }

  if (user.twoFactorCode !== code) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'Invalid email verification code',
      actionResult: 'Failed',
    });
    let wrongCnt = user.wrong2fa || 0;
    wrongCnt += 1;
    user.wrong2fa = wrongCnt;
    if (wrongCnt === 5) {
      user.isSuspended = true;
      user.wrong2fa = 0;
      await Utils.sendUserSuspendedPWD (email, user);
    }
    await user.save ();
    return res.json ({ok: false, message: 'Invalid email verification code.'});
  }

  if (Date.now () > user.twoFactorExpire) {
    admin.logActions (req, {
      email,
      actionType: 'Verify 2fa code',
      actionDetails: 'Expired code',
      actionResult: 'Failed',
    });
    return res.json ({ok: false, message: 'Code has expired.'});
  }

  // Clear the token once used successfully, optional but recommended
  
  user.isMailVerified = true;
  user.twoStepEmailVerified = true;

  await user.save ();
  admin.logActions (req, {
    email,
    actionType: 'Verify 2fa code',
    actionDetails: '',
    actionResult: 'Success',
  });

  res.json ({ok: true});
};

exports.forgotPassword = async (req, res) => {
  console.log ('email:', req.body.email);
  const {email} = req.body;
  try {
    const user = await User.findOne ({
      email,
    });
    if (!user) {
      admin.logActions (req, {
        email,
        actionType: 'Forgot Password',
        actionDetails: 'User not found.',
        actionResult: 'Failed',
      });
      return res.status (200).send ({
        ok: false,
        message: 'User with that email does not exist.',
      });
    }

    const totalTime = new Date ().getTime ().toString ();
    const passwordResetToken = bcrypt.hashSync (totalTime, 6);
    console.log ('passwordResetToken:', passwordResetToken);

    //update reset token
    user.passwordResetToken = passwordResetToken;
    user.passwordResetAt = new Date (Date.now () + 10 * 60 * 1000);
    user.save ();
    admin.logActions (req, {
      email,
      actionType: 'Forgot Password',
      actionDetails: 'Password reset token was generated',
      actionResult: 'Success',
    });

    try {
      const url = `${appConfig.SITE_URL}/resetpassword/${encodeURIComponent (passwordResetToken)}`;
      const result = await Utils.sendForgotMail (req.body.email, user._id, url);
      admin.logActions (req, {
        email,
        actionType: 'Forgot Password',
        actionDetails: 'Sent the email',
        actionResult: 'Success',
      });
      return res.status (200).send ({
        ok: true,
        message: 'You will receive a reset email if user with that email exist',
      });
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetAt = null;
      user.save ();
      admin.logActions (req, {
        email,
        actionType: 'Forgot Password',
        actionDetails: JSON.stringify (err, null, 2),
        actionResult: 'Failed',
      });
      return res.status (200).send ({
        ok: false,
        message: 'There was an error sending email',
      });
    }
  } catch (error) {
    console.error (error);
    admin.logActions (req, {
      email,
      actionType: 'Forgot Password',
      actionDetails: JSON.stringify (error, null, 2),
      actionResult: 'Failed',
    });
    return res.status (200).send ({
      ok: false,
      message: 'There was an error sending email',
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne ({
      passwordResetToken: req.body.token,
      passwordResetAt: {$gte: new Date ()},
    });
    if (!user) {
      admin.logActions (req, {
        actionType: 'Reset Password',
        actionDetails: 'User not found',
        actionResult: 'Failed',
      });
      return res.status (200).send ({
        ok: false,
        message: 'Invalid token or token has expired.',
      });
    }

    //update reset password and token
    user.password = bcrypt.hashSync (req.body.password, 8);
    user.passwordResetToken = null;
    user.passwordResetAt = null;
    user.save ();
    admin.logActions (req, {
      email: user.email,
      actionType: 'Reset Password',
      actionDetails: 'Password updated successfully.',
      actionResult: 'Success',
    });
    return res.status (200).send ({
      ok: true,
      message: 'Password data updated successfully',
    });
  } catch (error) {
    console.error (error);
    admin.logActions (req, {
      email: user.email,
      actionType: 'Reset Password',
      actionDetails: JSON.stringify (error, null, 2),
      actionResult: 'Failed',
    });
    return res.status (200).send ({
      ok: false,
      message: 'There was an error reset password',
    });
  }
};


exports.generateSecret = async (req, res) => {
  const {email, password} = req.body;
  const user = await User.findOne ({email});
  if (!user) {
    return res.status (404).send ('User not found');
  }

  var passwordIsValid = bcrypt.compareSync (password, user.password || '');

  if (!passwordIsValid) {
    return res.json ({ok: false, msg: 'Password is not correct!'});
  }

  // if (!user.isMailVerified || !user.isPhoneVerified) {
  //   return res.json({ok: false, msg: 'User is not verified yet!'})
  // }
  try {
    const {secret, qrCode} = await generateQrcode (email);
    user.secretTmp = secret;
    await user.save ();

    return res.json ({ok: true, qrCode});
  } catch (error) {
    res.json ({
      ok: false,
      msg: `It is failed to create a secret. Try again later \n Error: ${error}`,
    });
  }
};

exports.removeAuthenticator = async (req, res) => {
  const {password} = req.body;
  const user = await User.findById (req.userId);
  if (!user) {
    return res.status (404).send ('User not found');
  }

  var passwordIsValid = bcrypt.compareSync (password, user.password || '');

  if (!passwordIsValid) {
    return res.json ({ok: false, msg: 'Password is not correct!'});
  }

  user.secret = '';
  user.secretTmp = '';
  user.isAuthenticator = false;

  await user.save ();

  return res.json ({ok: true});
};

exports.updateSecurity = async (req, res) => {
  const {password, isEmail, isPhone} = req.body;
  const user = await User.findById (req.userId);
  if (!user) {
    return res.status (404).send ('User not found');
  }

  var passwordIsValid = bcrypt.compareSync (password, user.password || '');

  if (!passwordIsValid) {
    return res.json ({ok: false, msg: 'Password is not correct!'});
  }

  user.twoStepEmail = isEmail;
  user.twoStepPhone = isPhone;

  await user.save ();

  return res.json ({ok: true});
};

exports.verifyTOTP = async (req, res) => {
  const {email, token} = req.body;

  const user = await User.findOne ({email});
  if (!user) {
    return res.status (404).send ('User not found');
  }

  if (!user.secretTmp) {
    return res.json ({ok: false, msg: 'User is not verified yet!'});
  }

  const verified = speakeasy.time.verify ({
    secret: user.secretTmp,
    encoding: 'base32',
    token,
    window: 10
  });
  console.log(user.secretTmp, token, verified)

  if (verified) {
    user.secret = user.secretTmp;
    user.secretTmp = '';
    user.isAuthenticator = true;
    user.isRegistCompleted = true;
    user.registerProgress.totpVerification = true;

    const securityActivity = await SecurityActivity.create ({
      user: user._id,
      type: 'Authenticator',
      note: 'New authenticator is added!',
    });
    user.securityActivity = securityActivity._id;
    await user.save ();
  }

  res.json ({ok: verified});
};

exports.verifyTOTP2 = async (req, res) => {
  const {email, token} = req.body;

  const user = await User.findOne ({email});
  if (!user) {
    return res.status (404).send ('User not found');
  }

  if (!user.secret) {
    return res.json ({ok: false, msg: 'User is not verified yet!'});
  }

  const verified = speakeasy.time.verify ({
    secret: user.secret,
    encoding: 'base32',
    token,
    window: 10
  });

  if (verified) {
    // const securityActivity = await SecurityActivity.create ({
    //   user: user._id,
    //   type: 'Authenticator',
    //   note: 'New authenticator is added!',
    // });
    // user.securityActivity = securityActivity._id;
    user.twoStepAuthenticatorVerified = true
    await user.save ();
  }

  res.json ({ok: verified});
};
