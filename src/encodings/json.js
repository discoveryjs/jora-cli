import { parseChunked } from '@discoveryjs/json-ext';

export const encoding = Object.freeze({
    name: 'json',
    test: () => true,
    streaming: true,
    decode: (input, setEncodingName) => {
        return parseChunked(input, {
            mode: 'auto',
            onChunk(chunk, offset, total, state) {
                setEncodingName(state.mode);
            }
        });
    }
});
