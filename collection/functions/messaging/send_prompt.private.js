exports.sendPrompt = async (context, recipient, text, media) => {
    let request = {
        to: recipient.startsWith('whatsapp') ? recipient : `whatsapp:${recipient.startsWith("+") ? recipient : "+" + recipient}`,
        from: 'whatsapp:+14155238886',
        body: text,
        mediaUrl: media,
    };
    console.log(request);
    await context.getTwilioClient().messages.create(request);
}