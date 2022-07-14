let promptPath = Runtime.getFunctions()['messaging/send_prompt'].path;
let promptHelper = require(promptPath);

let varsPath = Runtime.getFunctions()['vars_helper'].path;
let varsHelper = require(varsPath);

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
        let audio = varsHelper.getVar("consent-audio");
        await promptHelper.sendPrompt(context, participantPhone, "", audio);
      }
      if (status === "Prompted") {
        // Expect a response for prompted users.
        let lastPrompt = participant["Last Prompt"];
        await handlePromptResponse(
            context, lastPrompt, event['MediaUrl0'], participant);
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
 * @param {string} mediaUrl the URL of the media contained in the participant's message.
 * @param {object} participant the current participant.
 * @returns
 */
async function handlePromptResponse(context, lastPrompt, mediaUrl,
    participant) {
  // Notify the user if they send a message that doesn't contain audio.
  if (!mediaUrl) {
    let audio = varsHelper.getVar("voice-note-required-audio");
    console.log("User did not include voice note");
    await promptHelper.sendPrompt(context, participant["Phone"], "", audio);
    return;
  }
  let uploadPath = Runtime.getFunctions()['upload_voice'].path;
  let uploadHelper = require(uploadPath);
  let proceed = await uploadHelper.uploadVoice(
      context, lastPrompt, mediaUrl, participant);
  if (proceed) {
    // Send next prompt.
    console.log("User not yet done. Sending next prompt");
    await handleSendPrompt(context, participant);
  } else {
    console.log("User has completed all prompts");
  }
}

/**
 * Handles the case where the user is ready for the next prompt.
 * @param {object} context contains Twilio client context.
 * @param {object} participant the current participant.
 */
async function handleSendPrompt(context, participant) {
  let fetchPath = Runtime.getFunctions()['prompt_fetch'].path;
  let fetchHelper = require(fetchPath);
  let response = await fetchHelper.getNextPrompt(participant['Key']);
  let prompt = response['prompt'];
  let position = response['position'];

  let positionString = `${position}/${participant["Questions"]}`;

  console.log(`Sending prompt image ${prompt['Image']}`);
  await promptHelper.sendPrompt(
      context, participant["Phone"], positionString, prompt['Image']);
  console.log(`Done sending prompt image ${prompt['Image']}`);

  participant["Status"] = "Prompted";
  participant["Last Prompt"] = prompt["Key"];

  console.log(`Setting participant status to "Prompted"`);
  await participant.save();
  console.log(`Done setting participant status to "Prompted"`);
}

