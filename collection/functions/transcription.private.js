const varsHelper = require(Runtime.getFunctions()['vars_helper'].path);
const sheetsHelper = require(
    Runtime.getFunctions()['google_sheets_helper'].path);
const uuid = require("uuid");

/**
 * Add a new transcription row.
 * @param participantKey ID of participant transcribing.
 * @param responseKey ID of response being transcribed.
 * @param text Full text of transcription.
 * @return {Promise<void>}
 */
exports.addTranscription = async (participantKey, responseKey,
    text) => {
  console.log('Adding transcription to sheet');
  let sheet = await sheetsHelper.getTranscriptionSheet();

  // Add transcription row.
  console.log("Adding transcription row");
  await sheet.addRow({
    'Key': uuid.v4(),
    'Transcriber': participantKey,
    'Target Language': varsHelper.getVar("transcription-language"),
    'Text': text,
    'Created At': new Date().toUTCString(),
    'Status': 'New',
    'Response': responseKey
  });
}

/**
 * Fetch the next available prompt, filtering out any that have already been
 * responded to or that have reached their limit of transcriptions.
 * @param participantKey ID of participant to be prompted.
 * @param language The language transcriptions are expected in.
 * @return {Promise<{position: number, prompt: *, key: *}>}
 */
exports.getNextPrompt = async (participantKey, language) => {
  // Identify used prompts.
  let transcriptionSheet = await sheetsHelper.getTranscriptionSheet();
  let transcriptionRows = await transcriptionSheet.getRows();
  let usedResponses = new Set(transcriptionRows
      .filter(row => row["Transcriber"] === participantKey)
      .map(resp => resp["Response"]));

  // Find unused prompts.
  let responseSheet = await sheetsHelper.getResponseSheet();
  let unfilteredResponses = await responseSheet.getRows();

  let responses = unfilteredResponses.filter(
      row => {
        const transcriptionsForResponse = transcriptionRows.filter(
            t => t["Response"] === row["Key"] && t["Language"] === language);
        return transcriptionsForResponse.length < parseInt(varsHelper.getVar(
                "transcriptions-per-response"))
            && !usedResponses.has(row['Key'])
      });

  if (responses.length === 0) {
    throw "All available responses have been transcribed the max number of times. Please add more";
  }

  // Pick a random index among the unused prompts.
  const random = Math.floor(Math.random() * responses.length);
  return {
    "prompt": {
      "media": responses[random]['Audio']
    },
    "key": responses[random]['Key'],
    "position": usedResponses.size + 1
  };
}