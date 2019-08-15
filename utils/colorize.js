const tokenize = require('./tokenize');
const {
    SUPPORTED,
    STYLE_TRANSITION,
    TOKENS: {
        DEFAULT,
        STRING,
        STRING_KEY,
        WHITESPACE,
        COLON
    }
} = require('./constants');

const markObjectKeys = (tokens) => {
    for (let i = 0; i < tokens.length - 1; i++) {
        let token = tokens[i];

        if (token.type === STRING) {
            let nextTokenIdx = i + 1;

            if (tokens[nextTokenIdx].type === WHITESPACE) {
                nextTokenIdx++;
            }

            if (nextTokenIdx < tokens.length && tokens[nextTokenIdx].type === COLON) {
                token.type = STRING_KEY;
            }
        }
    }

    return tokens;
};

module.exports = (input) => {
    const tokens = markObjectKeys(tokenize(input));
    let prevType = DEFAULT;
    let result = '';

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const transitionCodes = STYLE_TRANSITION[prevType][token.type];

        if (transitionCodes) {
            result += transitionCodes;
        }

        result += token.value;
        prevType = token.type;
    }

    return result + STYLE_TRANSITION[prevType][DEFAULT]; // transition to DEFAULT -> reset styles
};

module.exports.supported = SUPPORTED;
