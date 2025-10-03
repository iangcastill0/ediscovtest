const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: String,
    password: String,
    name: String,
    company: String,
    country: String,
    phoneNumber: String,
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    phoneCode: String,
    phoneCodeExp: Number,
    willUpdateCountry: String,
    willUpdatePhoneNumber: String,
    willUpdatePhoneCodeExp: Number,
    secret:String,
    secretTmp: String,
    isAuthenticator: {
      type: Boolean,
      default: false
    },
    twoStepEmail: {
      type: Boolean,
      default: false
    },
    twoStepPhone: {
      type: Boolean,
      default: false
    },
    twoStepAuthenticator: {
      type: Boolean,
      default: false
    },
    twoStepEmailVerified: {
      type: Boolean,
      default: false
    },
    twoStepPhoneVerified: {
      type: Boolean,
      default: false
    },
    twoStepAuthenticatorVerified: {
      type: Boolean,
      default: false
    },
    securityActivity: {
      type: mongoose.Schema.Types.ObjectId, ref: 'SecurityActivity'
    },
    roles: [{
        type: String,
        enum: ['customer', 'admin', 'superadmin'],
        default: 'customer'
    }],
    isFreeTrial: {
        type: Boolean,
        default: true
    },
    isTrialOver: {
      type: Boolean,
      default: false
    },
    trialEndDate: Date,
    isMailVerified: {
        type: Boolean,
        default: false
    },
    mailVerificationToken: String,
    mailVerificationTokenExpires: Date,
    isSuspended: {
        type: Boolean,
        default: false
    },
    isGoogleAuth: {
        type: Boolean,
        default: false
    },
    twoFactorCode: String,
    twoFactorExpire: {
      type: Number,
      default: 0
    },
    twoFactored: {
      type: Number,
      default: 0
    },
    wrong2fa: {
      type: Number,
      default: 0
    },
    passwordResetToken: String,
    passwordResetAt: {
      type: Date,
      default: Date.now()
    },
    wrongPwd: Number,
    isSubscribed: {
      type: Boolean,
      default: false
    },
    planID: String,
    customerID: String,
    subscriptionID: String,
    subscriptionCanceledDate: String,
    subscriptionStatus: String,
    isLogged: {
      type: Boolean,
      default: false
    },
    isRegistCompleted: {
      type: Boolean,
      default: false
    },
    registerProgress: {
      emailVerification: {type: Boolean, default: false},
      phoneVerification: {type: Boolean, default: false},
      totpVerification: {type: Boolean, default: false}
    }
  }, { timestamps: true })
);

module.exports = User;
