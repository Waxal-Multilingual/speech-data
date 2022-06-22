const {google} = require('googleapis');
const fs = require('fs');

/**
 * Loads service account private key.
 * @returns a private Key suitable for calling Google APIs.
 */
exports.loadPrivateKey = () => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
          Runtime.getAssets()["/service_account_key.json"].path;
  return JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf-8'));
};

/**
 * Authorizes Google APIs for calls to GCP.
 */
exports.authorizeGoogleApis = async() =>  {
  return new Promise((resolve, reject) => {
    let privateKey = exports.loadPrivateKey();

    // Configure a JWT auth client
    let jwtClient = new google.auth.JWT(
          privateKey.client_email,
          null,
          privateKey.private_key,
          ['https://www.googleapis.com/auth/spreadsheets']);
    // authenticate request
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("Successfully authorized!");
        resolve(jwtClient);
      }
    });
  });
};
