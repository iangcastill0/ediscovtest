import { BoxClient } from 'box-typescript-sdk-gen';
import { getTokenGenerator } from 'box-typescript-sdk-gen/internal';

// Load from your config (like your existing `box-config.json`)
import boxConfig from '../config/box-config.json';

// Build token generator for JWT App Auth
const tokenGenerator = getTokenGenerator({
  clientId: boxConfig.boxAppSettings.clientID,
  clientSecret: boxConfig.boxAppSettings.clientSecret,
  jwtPrivateKey: boxConfig.boxAppSettings.appAuth.privateKey.replace(/\\n/g, '\n'),
  jwtPrivateKeyPassphrase: boxConfig.boxAppSettings.appAuth.passphrase,
  jwtKeyId: boxConfig.boxAppSettings.appAuth.keyId,
  enterpriseId: boxConfig.enterpriseID,
});

// Build client
export const boxClient = new BoxClient({
  tokenGenerator,
});
