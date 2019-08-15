const chalk = require('chalk');
const { stdout: { hasBasic: SUPPORTED } } = require('supports-color');

const TOKEN_TYPE_COUNT = 14;
const TOKENS = {
    DEFAULT: 0,         // special for start/end
    LEFT_BRACE: 1,      // {
    RIGHT_BRACE: 2,     // }
    LEFT_BRACKET: 3,    // [
    RIGHT_BRACKET: 4,   // ]
    COLON: 5,           // :
    COMMA: 6,           // ,
    STRING: 7,          //
    STRING_KEY: 8,      //
    NUMBER: 9,          //
    TRUE: 10,           // true
    FALSE: 11,          // false
    NULL: 12,           // null
    WHITESPACE: 13      //
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

const STYLE_TRANSITION = new Array(TOKEN_TYPE_COUNT * TOKEN_TYPE_COUNT);
const STYLE = {
    [TOKENS.LEFT_BRACE]: chalk.gray,
    [TOKENS.RIGHT_BRACE]: chalk.gray,
    [TOKENS.LEFT_BRACKET]: chalk.gray,
    [TOKENS.RIGHT_BRACKET]: chalk.gray,
    [TOKENS.COLON]: chalk.gray,
    [TOKENS.COMMA]: chalk.gray,
    [TOKENS.STRING]: chalk.green,
    [TOKENS.NUMBER]: chalk.cyan,
    [TOKENS.TRUE]: chalk.cyan,
    [TOKENS.FALSE]: chalk.cyan,
    [TOKENS.NULL]: chalk.bold
};

for (let i = 0; i < TOKEN_TYPE_COUNT; i++) {
    const fromStyles = (STYLE[i] || {})._styles || [];
    const fromStyleMap = fromStyles.reduce((map, style) => map.set(style.close, style.open), new Map());

    for (let j = 0; j < TOKEN_TYPE_COUNT; j++) {
        const toStyles = ((j && STYLE[j]) || {})._styles || []; // j && STYLE[j] to reset styles on end
        const toStyleMap = toStyles.reduce((map, style) => map.set(style.close, style.open), new Map());
        let styleTransitionCodes = '';

        fromStyleMap.forEach((fromValue, key) => {
            if (toStyleMap.has(key)) {
                const toValue = toStyleMap.get(key);

                if (toValue !== fromValue) {
                    styleTransitionCodes += toValue;
                }
            } else {
                styleTransitionCodes += key;
            }
        });

        toStyleMap.forEach((toValue, key) => {
            if (!fromStyleMap.has(key)) {
                styleTransitionCodes += toValue;
            }
        });

        STYLE_TRANSITION[i * TOKEN_TYPE_COUNT + j] = styleTransitionCodes;
    }
}

module.exports = {
    SUPPORTED,
    TOKENS,
    TOKEN_TYPE_COUNT,
    STYLE,
    STYLE_TRANSITION,
    PUNCTUATOR_TOKENS_MAP,
    KEYWORD_TOKENS_MAP
};
