const {
    LEFT_BRACE,
    RIGHT_BRACE,
    LEFT_BRACKET,
    RIGHT_BRACKET,
    STRING,
    NUMBER,
    NULL,
    FALSE,
    TRUE
} = require('../utils/constants').TOKENS;
const { TOKEN_COLORS } = require('../utils/constants');
const ansiRegex = require('ansi-regex');

module.exports = {
    STRING: TOKEN_COLORS[STRING](' ').match(ansiRegex()),
    NUMBER: TOKEN_COLORS[NUMBER](' ').match(ansiRegex()),
    EMPTY_ARRAY: [...TOKEN_COLORS[LEFT_BRACKET](' ').match(ansiRegex()) || [], ...TOKEN_COLORS[RIGHT_BRACKET](' ').match(ansiRegex()) || []],
    EMPTY_OBJECT: [...TOKEN_COLORS[LEFT_BRACE](' ').match(ansiRegex()) || [], ...TOKEN_COLORS[RIGHT_BRACE](' ').match(ansiRegex()) || []],
    NULL: TOKEN_COLORS[NULL](' ').match(ansiRegex()),
    FALSE: TOKEN_COLORS[FALSE](' ').match(ansiRegex()),
    TRUE: TOKEN_COLORS[TRUE](' ').match(ansiRegex())
};
