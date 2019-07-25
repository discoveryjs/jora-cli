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

const STRING_STATES = {
    _START_: 0,
    START_QUOTE_OR_CHAR: 1,
    ESCAPE: 2
};

const ESCAPES = {
    '"': 0,		// Quotation mask
    '\\': 1,	// Reverse solidus
    '/': 2,		// Solidus
    'b': 3,		// Backspace
    'f': 4,		// Form feed
    'n': 5,		// New line
    'r': 6,		// Carriage return
    't': 7,		// Horizontal tab
    'u': 8		// 4 hexadecimal digits
};

const NUMBER_STATES = {
    _START_: 0,
    MINUS: 1,
    ZERO: 2,
    DIGIT: 3,
    POINT: 4,
    DIGIT_FRACTION: 5,
    EXP: 6,
    EXP_DIGIT_OR_SIGN: 7
};


module.exports = {
    TOKENS,
    TOKEN_COLORS,
    PUNCTUATOR_TOKENS_MAP,
    KEYWORD_TOKENS_MAP,
    STRING_STATES,
    ESCAPES,
    NUMBER_STATES
};
