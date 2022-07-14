const {GoogleSpreadsheet} = require('google-spreadsheet');
const {backOff} = require("exponential-backoff");

// Map of spreadsheets to their key in {@link vars.private.json}
exports.sheetMap = {
  "prompt-sheet": "Prompt",
  "participant-sheet": "Participant",
  "response-sheet": "Response",
  "transcription-sheet": "Transcription"
}

/**
 * Returns a reference to a Google Sheets spreadsheet object.
 * @param {string} sheet the key of the sheet required.
 * @returns GoogleSpreadsheet object for the given sheet.
 */
async function getSheet(sheet) {
  let varsPath = Runtime.getFunctions()['vars_helper'].path;
  let varsHelper = require(varsPath);

  let document = varsHelper.getVar(sheet);

  let authPath = Runtime.getFunctions()['google_auth_helper'].path;
  let authHelper = require(authPath);
  await authHelper.authorizeGoogleApis();

  const doc = new GoogleSpreadsheet(document);

  await backOff(() => doc.useServiceAccountAuth(authHelper.loadPrivateKey()));

  console.log(
      `Fetching ${exports.sheetMap[sheet]} sheet with ID ${doc.spreadsheetId}`);
  await doc.loadInfo();
  console.log(
      `Done fetching ${exports.sheetMap[sheet]} sheet with ID ${doc.spreadsheetId}`);

  return doc.sheetsByTitle[exports.sheetMap[sheet]];
}

/**
 * Fetch the Prompts spreadsheet.
 */
exports.getPromptSheet = async () => {
  return getSheet("prompt-sheet");
}

/**
 * Fetch the Responses spreadsheet.
 */
exports.getResponseSheet = async () => {
  return getSheet("response-sheet");
}

/**
 * Fetch the Participants spreadsheet.
 */
exports.getParticipantSheet = async () => {
  return getSheet("participant-sheet");
}

/**
 * Fetch the Transcription spreadsheet.
 */
exports.getTranscriptionSheet = async () => {
  return getSheet("transcription-sheet");
}