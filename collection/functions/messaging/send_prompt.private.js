exports.sendPrompt = async (context, recipient, text, media) => {
    let varsPath = Runtime.getFunctions()['vars_helper'].path;
    let varsHelper = require(varsPath);

    let whatsappNumber = varsHelper.getVar("whatsapp-number");

    let request = {
        to: recipient.startsWith('whatsapp') ? recipient : `whatsapp:${recipient.startsWith("+") ? recipient : "+" + recipient}`,
        from: `whatsapp:${whatsappNumber}`,
        body: text,
        mediaUrl: media,
    };
    console.log(request);
    await context.getTwilioClient().messages.create(request);
}