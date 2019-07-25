const {
    STRING,
    NUMBER,
    WHITESPACE
} = require('./constants').TOKENS;
const {
    PUNCTUATOR_TOKENS_MAP,
    KEYWORD_TOKENS_MAP
} = require('./constants');

// HELPERS

// digit
// A code point between U+0030 DIGIT ZERO (0) and U+0039 DIGIT NINE (9).
function isDigit(code) {
    return code >= 0x0030 && code <= 0x0039;
}

// hex digit
// A digit, or a code point between U+0041 LATIN CAPITAL LETTER A (A) and U+0046 LATIN CAPITAL LETTER F (F),
// or a code point between U+0061 LATIN SMALL LETTER A (a) and U+0066 LATIN SMALL LETTER F (f).
function isHexDigit(code) {
    return (
        isDigit(code) || // 0 .. 9
        (code >= 0x0041 && code <= 0x0046) || // A .. F
        (code >= 0x0061 && code <= 0x0066)    // a .. f
    );
}

function isWhiteSpace(code) {
    return (
        code === 0x0009 ||  // \t
        code === 0x000A ||  // \n
        code === 0x000D ||  // \r
        code === 0x0020     // space
    );
}

// PARSERS

function parseWhitespace(input, index) {
    const start = index;

    for (; index < input.length; index++) {
        if (!isWhiteSpace(input.charCodeAt(index))) {
            break;
        }
    }

    if (start === index) {
        return null;
    }

    return {
        type: WHITESPACE,
        value: input.substring(start, index)
    };
}

function parseDelim(input, index) {
    const char = input.charAt(index);

    if (char in PUNCTUATOR_TOKENS_MAP) {
        return {
            type: PUNCTUATOR_TOKENS_MAP[char],
            value: char
        };
    }

    return null;
}

function parseKeyword(input, index) {
    for (const name in KEYWORD_TOKENS_MAP) {
        if (KEYWORD_TOKENS_MAP.hasOwnProperty(name) && input.substr(index, name.length) === name) {
            return {
                type: KEYWORD_TOKENS_MAP[name],
                value: name
            };
        }
    }

    return null;
}

function parseString(input, index) {
    const start = index;

    if (input.charAt(index) !== '"') {
        return null;
    }

    for (index++; index < input.length; index++) {
        switch (input.charAt(index)) {
            case '"':
                return {
                    type: STRING,
                    value: input.substring(start, index + 1)
                };

            case '\\':
                index++;
                if (input.charCodeAt(index) === 'u') {
                    // ensure there is at least 5 chars: a code and closing quote
                    if (input.length - index < 5) {
                        return null;
                    }

                    for (let i = 0; i < 4; i++, index++) {
                        if (!isHexDigit(input.charCodeAt(index))) {
                            return null;
                        }
                    }
                }
                break;
        }
    }

    return null;
}

function findDecimalNumberEnd(source, offset) {
    for (; offset < source.length; offset++) {
        if (!isDigit(source.charCodeAt(offset))) {
            break;
        }
    }

    return offset;
}

// Consume a number
function parseNumber(input, index) {
    const start = index;
    let code = input.charCodeAt(index);

    // If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
    // consume it and append it to repr.
    if (code === 0x002B || code === 0x002D) {
        code = input.charCodeAt(index += 1);
    }

    // While the next input code point is a digit, consume it and append it to repr.
    if (isDigit(code)) {
        index = findDecimalNumberEnd(input, index + 1);
        code = input.charCodeAt(index);
    } else {
        return null;
    }

    // If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
    if (code === 0x002E && isDigit(input.charCodeAt(index + 1))) {
        code = input.charCodeAt(index += 2);
        index = findDecimalNumberEnd(input, index);
    }

    // If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
    // or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
    if (code === 0x0045 /* E */ || code === 0x0065 /* e */) {
        var sign = 0;
        code = input.charCodeAt(index + 1);

        // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
        if (code === 0x002D || code === 0x002B) {
            sign = 1;
            code = input.charCodeAt(index + 2);
        }

        // ... followed by a digit
        if (isDigit(code)) {
            index = findDecimalNumberEnd(input, index + 1 + sign + 1);
        }
    }

    return {
        type: NUMBER,
        value: input.slice(start, index)
    };
}

module.exports = (input) => {
    let index = 0;

    const tokens = [];

    while (index < input.length) {
        const matched = (
            parseWhitespace(input, index) ||
            parseDelim(input, index) ||
            parseKeyword(input, index) ||
            parseString(input, index) ||
            parseNumber(input, index)
        );

        if (!matched) {
            break;
        }

        tokens.push({
            type: matched.type,
            value: matched.value
        });

        index += matched.value.length;
    }

    return tokens;
};
