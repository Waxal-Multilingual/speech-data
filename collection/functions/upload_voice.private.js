const {Storage} = require('@google-cloud/storage');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const {backOff} = require("exponential-backoff");
const got = require('got');
const mm = require('music-metadata');

const tmp_dir = require('os').tmpdir();
const PUBLIC_DIR = `${tmp_dir}/mms_images`;

// Create a local directory for staging audio files.
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(path.resolve(PUBLIC_DIR));
}

let varsPath = Runtime.getFunctions()['vars_helper'].path;
let varsHelper = require(varsPath);

let promptPath = Runtime.getFunctions()['messaging/send_prompt'].path;
let promptHelper = require(promptPath);

/**
 * Uploads audio file for voice note to GCP storage bucket.
 * @param {*} context Twilio client context.
 * @param {string} prompt ID of the prompt being responded to.
 * @param {string} mediaUrl URL of the audio sent by the user.
 * @param {object} participant ID of the responding participant.
 * @returns a bool indicating whether to continue sending prompts.
 */
exports.uploadVoice = async (context, prompt, mediaUrl, participant) => {
  const stream = got.stream(mediaUrl)
  let duration = await extractDuration(stream);

  let minLength = parseInt(varsHelper.getVar("min-audio-length-secs"));

  // Notify the user if the message duration is too short.
  if (duration < minLength) {
    let tooShortAudio = varsHelper.getVar("voice-note-too-short-audio");
    await promptHelper.sendPrompt(context, participant["Phone"], "",
        tooShortAudio);
    return false;
  }

  const participantKey = participant['Key'];
  console.log('Adding response: Uploading to storage');

  // Upload to GCP storage bucket.
  let bucket = varsHelper.getVar("storage-bucket");
  await uploadToDirectory(prompt, participantKey, mediaUrl, bucket);

  // Update Response and Participant spreadsheets.
  await addParticipantResponse(participantKey, participant, prompt, bucket,
      duration);

  return participant["Status"] !== "Completed";
};

/**
 * Uploads to directory in the storage bucket.
 * @param {string} prompt ID of the prompt being responded to.
 * @param {string} participantKey ID of the responding participant.
 * @param {string} mediaUrl URL of the audio file containing the response.
 * @param {string} bucketName GCP storage bucket being saved to.
 */
async function uploadToDirectory(prompt, participantKey, mediaUrl, bucketName) {
  const fullPath = path.resolve(`${PUBLIC_DIR}/${participantKey}`);
  const fileStream = fs.createWriteStream(fullPath);

  // First write to a local file.
  const response = await fetch(mediaUrl);
  response.body.pipe(fileStream);

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  // Upload to storage bucket/{prompt}/{participant}.
  await bucket.upload(fullPath, {
    destination: prompt + "/" + participantKey,
    gzip: true,
    metadata: {
      cacheControl: 'public, max-age=31536000'
    }
  });
}

/**
 * Update Response and Participant tables after uploading media.
 * @param {string} participantKey ID of the participant.
 * @param {object} participant Full participant object.
 * @param {string} prompt ID of the prompt being responded to.
 * @param {string} bucket GCP storage bucket name.
 * @param {number} duration Duration in seconds of the audio response.
 */
async function addParticipantResponse(
    participantKey, participant, prompt, bucket, duration) {
  const audioFile = `https://storage.googleapis.com/${bucket}/${prompt}/${participantKey}`;

  console.log('Updating sheets');
  let sheetsPath = Runtime.getFunctions()['google_sheets_helper'].path;
  let sheetsHelper = require(sheetsPath);
  let sheet = await sheetsHelper.getResponseSheet();

  // Add response row.
  await sheet.addRow({
    'Participant': participantKey,
    'Prompt': prompt,
    'Audio': audioFile,
    'Timestamp': new Date().toUTCString(),
    'Status': 'New',
    'Duration': duration,
    'Language': varsHelper.getVar("language"),
    'Response Date': new Date().toISOString().substring(0, 10)
  });

  participant["Responses"] = parseInt(participant["Responses"]) + 1;
  // Mark completed if this response is the final one, else mark ready.
  if (parseInt(participant["Responses"]) >= parseInt(
      participant["Questions"])) {
    participant["Status"] = "Completed";
  } else {
    participant["Status"] = "Ready";
  }
  await backOff(() => participant.save());
}

/**
 * Extracts duration from an audio stream.
 * @param {*} stream audio stream.
 * @returns Stream length in seconds.
 */
async function extractDuration(stream) {
  let duration = 0;
  try {
    const metadata = await mm.parseStream(stream);
    duration = metadata.format.duration;
  } catch (err) {
    console.log(err);
  }
  return duration;
}