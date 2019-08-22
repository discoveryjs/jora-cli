const chalk = require('chalk');
const { stdout: { hasBasic: SUPPORTED } } = require('supports-color');

const TYPE = {
    DEFAULT: 0 << 1,            // special for start/end
    LEFT_BRACE: 1 << 1,         // {
    RIGHT_BRACE: 2 << 1,        // }
    LEFT_BRACKET: 3 << 1,       // [
    RIGHT_BRACKET: 4 << 1,      // ]
    COLON: 5 << 1,              // :
    COMMA: 6 << 1,              // ,
    STRING: 7 << 1,             //
    STRING_KEY: 8 << 1,         //
    STRING_KEY_CONTENT: 9 << 1, //
    NUMBER: 10 << 1,            //
    TRUE: 11 << 1,              // true
    FALSE: 12 << 1,             // false
    NULL: 13 << 1,              // null
    WHITESPACE: 14 << 1         //
};

const STYLE = {
    [TYPE.LEFT_BRACE]: chalk.gray,
    [TYPE.RIGHT_BRACE]: chalk.gray,
    [TYPE.LEFT_BRACKET]: chalk.gray,
    [TYPE.RIGHT_BRACKET]: chalk.gray,
    [TYPE.COLON]: chalk.gray,
    [TYPE.COMMA]: chalk.gray,
    [TYPE.STRING]: chalk.green,
    [TYPE.STRING_KEY]: chalk.gray,
    [TYPE.NUMBER]: chalk.cyan,
    [TYPE.TRUE]: chalk.cyan,
    [TYPE.FALSE]: chalk.cyan,
    [TYPE.NULL]: chalk.bold
};

const STYLE_TRANSITION = [];
const tokenTypes = Object.keys(TYPE);
const extractStyles = obj => (obj || {})._styles || [];
const arrayToStyleMap = array => array.reduce((map, style) => map.set(style.close, style.open), new Map());
const styleMap = tokenTypes.reduce(
    (styleMap, key) => {
        const style = key !== 'DEFAULT' ? extractStyles(STYLE[TYPE.DEFAULT]).concat(extractStyles(STYLE[TYPE[key]])) : [];
        const wsStyle = extractStyles(STYLE[TYPE.DEFAULT])
            .concat(extractStyles(STYLE[TYPE[key]]).filter(entry =>
                entry.close === '\u001b[22m' || // bold
                entry.close === '\u001b[23m' || // italic
                entry.close === '\u001b[39m'    // color
            ));

        styleMap.set(TYPE[key], arrayToStyleMap(style));
        styleMap.set(TYPE[key] + 1, arrayToStyleMap(wsStyle));

        return styleMap;
    },
    new Map()
);

for (let i = 0; i < styleMap.size; i++) {
    const fromStyleMap = styleMap.get(i);

    STYLE_TRANSITION[i] = [];

    for (let j = 0; j < styleMap.size; j++) {
        let toStyleMap = styleMap.get(j);
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

        STYLE_TRANSITION[i].push(styleTransitionCodes);
    }
}

module.exports = {
    SUPPORTED,
    TYPE,
    STYLE,
    STYLE_TRANSITION
};
