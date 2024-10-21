import ansiStyles from 'ansi-styles';
import supportsColor from 'supports-color';

export const SUPPORTED = supportsColor.stdout.hasBasic;
export const TYPE = {
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

export const STYLE_TRANSITION = [];
export const STYLE = {
    [TYPE.LEFT_BRACE]: ansiStyles.gray,
    [TYPE.RIGHT_BRACE]: ansiStyles.gray,
    [TYPE.LEFT_BRACKET]: ansiStyles.gray,
    [TYPE.RIGHT_BRACKET]: ansiStyles.gray,
    [TYPE.COLON]: ansiStyles.gray,
    [TYPE.COMMA]: ansiStyles.gray,
    [TYPE.STRING]: ansiStyles.green,
    [TYPE.STRING_KEY]: ansiStyles.gray,
    [TYPE.NUMBER]: ansiStyles.cyan,
    [TYPE.TRUE]: ansiStyles.cyan,
    [TYPE.FALSE]: ansiStyles.cyan,
    [TYPE.NULL]: ansiStyles.bold
};

const tokenTypes = Object.keys(TYPE);
const extractStyles = obj => obj ? [obj] : [];
const arrayToStyleMap = array => array.reduce((map, style) => map.set(style.close, style.open), new Map());
const styleMap = tokenTypes.reduce(
    (styleMap, key) => {
        const fromDefaultStyles = extractStyles(STYLE[TYPE.DEFAULT]).concat(extractStyles(STYLE[TYPE[key]]));
        const style = key !== 'DEFAULT' ? fromDefaultStyles : [];
        const wsStyle = fromDefaultStyles.filter(entry =>
            entry.close === '\u001b[22m' || // bold
            entry.close === '\u001b[23m' || // italic
            entry.close === '\u001b[39m'    // color
        );

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
