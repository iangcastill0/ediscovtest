require('dotenv').config();

module.exports = {
  secret: process.env.EXPRESS_SESSION_SECRET,
  G_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  G_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  Twilio: {
    accountSID: process.env.TWILIO_ACCOUNT_SID,
    accountAuthToken: process.env.TWILIO_ACCOUNT_AUTH_TOKEN,
    serviceSID: process.env.TWILIO_SERVICE_SID,
  },
};
