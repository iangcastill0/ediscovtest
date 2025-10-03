const getEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

module.exports = {
  secret: getEnv('EXPRESS_SESSION_SECRET','!@#_evestigate_saas_2023_!@#'),
  G_CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
  G_CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
  Twilio: {
    accountSID: getEnv('TWILIO_ACCOUNT_SID'),
    accountAuthToken: getEnv('TWILIO_AUTH_TOKEN'),
    serviceSID: getEnv('TWILIO_SERVICE_SID'),
  },
};
