import fs from 'node:fs';
import { Readable } from 'node:stream';
import * as clap from 'clap';
import * as buildinEncodings from './encodings/index.js';
import { consumeStreamAsTypedArray, defaultStreamTransformers, ProgressTransformer, StreamTransformSelector } from './read-from-stream-utils.js';

const now = typeof performace !== 'undefined' && typeof performance.now === 'function' ? performance.now : Date.now;

async function readFromStream(stream, totalSize, setStageProgress = async () => {}) {
    const streamStartTime = now();
    const encodings = [
        buildinEncodings.jsonxl,
        buildinEncodings.json
    ];
    let decodingTime = 0;
    let compression = false;
    let encoding = 'unknown';
    let size = 0;

    await setStageProgress('reading', getProgressState(false));

    const streamPipeline = Readable.toWeb(stream)
        .pipeThrough(new TransformStream(new ProgressTransformer(setProgress)))
        .pipeThrough(new TransformStream(new StreamTransformSelector(defaultStreamTransformers, (name) => compression = name)));
    const reader = streamPipeline.getReader();

    try {
        const firstChunk = await reader.read();
        const { value, done } = firstChunk;

        if (done) {
            throw new Error('Empty payload');
        }

        for (const { name, test, streaming, decode } of encodings) {
            if (test(value)) {
                encoding = name;

                setStageProgress('input-encoding', { encoding, compression });

                const readerIterator = createReaderIterator(reader, firstChunk);
                const decodeRequest = streaming
                    ? decode(readerIterator)
                    : consumeStreamAsTypedArray(readerIterator).then(measureDecodingTime(decode));
                const data = await decodeRequest;

                return { data, compression, encoding, size, decodingTime };
            }
        }

        throw new Error('No matched encoding found for the payload');
    } finally {
        reader.releaseLock();
    }

    function getProgressState(done) {
        return {
            done,
            elapsed: now() - streamStartTime,
            units: 'bytes',
            completed: size,
            total: totalSize
        };
    }

    async function setProgress(done, sizeDelta = 0) {
        size += sizeDelta;

        await setStageProgress('reading', getProgressState(done));
    }

    async function* createReaderIterator(reader, firstChunk) {
        while (true) {
            const { value, done } = firstChunk || await reader.read();

            firstChunk = undefined;

            if (done) {
                break;
            }

            const startDecodingTime = now();
            yield value;
            decodingTime += now() - startDecodingTime;
        }
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
