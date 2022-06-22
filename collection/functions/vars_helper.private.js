const fs = require('fs');

exports.getVar = (varName) => {
    return JSON.parse(fs.readFileSync(Runtime.getAssets()["/vars.json"].path))[varName];
}
