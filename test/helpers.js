import { TYPE, STYLE_TRANSITION } from '../src/constants.js';

export function style(...args) {
    let result = '';
    let prevType = TYPE.DEFAULT;

    for (let i = 0; i < args.length; i += 2) {
        result += STYLE_TRANSITION[prevType][TYPE[args[i]]];
        result += args[i + 1];
        prevType = TYPE[args[i]];
    }

    return result + STYLE_TRANSITION[prevType][TYPE.DEFAULT];
}
