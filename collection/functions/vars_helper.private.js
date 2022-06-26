const fs = require('fs');

/**
 * Fetches variable values from {@link assets/vars.private.json}
 * @param varName {string} name of the var to be fetched.
 * @return {string} value of the requested variable.
 */
exports.getVar = (varName) => {
  const varValue = JSON.parse(
      fs.readFileSync(
          Runtime.getAssets()["/vars.json"].path).toString())[varName];
  return JSON.parse(
      fs.readFileSync(
          Runtime.getAssets()["/vars.json"].path).toString())[varName];
}
