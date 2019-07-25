const chalk = require('chalk');

const TOKENS = {
    LEFT_BRACE: 0,      // {
    RIGHT_BRACE: 1,     // }
    LEFT_BRACKET: 2,    // [
    RIGHT_BRACKET: 3,   // ]
    COLON: 4,           // :
    COMMA: 5,           // ,
    STRING: 6,          //
    STRING_KEY: 7,      //
    NUMBER: 8,          //
    TRUE: 9,            // true
    FALSE: 10,          // false
    NULL: 11,           // null
    WHITESPACE: 12      //
};

const TOKEN_COLORS = {
    [TOKENS.LEFT_BRACE]: chalk.bold.white,
    [TOKENS.RIGHT_BRACE]: chalk.bold.white,
    [TOKENS.LEFT_BRACKET]: chalk.bold.white,
    [TOKENS.RIGHT_BRACKET]: chalk.bold.white,
    [TOKENS.COLON]: chalk.bold.white,
    [TOKENS.COMMA]: chalk.bold.white,
    [TOKENS.STRING]: chalk.green,
    [TOKENS.STRING_KEY]: chalk.green.yellow,
    [TOKENS.NUMBER]: chalk.blue,
    [TOKENS.TRUE]: chalk.cyan,
    [TOKENS.FALSE]: chalk.cyan,
    [TOKENS.NULL]: chalk.red
};

const PUNCTUATOR_TOKENS_MAP = {
    '{': TOKENS.LEFT_BRACE,
    '}': TOKENS.RIGHT_BRACE,
    '[': TOKENS.LEFT_BRACKET,
    ']': TOKENS.RIGHT_BRACKET,
    ':': TOKENS.COLON,
    ',': TOKENS.COMMA
};

const KEYWORD_TOKENS_MAP = {
    'true': TOKENS.TRUE,
    'false': TOKENS.FALSE,
    'null': TOKENS.NULL
};

module.exports = {
    TOKENS,
    TOKEN_COLORS,
    PUNCTUATOR_TOKENS_MAP,
    KEYWORD_TOKENS_MAP
};
