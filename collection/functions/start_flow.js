let promptHelper = require(
    Runtime.getFunctions()['messaging/send_prompt'].path);
let varsHelper = require(Runtime.getFunctions()['vars_helper'].path);
let transcriptionHelper = require(
    Runtime.getFunctions()['transcription'].path);

/**
 * Main entrypoint for Waxal workflow.
 * @param {object} context contains Twilio client context.
 * @param {object} event contains information about the user-triggered event.
 * @param callback event callback handler.
 */
exports.handler = async (context, event, callback) => {
  // Strip non-numeric characters from phone number.
  let participantPhone = event["From"].replace(/^\D+/g, '');
  try {
    let path = Runtime.getFunctions()['google_sheets_helper'].path;
    let helper = require(path);

    let participantSheet = await helper.getParticipantSheet();
    let participantRows = await participantSheet.getRows();
    let participant = participantRows.find(
        row => row["Phone"] === participantPhone);

    if (participant) {
      let status = participant["Status"];
      if (status === "Consented") {
        // Send consent audio for first timers.
        console.log("Sending consent message");
        if (participant['Type'] === 'Transcriber') {
          let text = varsHelper.getVar("transcription-instructions");
          await promptHelper.sendPrompt(context, participantPhone, text);
        } else {
          let audio = varsHelper.getVar("consent-audio");
          await promptHelper.sendPrompt(context, participantPhone, "", audio);
        }
      }
      if (status === "Prompted") {
        // Expect a response for prompted users.
        let lastPrompt = participant["Last Prompt"];
        await handlePromptResponse(
            context, lastPrompt, event['Body'], event['MediaUrl0'],
            participant);
      } else if (status === "Ready" || status === "Consented") {
        // Send the first image for consented and ready users.
        await handleSendPrompt(context, participant);
      }
      // If status is completed, send the completion audio.
      // This can either be the state at entry or after {@link handlePromptResponse}.
      if (participant["Status"] === "Completed") {
        // Send the closing message for completed users.
        let surveyCompletedAudio = varsHelper.getVar("survey-completed-audio")
        await promptHelper.sendPrompt(
            context, participant["Phone"], "", surveyCompletedAudio);
      }

    } else {
      // Notify the user that they need to register first.
      console.log('Participant not registered')
      let audio = varsHelper.getVar("not-registered-audio");
      await promptHelper.sendPrompt(context, participantPhone, "", audio);
    }
  } catch (e) {
    console.log(e);
    await promptHelper.sendPrompt(context, participantPhone, "",
        varsHelper.getVar("error-message-audio"));
  }
  callback(null, event);
};

/**
 * Handles the case where the user has been prompted and is expected to send a response.
 * @param {object} context contains Twilio client context.
 * @param {string} lastPrompt the ID of the last prompt the participant received.
 * @param {string} body Text content of participant message.
 * @param {string} mediaUrl the URL of the media contained in the participant's message.
 * @param {object} participant the current participant.
 * @returns
 */
async function handlePromptResponse(context, lastPrompt, body, mediaUrl,
    participant) {
  if (participant['Type'] === "Transcriber") {
    // Notify the user if they send a message that doesn't contain text.
    if (!body) {
      let msg = varsHelper.getVar("transcription-instructions");
      console.log("User did not include transcription text");
      await promptHelper.sendPrompt(context, participant["Phone"], msg);
      return;
    }
    await transcriptionHelper.addTranscription(
        participant["Key"],
        lastPrompt, body);
  } else {
    // Notify the user if they send a message that doesn't contain audio.
    if (!mediaUrl) {
      let audio = varsHelper.getVar("voice-note-required-audio");
      console.log("User did not include voice note");
      await promptHelper.sendPrompt(context, participant["Phone"], "", audio);
      return;
    }
    let uploadPath = Runtime.getFunctions()['upload_voice'].path;
    let uploadHelper = require(uploadPath);
    await uploadHelper.uploadVoice(
        context, lastPrompt, mediaUrl, participant);
  }
  const proceed = await updateParticipantAfterResponse(participant);
  if (proceed) {
    // Send next prompt.
    console.log("User not yet done. Sending next prompt");
    await handleSendPrompt(context, participant);
  } else {
    console.log("User has completed all prompts");
  }
}

async function updateParticipantAfterResponse(participant) {
  participant["Responses"] = parseInt(participant["Responses"]) + 1;
  // Mark completed if this response is the final one, else mark ready.
  if (parseInt(participant["Responses"]) >= parseInt(
      participant["Questions"])) {
    participant["Status"] = "Completed";
  } else {
    participant["Status"] = "Ready";
  }
  console.log(`Setting participant status to ${participant["Status"]}`);
  await participant.save();
  return participant["Status"] !== "Completed";
}

/**
 * Handles the case where the user is ready for the next prompt.
 * @param {object} context contains Twilio client context.
 * @param {object} participant the current participant.
 */
async function handleSendPrompt(context, participant) {
  let promptFetchHelper = require(Runtime.getFunctions()['prompt_fetch'].path);

  const isTranscription = participant['Type'] === 'Transcriber';

  let fetchedPrompt = isTranscription ?
      await transcriptionHelper.getNextPrompt(participant['Key'],
          participant["Language"])
      : await promptFetchHelper.getNextPrompt(participant['Key']);

  let prompt = fetchedPrompt['prompt'];
  let position = fetchedPrompt['position'];

  let positionString = `${position}/${participant["Questions"]}`;

  const mediaType = isTranscription ? 'audio' : 'image';

  console.log(`Sending prompt ${mediaType} ${prompt}`);
  await promptHelper.sendPrompt(
      context, participant["Phone"], positionString, prompt);
  console.log(`Done sending prompt ${mediaType} ${prompt}`);

  participant["Status"] = "Prompted";
  participant["Last Prompt"] = fetchedPrompt["key"];

  console.log(`Setting participant status to "Prompted"`);
  await participant.save();
  console.log(`Done setting participant status to "Prompted"`);
}

