const { TOKENS, STYLE_TRANSITION } = require('../utils/constants');

function style(...args) {
    let result = '';
    let prevType = TOKENS.DEFAULT;

    for (let i = 0; i < args.length; i += 2) {
        result += STYLE_TRANSITION[prevType][TOKENS[args[i]]];
        result += args[i + 1];
        prevType = TOKENS[args[i]];
    }

    return result + STYLE_TRANSITION[prevType][TOKENS.DEFAULT];
}

module.exports = {
    style
};
