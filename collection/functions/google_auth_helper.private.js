const {google} = require('googleapis');
const fs = require('fs');

/**
 * Loads service account private key.
 * @param {string} [serviceAccountKeyPath] [Test-only] relative path of service account key.
 * @returns a private Key suitable for calling Google APIs.
 */
exports.loadPrivateKey = (serviceAccountKeyPath) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountKeyPath
      || Runtime.getAssets()["/service_account_key.json"].path;
  return JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
};

/**
 * Authorizes Google APIs for calls to GCP.
 * @param {string} [serviceAccountKeyPath] [Test-only] relative path of service account key.
 * @return {Credentials} JWT Auth token.
 */
exports.authorizeGoogleApis = async (serviceAccountKeyPath) => {
  return new Promise((resolve, reject) => {
    let privateKey = exports.loadPrivateKey(serviceAccountKeyPath);

    // Configure a JWT auth client
    let jwtClient = new google.auth.JWT(
        privateKey.client_email,
        null,
        privateKey.private_key,
        ['https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.metadata.readonly']);
    // authenticate request
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(jwtClient);
      }
    });
  });
};
