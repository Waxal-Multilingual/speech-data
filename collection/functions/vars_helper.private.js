const fs = require('fs');

exports.getVar = (varName) => {
    const varValue = JSON.parse(fs.readFileSync(Runtime.getAssets()["/vars.json"].path))[varName];
    if (!varValue) {
        throw(`Value ${varName} is required. Please make sure to set it in assets/vars.json`)
    }
    return JSON.parse(fs.readFileSync(Runtime.getAssets()["/vars.json"].path))[varName];
}
