const { TOKENS, STYLE } = require('../utils/constants');
const style = {};

for (let key in TOKENS) {
    style[key] = STYLE[TOKENS[key]] || (s => s);
}

module.exports = {
    style
};
