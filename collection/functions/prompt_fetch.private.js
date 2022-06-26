/**
 * Fetches a random, unseen prompt for the given participant.
 * @param {string} participantKey ID of the relevant participant.
 * @returns An object with a prompt and the number of seen prompts including the fetched one.
 */
exports.getNextPrompt = async (participantKey) => {
  let path = Runtime.getFunctions()['google_sheets_helper'].path;
  let helper = require(path);

  // Identify used prompts.
  let responseSheet = await helper.getResponseSheet();
  let responseRows = await responseSheet.getRows();
  let usedPrompts = new Set(responseRows
      .filter(row => row["Participant"] === participantKey)
      .map(resp => resp["Prompt"]));

  // Find unused prompts.
  let promptSheet = await helper.getPromptSheet();
  let prompts = (await promptSheet.getRows()).filter(
      row => !usedPrompts.has(row));

  // Pick a random index among the unused prompts.
  const random = Math.floor(Math.random() * prompts.length);
  return {"prompt": prompts[random], "position": usedPrompts.size + 1};
}
