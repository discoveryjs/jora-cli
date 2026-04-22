import { decode, isHeaderAcceptable } from '../tmp/jsonxl-snapshot9.js';

export const encoding = Object.freeze({
    name: 'jsonxl/snapshot9',
    test: isHeaderAcceptable,
    streaming: false,
    decode
});
