const {backOff} = require("exponential-backoff");

/**
 * Sends a whatsapp message.
 * @param context Twilio client context.
 * @param recipient {string} Recipient phone number including country code.
 * @param text {string} Text context of message.
 * @param media {string} URL of audio or image media to be sent.
 * @return {Promise<void>}
 */
exports.sendPrompt = async (context, recipient, text, media) => {
  let varsPath = Runtime.getFunctions()['vars_helper'].path;
  let varsHelper = require(varsPath);

  let whatsappNumber = varsHelper.getVar("whatsapp-number");

  let request = {
    to: recipient.startsWith('whatsapp') ? recipient
        : `whatsapp:${recipient.startsWith("+") ? recipient : "+" + recipient}`,
    from: `whatsapp:${whatsappNumber}`,
    body: text,
    mediaUrl: media,
  };
  console.log(request);
  await backOff(() => context.getTwilioClient().messages.create(request));
}