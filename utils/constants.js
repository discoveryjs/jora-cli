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
    [TOKENS.LEFT_BRACE]: chalk.gray,
    [TOKENS.RIGHT_BRACE]: chalk.gray,
    [TOKENS.LEFT_BRACKET]: chalk.gray,
    [TOKENS.RIGHT_BRACKET]: chalk.gray,
    [TOKENS.COLON]: chalk.gray,
    [TOKENS.COMMA]: chalk.gray,
    [TOKENS.STRING]: chalk.green,
    [TOKENS.NUMBER]: chalk.blue,
    [TOKENS.TRUE]: chalk.blue,
    [TOKENS.FALSE]: chalk.blue,
    [TOKENS.NULL]: chalk.bold
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
