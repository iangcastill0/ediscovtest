const config = require("../config/app.config");
const { google } = require("googleapis");

const oauth2ClientTest = new google.auth.OAuth2(
  config.GOOGLE_APP_INFO.CLIENT_ID,
  config.GOOGLE_APP_INFO.CLIENT_SECRET,
  config.GOOGLE_APP_INFO.REDIRECT_URI
);

module.exports = { oauth2ClientTest };