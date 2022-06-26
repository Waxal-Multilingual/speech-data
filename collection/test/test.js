// Requiring module
const assert = require('assert');
const fs = require('fs');

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
    let varsPath = "./assets/vars.private.json";
    assert(fs.existsSync(varsPath),
        "Please copy assets/vars.private.json to "
        + "assets/vars.private.json");
    const vars = JSON.parse(
        fs.readFileSync(varsPath).toString());
    for (const key in vars) {
      assert(vars[key].length !== 0,
          `key ${key} is required. For more information, please refer to 
          documentation at https://github.com/Waxal-Multilingual/
          speech-data/blob/main/collection/README.md`)
    }
  });
  it("Service account private key set", () => {
    const key = fs.readFileSync("./assets/service_account_key.private.json");
    assert(key.length !== 0,
        "Please set your service account key for writing to a cloud storage bucket");
  });
});
