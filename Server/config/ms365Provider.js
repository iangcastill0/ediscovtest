const config = require("./app.config");
const msal = require('@azure/msal-node');
const axios = require('axios');

const MS365Workspace = require("../models/ms365workspaces");
const MS365User = require("../models/ms365users");
const MS365Tokens = require("../models/ms365tokens");

const msalConfig = config.MS365_APP_INFO.msalConfig;

class AuthProvider {
    msalConfig;
    cryptoProvider;

    constructor(msalConfig) {
        this.msalConfig = msalConfig
        this.cryptoProvider = new msal.CryptoProvider();
    };

    async addOrUpdateWorkspace (accessToken, accountInfo) {
        let url = 'https://graph.microsoft.com/v1.0/organization';
    
        // Headers, including the Authorization header with your access token
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    
        try {
            const response = await axios.get(url, { headers: headers });
            const orgObject = response.data.value[0];
    
            // Check if the workspace already exists
            let workspace = await MS365Workspace.findOne({ orgId: orgObject.id });
            if (workspace) {
                workspace.displayName = orgObject.displayName;
                workspace.orgObject = orgObject;
                workspace.accessToken = accessToken;
                workspace.save();
            } else {
                // Create a new workspace
                workspace = new MS365Workspace({
                    orgId: orgObject.id,
                    displayName: orgObject.displayName,
                    orgObject: orgObject
                });
                workspace.save();
            }
    
            //Get users list in the workspace
            url = 'https://graph.microsoft.com/v1.0/users';
            const resp = await axios.get(url, { headers: headers });
            const users = resp.data.value;
            users.map(async (userInfo) => {
                // Check if the user already exists
                let user = await MS365User.findOne({ workspaceId: workspace._id, userId: userInfo.id });
                if (user) {
                    user.displayName = userInfo.displayName;
                    user.businessPhones = userInfo.businessPhones;
                    user.givenName = userInfo.givenName;
                    user.jobTitle = userInfo.jobTitle;
                    user.mail = userInfo.mail;
                    user.mobilePhone = userInfo.mobilePhone;
                    user.displayName = userInfo.displayName;
                    user.officeLocation = userInfo.officeLocation;
                    user.preferredLanguage = userInfo.preferredLanguage;
                    user.userPrincipalName = userInfo.userPrincipalName;
                    if (userInfo.id === accountInfo.localAccountId) {
                        user.accessToken = accessToken;
                        user.isAuthorized = true;
                    }
                    user.save();
                } else {
                    // Create a new user
                    if (userInfo.id === accountInfo.localAccountId) {
                        userInfo.accessToken = accessToken;
                        userInfo.isAuthorized = true;
                    }
                    user = new MS365User({
                        ...userInfo, workspaceId: workspace._id, userId: userInfo.id
                    });
                    user.save();
                }
            });
    
        } catch (error) {
            console.error('Error fetching organization information:', error);
        }
    }

    login(options = {}) {
        return async (req, res, next) => {
            // await req.session.destroy();
            /**
             * MSAL Node library allows you to pass your custom state as state parameter in the Request object.
             * The state parameter can also be used to encode information of the app's state before redirect.
             * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
             */
            const state = this.cryptoProvider.base64Encode(
                JSON.stringify({
                    successRedirect: options.successRedirect || '/',
                })
            );

            const authCodeUrlRequestParams = {
                state: state,

                /**
                 * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
                 * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
                 */
                scopes: options.scopes || [],
                redirectUri: options.redirectUri,
            };

            const authCodeRequestParams = {
                state: state,

                /**
                 * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
                 * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
                 */
                scopes: options.scopes || [],
                redirectUri: options.redirectUri,
            };

            /**
             * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will 
             * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making 
             * metadata discovery calls, thereby improving performance of token acquisition process. For more, see:
             * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
             */
            if (!this.msalConfig.auth.cloudDiscoveryMetadata || !this.msalConfig.auth.authorityMetadata) {

                const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                    this.getCloudDiscoveryMetadata(this.msalConfig.auth.authority),
                    this.getAuthorityMetadata(this.msalConfig.auth.authority)
                ]);

                this.msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
                this.msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
            }

            const msalInstance = this.getMsalInstance(this.msalConfig);
            console.log("Entering redirectToAuthCodeUrl", msalInstance);

