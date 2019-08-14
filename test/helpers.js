const { TOKENS,  TOKEN_COLORS } = require('../utils/constants');
const color = {};

for (let key in TOKENS) {
    color[key] = TOKEN_COLORS[TOKENS[key]] || (s => s);
}

module.exports = {
    color
};
