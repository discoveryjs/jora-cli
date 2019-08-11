const tokenize = require('./tokenize');
const {
    SUPPORTED,
    TOKEN_COLORS,
    TOKENS: {
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
    let result = '';

    const tokens = markObjectKeys(tokenize(input));

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (typeof TOKEN_COLORS[token.type] === 'function') {
            result += TOKEN_COLORS[token.type](token.value);
        } else {
            result += token.value;
        }
    }

    return result;
};

module.exports.supported = SUPPORTED;