            // trigger the first leg of auth code flow
            return this.redirectToAuthCodeUrl(
                authCodeUrlRequestParams,
                authCodeRequestParams,
                msalInstance
            )(req, res, next);
        };
    }

    acquireToken(options = {}) {
        return async (req, res, next) => {
            const ms365Workspace = await MS365Workspace.findOne({ _id: req.params.workspaceId });
            try {
                const msalInstance = this.getMsalInstance(this.msalConfig);

                // Retrieve token from database
                let userToken = await MS365Tokens.findOne({ 'account.tenantId': ms365Workspace.orgId });
                if (userToken) {
                    msalInstance.getTokenCache().deserialize(userToken.tokenCache);
                }

                const tokenResponse = await msalInstance.acquireTokenSilent({
                    account: userToken ? userToken.account : null,
                    scopes: options.scopes || [],
                });

                // Update or create token in the database
                if (userToken) {
                    userToken.tokenCache = msalInstance.getTokenCache().serialize();
                    userToken.accessToken = tokenResponse.accessToken;
                    // userToken.idToken = tokenResponse.idToken;
                    userToken.account = tokenResponse.account;
                    await userToken.save();
                } else {
                    const newUserToken = new MS365Tokens({
                        userId: tokenResponse.account.localAccountId,
                        tokenCache: msalInstance.getTokenCache().serialize(),
                        accessToken: tokenResponse.accessToken,
                        account: tokenResponse.account,
                    });
                    await newUserToken.save();
                }
                // TO-DO think if this is available
                // await addOrUpdateWorkspace(tokenResponse.accessToken, tokenResponse.account);
                res.json({ok: true, data: tokenResponse.accessToken});
                // res.redirect(options.successRedirect);
            } catch (error) {
                // res.redirect('/api/ms365/signin');
                res.json({ok: false, data: ''});
            }
        };
    }


    // acquireToken(options = {}) {
    //     console.log(888);
    //     return async (req, res, next) => {
    //         try {
    //             const msalInstance = this.getMsalInstance(this.msalConfig);

    //             /**
    //              * If a token cache exists in the session, deserialize it and set it as the 
    //              * cache for the new MSAL CCA instance. For more, see: 
    //              * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
    //              */
    //             console.log("00000000\n");
    //             if (req.session.tokenCache) {
    //                 msalInstance.getTokenCache().deserialize(req.session.tokenCache);
    //             }
    //             console.log("11111\n");
    //             const tokenResponse = await msalInstance.acquireTokenSilent({
    //                 account: req.session.account,
    //                 scopes: options.scopes || [],
    //             });
    //             console.log("****************Acquired Token****************");
    //             console.log(tokenResponse);
    //             console.log("222222222\n");
    //             /**
    //              * On successful token acquisition, write the updated token 
    //              * cache back to the session. For more, see: 
    //              * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md
    //              */
    //             req.session.tokenCache = msalInstance.getTokenCache().serialize();
    //             req.session.accessToken = tokenResponse.accessToken;
    //             req.session.idToken = tokenResponse.idToken;
    //             req.session.account = tokenResponse.account;
    //             console.log("===============Session Info==============");
    //             let accountInfo = {};
    //             try {
    //                 const temp = JSON.parse(req.session.tokenCache).Account;
    //                 accountInfo = temp && temp[Object.keys(temp)[0]];
    //             } catch (error) {

    //             }
    //             await addOrUpdateWorkspace(tokenResponse.accessToken, accountInfo);

    //             res.redirect(options.successRedirect);
    //         } catch (error) {
    //             req.session.destroy(() => {
    //                 res.redirect('/api/ms365/signin');
    //             });
    //         }
    //     };
    // }

    // handleRedirect(options = {}) {
    //     console.log('999');
    //     return async (req, res, next) => {
    //         if (!req.body || !req.body.state) {
    //             console.log('1001');
    //             return next(new Error('Error: response not found'));
    //         }
    //         console.log("handleRedirect Session: ", req.session);

    //         try {
    //             const authCodeRequest = {
    //                 ...req.session.authCodeRequest,
    //                 code: req.body.code,
    //                 codeVerifier: req.session.pkceCodes.verifier,
    //             };
    //             const msalInstance = this.getMsalInstance(this.msalConfig);

    //             if (req.session.tokenCache) {
    //                 msalInstance.getTokenCache().deserialize(req.session.tokenCache);
    //             }

    //             const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);
    //             console.log("****************Acquired Token****************");
    //             console.log(tokenResponse);
    //             console.log("******************END********************");
    //             const tokenCache = msalInstance.getTokenCache().serialize();
    //             // req.session.tokenCache = msalInstance.getTokenCache().serialize();
    //             // req.session.idToken = tokenResponse.idToken;
    //             // req.session.account = tokenResponse.account;
    //             // req.session.isAuthenticated = true;

    //             const newUserToken = new MS365User({
    //                 userId: tokenResponse.account.homeAccountId, 
    //                 tokenCache,  
    //                 account:tokenResponse.account
    //             });
    //             newUserToken.save();

    //             const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));
    //             res.redirect(state.successRedirect);
    //         } catch (error) {
    //             req.session.destroy(() => {
    //                 console.log('1000');
    //                 res.redirect('/api/ms365/signin');
    //             });
    //         }
    //     }
    // }

    handleRedirect(options = {}) {
        return async (req, res, next) => {
            if (!req.body || !req.body.state) {
                return next(new Error('Error: response not found'));
            }

            try {
                const authCodeRequest = {
                    ...req.session.authCodeRequest,
                    code: req.body.code,
                    codeVerifier: req.session.pkceCodes.verifier,
                };
                const msalInstance = this.getMsalInstance(this.msalConfig);

                let userToken = await MS365Tokens.findOne({ 'account.tenantId': req.params.workspaceId });
                if (userToken) {
                    msalInstance.getTokenCache().deserialize(userToken.tokenCache);
                }

                const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest);
                console.log("****************Token Response****************");
                console.log(tokenResponse);
                console.log("******************************************");
                // Update or create token in the database
                if (userToken) {
                    userToken.tokenCache = msalInstance.getTokenCache().serialize();
                    // userToken.idToken = tokenResponse.idToken;
                    userToken.accessToken = tokenResponse.accessToken;
                    userToken.account = tokenResponse.account;
                    await userToken.save();
                } else {
                    userToken = await MS365Tokens.findOne({ 'account.tenantId': tokenResponse.account.tenantId });
                    if (userToken) {
                        userToken.tokenCache = msalInstance.getTokenCache().serialize();
                        // userToken.idToken = tokenResponse.idToken;
                        userToken.accessToken = tokenResponse.accessToken;
                        userToken.account = tokenResponse.account;
                        await userToken.save();
                    } else {
                        const newUserToken = new MS365Tokens({
                            userId: tokenResponse.account.localAccountId,
                            tokenCache: msalInstance.getTokenCache().serialize(),
                            accessToken: tokenResponse.accessToken,
                            account: tokenResponse.account,
                        });
                        await newUserToken.save();
                    }
                }
                await this.addOrUpdateWorkspace(tokenResponse.accessToken, tokenResponse.account);

                const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));
                res.redirect(state.successRedirect);
            } catch (error) {
                res.redirect('/api/ms365/signin');
            }
        }
    }


    logout(options = {}) {
        return (req, res, next) => {

            /**
             * Construct a logout URI and redirect the user to end the
             * session with Azure AD. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
             */
            let logoutUri = `${this.msalConfig.auth.authority}/oauth2/v2.0/`;

            if (options.postLogoutRedirectUri) {
                logoutUri += `logout?post_logout_redirect_uri=${options.postLogoutRedirectUri}`;
            }

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        }
    }

    /**
     * Instantiates a new MSAL ConfidentialClientApplication object
     * @param msalConfig: MSAL Node Configuration object 
     * @returns 
     */
    getMsalInstance(msalConfig) {
        return new msal.ConfidentialClientApplication(msalConfig);
    }


    /**
     * Prepares the auth code request parameters and initiates the first leg of auth code flow
     * @param req: Express request object
     * @param res: Express response object
     * @param next: Express next function
     * @param authCodeUrlRequestParams: parameters for requesting an auth code url
     * @param authCodeRequestParams: parameters for requesting tokens using auth code
     */
    redirectToAuthCodeUrl(authCodeUrlRequestParams, authCodeRequestParams, msalInstance) {
        return async (req, res, next) => {
            // Generate PKCE Codes before starting the authorization flow
            const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

            // Set generated PKCE codes and method as session vars
            req.session.pkceCodes = {
                challengeMethod: 'S256',
                verifier: verifier,
                challenge: challenge,
            };
            /**
             * By manipulating the request objects below before each request, we can obtain
             * auth artifacts with desired claims. For more information, visit:
             * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
             * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
             **/
            req.session.authCodeUrlRequest = {
                ...authCodeUrlRequestParams,
                responseMode: msal.ResponseMode.FORM_POST, // recommended for confidential clients
                codeChallenge: req.session.pkceCodes.challenge,
                codeChallengeMethod: req.session.pkceCodes.challengeMethod,
            };

            req.session.authCodeRequest = {
                ...authCodeRequestParams,
                code: '',
            };
            console.log(555);
            try {
                const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
                console.log(666, authCodeUrlResponse);
                res.redirect(authCodeUrlResponse);
            } catch (error) {
                console.log(777);
                next(error);
            }
        };
    }

    /**
     * Retrieves cloud discovery metadata from the /discovery/instance endpoint
     * @returns 
     */
    async getCloudDiscoveryMetadata(authority) {
        const endpoint = 'https://login.microsoftonline.com/common/discovery/instance';

        try {
            const response = await axios.get(endpoint, {
                params: {
                    'api-version': '1.1',
                    'authorization_endpoint': `${authority}/oauth2/v2.0/authorize`
                }
            });

            return await response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Retrieves oidc metadata from the openid endpoint
     * @returns
     */
    async getAuthorityMetadata(authority) {
        const endpoint = `${authority}/v2.0/.well-known/openid-configuration`;

        try {
            const response = await axios.get(endpoint);
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }
}

const authProvider = new AuthProvider(msalConfig);

module.exports = authProvider;
