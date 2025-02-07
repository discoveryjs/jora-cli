import fs from 'node:fs';
import { decode, parseHeader } from './tmp/jsonxl.js';
import { parseChunked } from '@discoveryjs/json-ext';
import * as clap from 'clap';

const now = typeof performace !== 'undefined' && typeof performance.now === 'function' ? performance.now : Date.now;

async function readFromStream(stream, totalSize, setStageProgress = async () => {}) {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
    const streamStartTime = now();
    const iterator = stream[Symbol.asyncIterator]();
    const firstChunk = await iterator.next();
    let decodingTime = 0;
    let decodeRequest;
    let encoding = 'unknown';
    let size = 0;

    try {
        // parseHeader() throws if payload has wrong header
        const { version } = parseHeader(firstChunk.value);

        // jsonxl
        encoding = 'jsonxl/snapshot' + version;
        decodeRequest = consumeChunksAsSingleTypedArray(streamConsumer(firstChunk, iterator), totalSize, setStageProgress)
            .then(measureDecodingTime(decode));
    } catch (e) {
        // fallback to JSON
        encoding = 'json';
        decodeRequest = parseChunked(streamConsumer(firstChunk, iterator));
    }

    setStageProgress('input-encoding', { encoding });

    const data = await decodeRequest;

    return { data, encoding, size, decodingTime };

    function getProgress(done) {
        return {
            done,
            elapsed: now() - streamStartTime,
            units: 'bytes',
            completed: size,
            total: totalSize
        };
    }

    async function consumeChunksAsSingleTypedArray(iterator) {
        const chunks = [];

        // Consume chunks
        for await (const chunk of iterator) {
            chunks.push(chunk);
        }

        // Concat chunks
        return Buffer.concat(chunks, size);
    }

    async function* streamConsumer(firstChunk, iterator) {
        while (true) {
            const { value, done } = firstChunk || await iterator.next();

            firstChunk = undefined;

            if (done) {
                break;
            }

            for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
                const chunkDecodingStartTime = now();
                const chunk = offset === 0 && value.length - offset < CHUNK_SIZE
                    ? value
                    : value.slice(offset, offset + CHUNK_SIZE);

                yield chunk;

                decodingTime += now() - chunkDecodingStartTime;
                size += chunk.length;

                await setStageProgress('reading', getProgress(false));
            }
        }

        // progress done
        await setStageProgress('reading', getProgress(true));
    }

    function measureDecodingTime(decode) {
        return async (payload) => {
            await setStageProgress('decoding', { encoding });

            const startDecodingTime = now();

            try {
                return await decode(payload);
            } finally {
                decodingTime = now() - startDecodingTime;
                setStageProgress('decoded', { encoding, time: Math.round(decodingTime) });
            }
        };
    }
}

export function readFromStdin(setStageProgress) {
    setStageProgress('start-reading', { filepath: '<stdin>' });

    return readFromStream(process.stdin, undefined, setStageProgress);
}

export function readFromFile(filepath, setStageProgress) {
    setStageProgress('start-reading', { filepath });

    try {
        const stat = fs.statSync(filepath);
        const stream = fs.createReadStream(filepath, { highWaterMark: 1024 * 1024 });

        return readFromStream(stream, stat.size, setStageProgress);
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new clap.Error(`ERROR! No such file or directory: ${filepath}`);
        }

        throw e;
    }
}
