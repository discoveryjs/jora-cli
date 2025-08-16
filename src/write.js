import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { encode } from './tmp/jsonxl-snapshot9.js';
import { colorize } from './colorize.js';
import { stringifyChunked, stringifyInfo } from '@discoveryjs/json-ext';
import * as clap from 'clap';

const now = typeof performace !== 'undefined' && typeof performance.now === 'function' ? performance.now : Date.now;
const stringBytes = typeof Buffer === 'function' && typeof Buffer.byteLength === 'function'
    ? Buffer.byteLength
    : (str) => str.length; // incorrect but fast fallback

function* createChunkIterator(data, chunkSize = 64 * 1024) {
    for (let offset = 0; offset < data.length; offset += chunkSize) {
        yield data.subarray(offset, offset + chunkSize);
    }
}

async function writeIntoStream(stream, data, options, setStageProgress = () => {}) {
    const { autoEncoding, encoding } = options;
    let payload;
    let totalSize;

    setStageProgress('output-encoding', { autoEncoding, encoding });

    switch (encoding) {
        case 'jsonxl': {
            const startTime = now();

            setStageProgress('encoding', { encoding });
            const jsonxl = encode(data);
            setStageProgress('encoded', {
                encoding,
                size: jsonxl.byteLength,
                time: now() - startTime
            });

            payload = createChunkIterator(jsonxl, /* 1MB */ 1024 * 1024);
            totalSize = jsonxl.byteLength;

            break;
        }

        case 'json': {
            payload = stringifyChunked(data, null, options.pretty);
            break;
        }

        default:
            throw new Error('Unknown output encoding ' + encoding);
    }

    const streamStartTime = now();
    let writtenSize = 0;

    if (stream) {
        const isStdStream = stream.isTTY;
        const endNewline = encoding !== 'jsonxl';
        const applyColorize = encoding === 'json' && options.color;
        const buffer = [];

        await pipeline(async function* () {
            if (isStdStream) {
                setStageProgress('start-stdout');
            }

            for await (const chunk of payload) {
                writtenSize += typeof chunk === 'string'
                    ? stringBytes(chunk)
                    : chunk.byteLength;

                if (!isStdStream) {
                    setStageProgress('writing', {
                        done: false,
                        elapsed: now() - streamStartTime,
                        units: 'bytes',
                        completed: writtenSize,
                        total: totalSize
                    });
                }

                if (applyColorize) {
                    buffer.push(chunk);
                } else {
                    yield chunk;
                }
            }

            if (applyColorize) {
                yield colorize(buffer.join(''));
            }

            if (isStdStream && endNewline) {
                yield'\n';
            }

            if (isStdStream) {
                setStageProgress('finish-stdout', { newline: !endNewline });
            }
        }, stream, { end: !isStdStream });
    } else {
        // dry run
        switch (encoding) {
            case 'jsonxl':
                writtenSize = totalSize;
                break;

            case 'json':
                writtenSize = stringifyInfo(data, null, options.pretty).bytes;
                break;

            default:
                throw new Error('Unknown output encoding ' + encoding);
        }
    }

    setStageProgress('writing', {
        done: true,
        elapsed: now() - streamStartTime,
        units: 'bytes',
        completed: writtenSize,
        total: totalSize
    });
}

function writeIntoStdout(data, options, setStageProgress) {
    const { dryRun } = options;

    setStageProgress('start-writing', { filepath: '<stdout>', dryRun });

    return writeIntoStream(
        !dryRun ? process.stdout : null,
        data,
        options,
        setStageProgress
    );
}

function writeIntoFile(filepath, data, options, setStageProgress) {
    const { dryRun } = options;

    setStageProgress('start-writing', { filepath, dryRun });

    if (!dryRun && fs.existsSync(filepath) && !options.forceRewrite) {
        throw new clap.Error('Output file already exists. Use the --force option or the -f flag to overwrite');
    }

    const stream = !dryRun
        ? fs.createWriteStream(filepath, { highWaterMark: 512 * 1024 })
        : null;

    return writeIntoStream(
        stream,
        data,
        options,
        setStageProgress
    );
}

export function writeToDestination(data, options, setStageProgress) {
    const { outputPath } = options;

    return outputPath
        ? writeIntoFile(outputPath, data, options, setStageProgress)
        : writeIntoStdout(data, options, setStageProgress);
}
