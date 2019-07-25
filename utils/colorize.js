const {
    STRING,
    STRING_KEY,
    WHITESPACE,
    COLON,
    RIGHT_BRACE,
    RIGHT_BRACKET
} = require('./constants').TOKENS;
const { TOKEN_COLORS } = require('./constants');
const tokenize = require('./tokenize');

const markKeys = (tokens) => {
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (token.type === STRING) {
            for (let j = i + 1; j < tokens.length; j++) {
                if (tokens[j].type === WHITESPACE) {
                    continue;
                }
                if (tokens[j].type === COLON) {
                    token.type = STRING_KEY;
                    break;
                }
                if (
                    tokens[j].type === STRING ||
                    tokens[j].type === RIGHT_BRACE ||
                    tokens[j].type === RIGHT_BRACKET
                ) {
                    break;
                }
            }
        }
    }

    return tokens;
};

const colorize = (input) => {
    let result = '';

    const tokens = tokenize(input);
    const markedTokens = markKeys(tokens);

    for (let i = 0; i < markedTokens.length; i++) {
        let token = markedTokens[i];

        if (TOKEN_COLORS[token.type]) {
            result += TOKEN_COLORS[token.type](token.value);
        } else {
            result += token.value;
        }
    }

    return result;
};

module.exports = {
    markKeys,
    colorize
};
