require('dotenv').config();
const os = require('os');
const path = require('path');

const SERVER_NAME = process.env.SERVER_NAME;

module.exports = {
    SLACK_FILES_DIR: path.join(os.homedir(), 'Evestigate/SlackFiles/'),

    DATABASE: {
        mongoDBUri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME,
    },

    SQUARE_INFO: {
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        environment: process.env.SQUARE_ENVIRONMENT,
        locationId: process.env.SQUARE_LOCATION_ID,
        webhookSecret: process.env.SQUARE_WEBHOOK_SECRET,
    },

    SLACK_APP_INFO: {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        userScope: process.env.SLACK_USER_SCOPE,
    },

    MS365_APP_INFO: {
        msalConfig: {
            auth: {
                clientId: process.env.MS365_CLIENT_ID,
                authority: process.env.MS365_AUTHORITY,
                clientSecret: process.env.MS365_CLIENT_SECRET,
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: 3,
                },
            },
        },
        REDIRECT_URI: process.env.MS365_REDIRECT_URI,
        POST_LOGOUT_REDIRECT_URI: process.env.MS365_POST_LOGOUT_REDIRECT_URI,
        GRAPH_ME_ENDPOINT: process.env.MS365_GRAPH_ME_ENDPOINT,
        GRAPH_BASE_URL: process.env.MS365_GRAPH_BASE_URL,
        SCOPES: process.env.MS365_SCOPES,
    },

    GOOGLE_APP_INFO: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
        APP_ID: process.env.GOOGLE_APP_ID
    },

    BOX_INFO: {
        boxAppSettings: {
            clientID: process.env.BOX_CLIENT_ID,
            clientSecret: process.env.BOX_CLIENT_SECRET,
            appAuth: {
                publicKeyID: process.env.BOX_PUBLIC_KEY_ID,
                privateKey: process.env.BOX_PRIVATE_KEY,
                passphrase: process.env.BOX_PASSPHRASE,
            },
        },
        enterpriseID: process.env.BOX_ENTERPRISE_ID,
        REDRIECT_URI: process.env.BOX_REDIRECT_URI,
    },

    BOX_INFO_PERSONAL: {
        CLIENT_ID: process.env.BOX_PERSONAL_CLIENT_ID,
        CLIENT_SECRET: process.env.BOX_PERSONAL_CLIENT_SECRET,
        REDRIECT_URI: process.env.BOX_PERSONAL_REDIRECT_URI,
    },

    SITE_URL: process.env.SITE_URL,
    SITE_TITLE: process.env.SITE_TITLE,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    COMPANY_NAME: process.env.COMPANY_NAME,

    ELASTIC_INFO: {
        SERVER: process.env.ELASTIC_SERVER,
        SLACK_INDEX: process.env.ELASTIC_SLACK_INDEX,
        OUTLOOK_INDEX: process.env.ELASTIC_OUTLOOK_INDEX,
        ONEDRIVE_INDEX: process.env.ELASTIC_ONEDRIVE_INDEX,
        SHAREPOINT_INDEX: process.env.ELASTIC_SHAREPOINT_INDEX,
        GMAIL_INDEX: process.env.ELASTIC_GMAIL_INDEX,
        GOOOGLEDRIVE_INDEX: process.env.ELASTIC_GOOGLEDRIVE_INDEX,
        GOOGLECALENDAR_INDEX: process.env.ELASTIC_GOOGLECALENDAR_INDEX,
        DROPBOX_INDEX: process.env.ELASTIC_DROPBOX_INDEX,
        FILES_INDEX: process.env.ELASTIC_FILES_INDEX,
        FLAGGED_INDEX: process.env.ELASTIC_FLAGGED_INDEX,
    },

    AWS: {
        OUTLOOK_BUCKET: process.env.AWS_OUTLOOK_BUCKET,
    },

    DROPBOX: {
        PERSONAL: {
            APP_KEY: process.env.DROPBOX_PERSONAL_APP_KEY,
            APP_SECRET: process.env.DROPBOX_PERSONAL_APP_SECRET,
            REDIRECT_URI: process.env.DROPBOX_PERSONAL_REDIRECT_URI,
        },
        TEAM: {
            APP_KEY: process.env.DROPBOX_TEAM_APP_KEY,
            APP_SECRET: process.env.DROPBOX_TEAM_APP_SECRET,
            REDIRECT_URI: process.env.DROPBOX_TEAM_REDIRECT_URI,
        },
    },
};
