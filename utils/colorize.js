const tokenize = require('./tokenize');
const {
    SUPPORTED,
    STYLE_TRANSITION,
    TYPE: {
        DEFAULT,
        WHITESPACE,
        STRING_KEY,
        STRING_KEY_CONTENT
    }
} = require('./constants');

module.exports = (input) => {
    let prevType = DEFAULT;
    let result = '';

    tokenize(input, (type, start, end) => {
        if (type === WHITESPACE) {
            type = prevType + 1;
        }

        const transitionCodes = STYLE_TRANSITION[prevType][type];

        if (transitionCodes) {
            result += transitionCodes;
        }

        if (type === STRING_KEY && STYLE_TRANSITION[type][STRING_KEY_CONTENT]) {
            result +=
                '"' +
                STYLE_TRANSITION[type][STRING_KEY_CONTENT] + input.substring(start + 1, end - 1) +
                STYLE_TRANSITION[STRING_KEY_CONTENT][type] + '"';
        } else {
            result += input.substring(start, end);
        }

        prevType = type;
    });

    return result + STYLE_TRANSITION[prevType][DEFAULT]; // transition to DEFAULT -> reset styles;
};

module.exports.supported = SUPPORTED;
