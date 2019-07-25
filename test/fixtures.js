const {
    WHITESPACE,
    LEFT_BRACE,
    RIGHT_BRACE,
    LEFT_BRACKET,
    RIGHT_BRACKET,
    COLON,
    COMMA,
    STRING,
    NUMBER,
    NULL,
    FALSE,
    TRUE
} = require('../utils/constants').TOKENS;
module.exports = [
    {
        json: '{"foo": "bar"}',
        tokens: [
            {
                type: LEFT_BRACE,
                value: '{'
            },
            {
                type: STRING,
                value: '"foo"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: STRING,
                value: '"bar"'
            },
            {
                type: RIGHT_BRACE,
                value: '}'
            }
        ]
    },
    {
        json: '{"f\\"oo\\u1234"\r\n:\t-0.1234, "bar": 0e-3}',
        tokens: [
            {
                type: LEFT_BRACE,
                value: '{'
            },
            {
                type: STRING,
                value: '"f\\"oo\\u1234"'
            },
            {
                type: WHITESPACE,
                value: '\r'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: '\t'
            },
            {
                type: NUMBER,
                value: '-0.1234'
            },
            {
                type: COMMA,
                value: ','
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: STRING,
                value: '"bar"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: NUMBER,
                value: '0e-3'
            },
            {
                type: RIGHT_BRACE,
                value: '}'
            }
        ]
    },
    {
        json: '{"foo": null, "bar": [-1234, false, "ololo"], "quux": {"azaza": {"bar": true}}}',
        tokens: [
            {
                type: LEFT_BRACE,
                value: '{'
            },
            {
                type: STRING,
                value: '"foo"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: NULL,
                value: 'null'
            },
            {
                type: COMMA,
                value: ','
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: STRING,
                value: '"bar"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: LEFT_BRACKET,
                value: '['
            },
            {
                type: NUMBER,
                value: '-1234'
            },
            {
                type: COMMA,
                value: ','
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: FALSE,
                value: 'false'
            },
            {
                type: COMMA,
                value: ','
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: STRING,
                value: '"ololo"'
            },
            {
                type: RIGHT_BRACKET,
                value: ']'
            },
            {
                type: COMMA,
                value: ','
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: STRING,
                value: '"quux"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: LEFT_BRACE,
                value: '{'
            },
            {
                type: STRING,
                value: '"azaza"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: LEFT_BRACE,
                value: '{'
            },
            {
                type: STRING,
                value: '"bar"'
            },
            {
                type: COLON,
                value: ':'
            },
            {
                type: WHITESPACE,
                value: ' '
            },
            {
                type: TRUE,
                value: 'true'
            },
            {
                type: RIGHT_BRACE,
                value: '}'
            },
            {
                type: RIGHT_BRACE,
                value: '}'
            },
            {
                type: RIGHT_BRACE,
                value: '}'
            }
        ]
    }
];
