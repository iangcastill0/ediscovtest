require('dotenv').config();

module.exports = {
  secret: '!@#_evestigate_saas_2023_!@#',
  G_CLIENT_ID: '22301354270-s9o0tjfhhik2orirp2075bk63e7amf9e.apps.googleusercontent.com',
  G_CLIENT_SECRET: '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',
  Twilio: {
    accountSID: process.env.TWILIO_ACCOUNT_SID,
    accountAuthToken: process.env.TWILIO_ACCOUNT_AUTH_TOKEN,
    serviceSID: process.env.TWILIO_SERVICE_SID,
  },
};
