import { TYPE } from './constants.js';

const COLON = 0x003A;

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

function findWhitespaceEnd(input, index) {
    const start = index;

    for (; index < input.length; index++) {
        if (!isWhiteSpace(input.charCodeAt(index))) {
            break;
        }
    }

    return index - start;
}

function isFollowedByColon(input, index) {
    index += findWhitespaceEnd(input, index);

    return index < input.length && input.charCodeAt(index) === COLON;
}

function findStringEnd(input, index) {
    const start = index;

    for (index++; index < input.length; index++) {
        switch (input.charCodeAt(index)) {
            case 0x0022: // "
                return index - start + 1;

            case 0x005C: // \
                index++;
                if (input.charCodeAt(index) === 0x0075) { // u
                    // ensure there is at least 5 chars: a code and closing quote
                    if (input.length - index < 5) {
                        return 0;
                    }

                    for (let i = 0; i < 4; i++, index++) {
                        if (!isHexDigit(input.charCodeAt(index))) {
                            return 0;
                        }
                    }
                }
                break;
        }
    }

    return 0;
}

function findDecimalNumberEnd(input, index) {
    for (; index < input.length; index++) {
        if (!isDigit(input.charCodeAt(index))) {
            break;
        }
    }

    return index;
}

// Consume a number
function findNumberEnd(input, index) {
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
        return 0;
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

    return index - start;
}

export default (input, onToken) => {
    let type;

    loop:
    for (let index = 0; index < input.length;) {
        let length = 0;

        switch (input.charCodeAt(index)) {
            case 0x0009:  // \t
            case 0x000A:  // \n
            case 0x000D:  // \r
            case 0x0020:  // space
                type = TYPE.WHITESPACE;
                length = findWhitespaceEnd(input, index);
                break;

            case 0x0022:  // "
                length = findStringEnd(input, index);
                if (length > 0) {
                    type = isFollowedByColon(input, index + length) ? TYPE.STRING_KEY : TYPE.STRING;
                }
                break;

            case 0x007B: // {
                type = TYPE.LEFT_BRACE;
                length = 1;
                break;

            case 0x007D: // }
                type = TYPE.RIGHT_BRACE;
                length = 1;
                break;

            case 0x005B: // [
                type = TYPE.LEFT_BRACKET;
                length = 1;
                break;

            case 0x005D: // ]
                type = TYPE.RIGHT_BRACKET;
                length = 1;
                break;

            case 0x003A: // :
                type = TYPE.COLON;
                length = 1;
                break;

            case 0x002C: // ,
                type = TYPE.COMMA;
                length = 1;
                break;

            case 0x0074: // t
                if (input.substr(index, 4) === 'true') {
                    type = TYPE.TRUE;
                    length = 4;
                }
                break;

            case 0x0066: // f
                if (input.substr(index, 5) === 'false') {
                    type = TYPE.FALSE;
                    length = 5;
                }
                break;

            case 0x006E: // n
                if (input.substr(index, 4) === 'null') {
                    type = TYPE.NULL;
                    length = 4;
                }
                break;

            default:
                type = TYPE.NUMBER;
                length = findNumberEnd(input, index);
        }

        if (length === 0) {
            break;
        }

        onToken(type, index, index += length);
    }
};
