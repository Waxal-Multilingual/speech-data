// Requiring module
const assert = require('assert');
const fs = require('fs');

const authHelper = require("../functions/google_auth_helper.private");
const sheetsHelper = require("../functions/google_sheets_helper.private");
const {ServiceUsageClient} = require('@google-cloud/service-usage').v1;
const {google} = require('googleapis');
const url = require("url");

const service_account_key_relative_path = "./assets/service_account_key.private.json";

function extractVars() {
  let varsPath = "./assets/vars.private.json";
  assert(fs.existsSync(varsPath),
      "Please copy assets/vars.private.json to " + "assets/vars.private.json");
  return JSON.parse(fs.readFileSync(varsPath).toString());
}

function getServiceAccountKey() {
  return JSON.parse(
      fs.readFileSync(service_account_key_relative_path).toString());
}

async function checkSheet(vars, key, sheetName) {
  try {
    const jwt = await authHelper.authorizeGoogleApis(
        service_account_key_relative_path);

    const drive = google.drive({version: 'v3', auth: jwt});

    const permissions = await drive.files.get(
        {fileId: vars[sheetName], fields: '*'});

    assert(permissions.data.capabilities.canEdit,
        `Please make sure ${key["client_email"]} is a writer of file 
        ${vars[sheetName]}`)

    const sheets = google.sheets({version: 'v4', "auth": jwt});
    const result = await sheets.spreadsheets.get({
      spreadsheetId: vars[sheetName],
    });
    assert(result.data.sheets[0].properties.title
        === sheetsHelper.sheetMap[sheetName], `Please make sure the first sheet in the file is named 
        ${sheetsHelper.sheetMap[sheetName]}`);
  } catch (e) {
    console.error(e);
    assert.fail(`Please make sure sheet 
      ${vars[sheetName]} 
          is editable by robot account ${key["client_email"]}`)
  }
}

describe("Startup tests", () => {
  it("Twilio env keys are set", () => {
    const envVars = require('dotenv').config();
    assert(envVars.parsed,
        "Please create a file called .env in the 'collection' directory");
    assert(envVars.parsed.ACCOUNT_SID.length > 0,
        "Please make sure to set ACCOUNT_SID in your .env file. "
        + "Visit the Twilio console to find the value");
    assert(envVars.parsed.AUTH_TOKEN.length > 0,
        "Please make sure to set AUTH_TOKEN in your .env file. "
        + "Visit the Twilio console to find the value");
  });
  it("Waxal key values are set", () => {
    const vars = extractVars();
    for (const key in vars) {
      assert(vars[key].length !== 0, `key ${key} is required. For more information, please refer to 
          documentation at https://github.com/Waxal-Multilingual/speech-data/tree/main/collection#set-up-variables`)
    }
  });
  it("Service account private key set", () => {
    const key = fs.readFileSync(service_account_key_relative_path);
    assert(key.length !== 0,
        "Please set your service account key for writing to a cloud storage bucket");
  });
  it("Sheets API enabled", async () => {
    await authHelper.authorizeGoogleApis(service_account_key_relative_path);
    const usageClient = new ServiceUsageClient();

    const key = getServiceAccountKey();

    const services = await usageClient.listServices(
        {parent: `projects/${key["project_id"]}`, filter: 'state:ENABLED'});
    const sheetsApi = services[0].find(
        s => s.name.includes("sheets.googleapis.com"));
    assert(sheetsApi.state === "ENABLED",
        "Please make sure the Sheets API is enabled in your GCP project:"
        + " https://console.cloud.google.com/apis/api/sheets.googleapis.com/overview");
  }).timeout(150000);

  it("Sheets accessible to robot", async () => {
    const vars = extractVars();
    const key = getServiceAccountKey();

    await checkSheet(vars, key, "participant-sheet");
    await checkSheet(vars, key, "response-sheet");
    await checkSheet(vars, key, "prompt-sheet");
    await checkSheet(vars, key, "transcription-sheet");
  }).timeout(150000);

  it("Audio files accessible to twilio", async () => {
    const vars = extractVars();
    const audioVars = Object.keys(vars).filter(key => key.endsWith("-audio"));

    const jwt = await authHelper.authorizeGoogleApis(
        service_account_key_relative_path);
    for (const audioVar of audioVars) {
      const drive = google.drive({version: 'v3', auth: jwt});

      let fileId = url.parse(vars[audioVar], true).query["id"];
      const permissions = await drive.files.get({
        fileId: fileId, fields: '*'
      });

      assert(permissions.data.capabilities.canDownload,
          `Please make sure your download URL for ${audioVar}
            is publicly accessible: ${vars[audioVar]}`);

    }
  }).timeout(150000);
});
