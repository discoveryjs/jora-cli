import { parseChunked } from '@discoveryjs/json-ext';

export const encoding = Object.freeze({
    name: 'json',
    test: () => true,
    streaming: true,
    decode: parseChunked
});
