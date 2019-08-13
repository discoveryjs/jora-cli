const { TOKENS,  TOKEN_COLORS } = require('../utils/constants');

const tokenNames = {};
const color = {};

for (let key in TOKENS) {
    tokenNames[TOKENS[key]] = key;
}

for (let key in TOKEN_COLORS) {
    color[tokenNames[key]] = TOKEN_COLORS[key];
}

module.exports = {
    color
};
