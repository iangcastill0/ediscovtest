const os = require('os');
const path = require('path');

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

const SERVER_NAME = getEnv('SERVER_NAME', 'https://ediscovtest.com');

module.exports = {
    SLACK_FILES_DIR: getEnv('SLACK_FILES_DIR', path.join(os.homedir(), 'Evestigate/SlackFiles/')),
    DATABASE: {
        mongoDBUri: getEnv('MONGODB_URI'),
        dbName: getEnv('MONGODB_DB_NAME', 'Ediscovery')
    },
    SQUARE_INFO: {
        accessToken: getEnv('SQUARE_ACCESS_TOKEN'),
        environment: getEnv('SQUARE_ENVIRONMENT', 'sandbox'),
        locationId: getEnv('SQUARE_LOCATION_ID'),
        webhookSecret: getEnv('SQUARE_WEBHOOK_SECRET')
    },
    SLACK_APP_INFO: {
        clientId: getEnv('SLACK_CLIENT_ID'),
        clientSecret: getEnv('SLACK_CLIENT_SECRET'),
        userScope: getEnv('SLACK_USER_SCOPE', 'channels:history,channels:read,groups:history,groups:read,im:history,im:read,mpim:history,mpim:read,users:read,users:read.email,chat:write,emoji:read,reactions:read,files:read,remote_files:read,search:read')
    },
    MS365_APP_INFO: {
        msalConfig : {
            auth: {
                clientId: getEnv('CLIENT_ID'),
                authority: getEnv('MS365_AUTHORITY', 'https://login.microsoftonline.com/organizations'),
                clientSecret: getEnv('CLIENT_SECRET') // Client secret generated from the app registration in Azure portal
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: 3,
                }
            },
        },
        REDIRECT_URI: `${SERVER_NAME}/api/ms365/oauth_redirect`,
        POST_LOGOUT_REDIRECT_URI: `${SERVER_NAME}/ms365/apps`,
        GRAPH_ME_ENDPOINT: 'https://graph.microsoft.com/' + 'v1.0/users',
        GRAPH_BASE_URL: 'https://graph.microsoft.com/v1.0',
        SCOPES: 'https://graph.microsoft.com/.default'
    },
    GOOGLE_APP_INFO: {
        CLIENT_ID: getEnv('GOOGLE_CLIENT_ID'),
        CLIENT_SECRET: getEnv('GOOGLE_CLIENT_SECRET'),
        REDIRECT_URI: `${SERVER_NAME}/api/google/auth-redirect`,
    },
    SITE_URL: SERVER_NAME,
    SITE_TITLE: getEnv('SITE_TITLE', 'CompleteDiscovery'),
    SUPPORT_EMAIL: getEnv('SUPPORT_EMAIL', 'approvals@ediscoverycloud.com'),
    COMPANY_NAME: getEnv('COMPANY_NAME', 'Complete Discovery'),
    ELASTIC_INFO: {
        SERVER: getEnv('ELASTIC_SERVER', 'http://localhost:9200'),
        SLACK_INDEX: 'slack_messages',
        OUTLOOK_INDEX: 'ms365_outlook',
        ONEDRIVE_INDEX: 'ms365_onedrive',
        SHAREPOINT_INDEX: 'ms365_sharepoint',
        GMAIL_INDEX: 'gmail',
        GOOOGLEDRIVE_INDEX: 'google_drive',
        GOOGLECALENDAR_INDEX: 'google_calendar',
        DROPBOX_INDEX: 'dropbox',
        FILES_INDEX: 'files_index',
        FLAGGED_INDEX: 'flagged_collections'
    },
    AWS: {
        OUTLOOK_BUCKET: getEnv('AWS_OUTLOOK_BUCKET', 'ediscoverylive')
    },
    DROPBOX: {
        PERSONAL: {
            APP_KEY: getEnv('DROPBOX_PERSONAL_APP_KEY'),
            APP_SECRET: getEnv('DROPBOX_PERSONAL_APP_SECRET'),
            REDIRECT_URI: `${SERVER_NAME}/api/dropbox/oauth-personal`
        },
        TEAM: {
            APP_KEY: getEnv('DROPBOX_TEAM_APP_KEY'),
            APP_SECRET: getEnv('DROPBOX_TEAM_APP_SECRET'),
            REDIRECT_URI: `${SERVER_NAME}/api/dropbox/oauth-team`
        }
    }
}
