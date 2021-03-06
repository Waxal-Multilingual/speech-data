// Requiring module
const assert = require('assert');
const fs = require('fs');

const authHelper = require("../functions/google_auth_helper.private");
const sheetsHelper = require("../functions/google_sheets_helper.private");
const {ServiceUsageClient} = require('@google-cloud/service-usage').v1;
const {google} = require('googleapis');
const url = require("url");

// Canonical sheets for testing.
const canonicalSheets = {
    "participant-sheet": "14wZIBMKUKySrvyw0xU4CmJpDUVtsUsS7DQxZBmaiBuA",
    "response-sheet": "1Zb5eifySYaQ9eDdmOC133bo1Ut8FgfzxNQZL4m9gjB8",
    "prompt-sheet": "1468gA4cFf74-YuH9cXMbWRcHpZFFfP3z27e_NyjB0Bk",
    "transcription-sheet": "1MKzliEHKdHNJ00pwaObyhhTOGP7rMJN8QJOnQxgCMxk",
}

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
    const jwt = await authHelper.authorizeGoogleApis(
        service_account_key_relative_path);

    const drive = google.drive({version: 'v3', auth: jwt});

    let permissions;
    try {
        permissions = await drive.files.get({fileId: vars[sheetName], fields: '*'});
    } catch (e) {
        assert(e.response.status !== 404,
            `Please make sure ${vars[sheetName]} with key ${sheetName} exists and is accessible to ${key["client_email"]}`);
        throw e;
    }

    assert(permissions.data.capabilities.canEdit,
        `Please make sure ${key["client_email"]} is a writer of file 
        ${vars[sheetName]} with key ${sheetName}`)

    const sheets = google.sheets({version: 'v4', "auth": jwt});
    const result = await sheets.spreadsheets.get({
        spreadsheetId: vars[sheetName],
    });
    assert(result.data.sheets[0].properties.title
        === sheetsHelper.sheetMap[sheetName], `Please make sure the first sheet in the file is named 
        ${sheetsHelper.sheetMap[sheetName]} and not ${result.data.sheets[0].properties.title}`);

    const canonicalHeadersResult = await sheets.spreadsheets.values.get({
        spreadsheetId: canonicalSheets[sheetName],
        range: `${sheetsHelper.sheetMap[sheetName]}!1:1`
    });

    const actualHeadersResult = await sheets.spreadsheets.values.get({
        spreadsheetId: vars[sheetName],
        range: `${sheetsHelper.sheetMap[sheetName]}!1:1`
    });

    const canonicalHeaders = new Set(canonicalHeadersResult.data.values[0]);
    const actualHeadersHeaders = new Set(actualHeadersResult.data.values[0]);

    canonicalHeaders.forEach(h => assert(actualHeadersHeaders.has(h), `Header "${h}" not found in ${sheetName} with ID ${vars[sheetName]}`));

}

async function apiCheck(apiName) {
    await authHelper.authorizeGoogleApis(service_account_key_relative_path);
    const usageClient = new ServiceUsageClient();

    const key = getServiceAccountKey();

    const services = await usageClient.listServices(
        {parent: `projects/${key["project_id"]}`, filter: 'state:ENABLED'});
    const api = services[0].find(s => s.name.includes(`${apiName}.googleapis.com`));
    assert(api.state === "ENABLED",
        `Please make sure the ${apiName} API is enabled in your GCP project:`
        + ` https://console.cloud.google.com/apis/api/${apiName}.googleapis.com/overview`);
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

    it("Drive API enabled", async () => {
        await apiCheck("drive");
    }).timeout(150000);

    it("Sheets API enabled", async () => {
        await apiCheck("sheets");
    }).timeout(150000);

    it("Sheets set up correctly", async () => {
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

    it("Storage bucket write-able by robot", async () => {
        const vars = extractVars();
        const {Storage} = require('@google-cloud/storage');
        const storage = new Storage();
        const bucket = storage.bucket(vars['storage-bucket']);
        const permissionResponse = await bucket.iam.testPermissions(["storage.objects.create"]);

        const key = getServiceAccountKey();
        assert(permissionResponse[0]["storage.objects.create"], `Please make sure storage bucket ${vars["storage-bucket"]} is write-able by robot account ${key["client_email"]}`);
    }).timeout(150000);
});
