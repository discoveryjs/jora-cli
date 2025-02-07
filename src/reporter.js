function shortNum(current, units, base = 1000) {
    let unitIdx = 0;

    while (current > base && unitIdx < units.length - 1) {
        current /= base;
        unitIdx++;
    }

    const value = unitIdx === 0
        ? current
        : Math.round(current);

    return value + units[unitIdx];
}

function formatSize(value, bytes) {
    return shortNum(value, [bytes ? 'bytes' : '', 'KB', 'MB'], 1000);
}
function formatTime(value) {
    value = Math.round(value);

    return value < 1000
        ? `${value}ms`
        : value < 10000
            ? `${(value / 1000).toFixed(3)}s`
            : `${(value / 1000).toFixed(1)}s`;
}

export class SilentWriter {
    log() {}
    logTemp() {}
};
export class StreamWriter {
    constructor(stream) {
        this.log = (...args) => stream.write(args.join(' ') + '\n');
    }
    logTemp() {}
}
export class TTYWriter {
    constructor(tty, tempOnly) {
        let lastLogPos = -1;
        let lastTempMessage = null;

        const getPos = () => tty.bytesWritten;
        const clear = () => {
            tty.cursorTo(0);
            tty.clearLine(1);
        };

        const clearAndLog = (message) => {
            lastTempMessage = null;
            if (lastLogPos === getPos()) {
                lastLogPos = -1;
                clear();
            }
            tty.write(message);
        };
        this.log = (...args) => {
            clearAndLog(tempOnly ? '' : args.join(' ') + '\n');
        };
        this.logTemp = (...args) => {
            let message = args.join(' ');

            if (tempOnly) {
                message = message.trim();
            }

            if (message !== lastTempMessage) {
                clearAndLog(message);
                lastTempMessage = message;
                lastLogPos = getPos();
            }
        };
    }
}

export function createDefaultReporter({ log, logTemp }) {
    return function defaultReporter(stage, params) {
        switch (stage) {
            case 'start-reading':
                log(`Input from ${params.filepath || '<unknown source>'}`);
                break;

            case 'start-writing':
                log(`Output into ${params.filepath || '<unknown destination>'}${params.dryRun ? ' (dry run)' : ''}`);
                break;

            case 'start-stdout':
                log('----------------');
                break;

            case 'finish-stdout':
                log((params.newline ? '\n' : '') + '----------------');
                break;

            case 'input-encoding':
                log(`  Encoding: ${params.encoding || '<unknown>'} (auto detected)`);
                break;

            case 'output-encoding':
                log(`  Encoding: ${params.encoding || '<unknown>'}${params.autoEncoding ? ' (auto selected)' : ''}`);
                break;

            case 'decoding':
                logTemp(`  Decoding from ${params.encoding}...`);
                break;

            case 'decoded':
                log(`  Decoded ${params.encoding} in ${formatTime(params.time)}`);
                break;

            case 'encoding':
                logTemp(`  Encoding into ${params.encoding}...`);
                break;

            case 'encoded':
                log(`  Encoded ${params.encoding} in ${formatTime(params.time)}`);
                break;

            case 'reading': {
                const { completed, total, done, elapsed } = params;

                if (!done) {
                    logTemp(`  Reading data... ${formatSize(completed).padStart(6, ' ')}${total ? ` (${(100 * completed / total).toFixed(0)}%)` : ''}`);
                } else {
                    log(`  Read ${formatSize(completed, true)} in ${formatTime(elapsed)}`);
                }
                break;
            }

            case 'writing': {
                const { completed, total, done, elapsed } = params;

                if (!done) {
                    logTemp(`  Writing data... ${formatSize(completed).padStart(6, ' ')}${total ? ` (${(100 * completed / total).toFixed(0)}%)` : ''}`);
                } else {
                    log(`  Written ${formatSize(completed, true)} in ${formatTime(elapsed)}`);
                }
                break;
            }

            case 'done':
                log();
                log(`Done in ${formatTime(params.time)}`);
                break;

            default:
                log('Unknown stage:', stage, params);
        }
    };
}
