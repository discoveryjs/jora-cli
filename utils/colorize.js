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

module.exports = (input) => {
    let result = '';

    const tokens = tokenize(input);

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (TOKEN_COLORS[token.type]) {
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
            result += TOKEN_COLORS[token.type](token.value);
        } else {
            result += token.value;
        }
    }


    return result;
};
