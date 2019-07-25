const {
    STRING,
    NUMBER,
    WHITESPACE
} = require('./constants').TOKENS;
const {
    PUNCTUATOR_TOKENS_MAP,
    KEYWORD_TOKENS_MAP,
    STRING_STATES,
    NUMBER_STATES,
    ESCAPES
} = require('./constants');

// HELPERS

function isDigit1to9(char) {
    return char >= '1' && char <= '9';
}

function isDigit(char) {
    return char >= '0' && char <= '9';
}

function isHex(char) {
    return (
        isDigit(char) ||
        (char >= 'a' && char <= 'f') ||
        (char >= 'A' && char <= 'F')
    );
}

function isExp(char) {
    return char === 'e' || char === 'E';
}

// PARSERS

function parseWhitespace(input, index, line, column) {
    const char = input.charAt(index);

    if (char === '\r') { // CR (Unix)
        index++;
        line++;
        column = 1;
        if (input.charAt(index) === '\n') { // CRLF (Windows)
            index++;
        }
    } else if (char === '\n') { // LF (MacOS)
        index++;
        line++;
        column = 1;
    } else if (char === '\t' || char === ' ') {
        index++;
        column++;
    } else {
        return null;
    }

    return {
        index,
        line,
        column,
        value: char
    };
}

function parseChar(input, index, line, column) {
    const char = input.charAt(index);

    if (char in PUNCTUATOR_TOKENS_MAP) {
        return {
            type: PUNCTUATOR_TOKENS_MAP[char],
            line,
            column: column + 1,
            index: index + 1,
            value: char
        };
    }

    return null;
}

function parseKeyword(input, index, line, column) {
    for (const name in KEYWORD_TOKENS_MAP) {
        if (KEYWORD_TOKENS_MAP.hasOwnProperty(name) && input.substr(index, name.length) === name) {
            return {
                type: KEYWORD_TOKENS_MAP[name],
                line,
                column: column + name.length,
                index: index + name.length,
                value: name
            };
        }
    }

    return null;
}

function parseString(input, index, line, column) {
    const startIndex = index;
    let state = STRING_STATES._START_;

    while (index < input.length) {
        const char = input.charAt(index);

        switch (state) {
            case STRING_STATES._START_: {
                if (char === '"') {
                    index++;
                    state = STRING_STATES.START_QUOTE_OR_CHAR;
                } else {
                    return null;
                }
                break;
            }

            case STRING_STATES.START_QUOTE_OR_CHAR: {
                if (char === '\\') {
                    index++;
                    state = STRING_STATES.ESCAPE;
                } else if (char === '"') {
                    index++;
                    const value = input.slice(startIndex, index);

                    return {
                        type: STRING,
                        line,
                        column: column + index - startIndex,
                        index,
                        value
                    };
                } else {
                    index++;
                }
                break;
            }

            case STRING_STATES.ESCAPE: {
                if (char in ESCAPES) {
                    index++;
                    if (char === 'u') {
                        for (let i = 0; i < 4; i++) {
                            const curChar = input.charAt(index);
                            if (curChar && isHex(curChar)) {
                                index++;
                            } else {
                                return null;
                            }
                        }
                    }
                    state = STRING_STATES.START_QUOTE_OR_CHAR;
                } else {
                    return null;
                }
                break;
            }
        }
    }
}

function parseNumber(input, index, line, column) {
    const startIndex = index;
    let passedValueIndex = index;
    let state = NUMBER_STATES._START_;

    iterator: while (index < input.length) {
        const char = input.charAt(index);

        switch (state) {
            case NUMBER_STATES._START_: {
                if (char === '-') {
                    state = NUMBER_STATES.MINUS;
                } else if (char === '0') {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.ZERO;
                } else if (isDigit1to9(char)) {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.DIGIT;
                } else {
                    return null;
                }
                break;
            }

            case NUMBER_STATES.MINUS: {
                if (char === '0') {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.ZERO;
                } else if (isDigit1to9(char)) {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.DIGIT;
                } else {
                    return null;
                }
                break;
            }

            case NUMBER_STATES.ZERO: {
                if (char === '.') {
                    state = NUMBER_STATES.POINT;
                } else if (isExp(char)) {
                    state = NUMBER_STATES.EXP;
                } else {
                    break iterator;
                }
                break;
            }

            case NUMBER_STATES.DIGIT: {
                if (isDigit(char)) {
                    passedValueIndex = index + 1;
                } else if (char === '.') {
                    state = NUMBER_STATES.POINT;
                } else if (isExp(char)) {
                    state = NUMBER_STATES.EXP;
                } else {
                    break iterator;
                }
                break;
            }

            case NUMBER_STATES.POINT: {
                if (isDigit(char)) {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.DIGIT_FRACTION;
                } else {
                    break iterator;
                }
                break;
            }

            case NUMBER_STATES.DIGIT_FRACTION: {
                if (isDigit(char)) {
                    passedValueIndex = index + 1;
                } else if (isExp(char)) {
                    state = NUMBER_STATES.EXP;
                } else {
                    break iterator;
                }
                break;
            }

            case NUMBER_STATES.EXP: {
                if (char === '+' || char === '-') {
                    state = NUMBER_STATES.EXP_DIGIT_OR_SIGN;
                } else if (isDigit(char)) {
                    passedValueIndex = index + 1;
                    state = NUMBER_STATES.EXP_DIGIT_OR_SIGN;
                } else {
                    break iterator;
                }
                break;
            }

            case NUMBER_STATES.EXP_DIGIT_OR_SIGN: {
                if (isDigit(char)) {
                    passedValueIndex = index + 1;
                } else {
                    break iterator;
                }
                break;
            }
        }

        index++;
    }

    if (passedValueIndex > 0) {
        return {
            type: NUMBER,
            line,
            column: column + passedValueIndex - startIndex,
            index: passedValueIndex,
            value: input.slice(startIndex, passedValueIndex)
        };
    }

    return null;
}

module.exports = (input) => {
    let line = 1;
    let column = 1;
    let index = 0;

    const tokens = [];

    while (index < input.length) {
        const args = [input, index, line, column];
        const whitespace = parseWhitespace(...args);

        if (whitespace) {
            index = whitespace.index;
            line = whitespace.line;
            column = whitespace.column;

            tokens.push({
                type: WHITESPACE,
                value: whitespace.value
            });

            continue;
        }

        const matched = (
            parseChar(...args) ||
            parseKeyword(...args) ||
            parseString(...args) ||
            parseNumber(...args)
        );

        if (matched) {
            tokens.push({
                type: matched.type,
                value: matched.value
            });

            index = matched.index;
            line = matched.line;
            column = matched.column;
        }
    }

    return tokens;
};
