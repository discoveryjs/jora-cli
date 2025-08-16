import fs from 'fs';
import path from 'path';
import * as cli from 'clap';
import jora from 'jora';
import { colorsSupported } from './colorize.js';
import { readFromFile, readFromStdin } from './read-from-stream.js';
import { createDefaultReporter, SilentWriter, StreamWriter, TTYWriter } from './reporter.js';
import { writeToDestination } from './write.js';

function outputVersion() {
    const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

    console.log(version);
}

function safeOperation(name, fn) {
    try {
        return fn();
    } catch (e) {
        console.error(`${name} error`);
        console.error(e.message);
        process.exit(2);
    }
}

function extractQuery(queryOrFilename) {
    const maybeFilename = normFilepath(queryOrFilename);

    if (typeof maybeFilename === 'string' && path.extname(maybeFilename) === '.jora') {
        if (!fs.existsSync(maybeFilename)) {
            throw new cli.Error(`ERROR! No such file or directory: ${maybeFilename}`);
        }

        return safeOperation('Read jora query from file', () =>
            fs.readFileSync(maybeFilename, 'utf8')
        );
    }

    return queryOrFilename;
}

function prepareQuery(query) {
    return safeOperation('Jora query prepare', () =>
        jora(query || '')
    );
}

function performQuery(queryFn, data, context) {
    return safeOperation('Query perform', () =>
        queryFn(data, context)
    );
}

function normFilepath(value) {
    if (typeof value !== 'string') {
        return value;
    }

    return path.relative(process.cwd(), path.resolve(process.cwd(), value));
}

function normFormat(value) {
    if (encodings.includes(value)) {
        return value;
    }

    throw new cli.Error(`Bad value "${value}" for ${this.long} option, supported values: ${encodings.join(', ')}`);
}

function normCompression(value) {
    if (value === false) {
        return false;
    }

    if (value === undefined) {
        return 'gzip';
    }

    if (compressions.includes(value)) {
        return value;
    }

    throw new cli.Error(`Bad value "${value}" for ${this.long} option, supported values: ${compressions.join(', ')}`);
}

function normPretty(value) {
    return value === undefined ? 4 : Number(value) || false;
}

const encodings = ['json', 'jsonxl'];
const compressions = ['gzip', 'deflate'];
const command = cli.command('jora [query]')
    .version('', '', '', outputVersion)
    .option('-q, --query <query>', 'Jora query or path to a query file with extension .jora', normFilepath)
    .option('-i, --input <filename>', 'Input file', normFilepath)
    .option('-o, --output <filename>', 'Output file (outputs to stdout if not set)')
    .option('-e, --encoding <encoding>', 'Output encoding: json (default), jsonxl (snapshot9)', normFormat, 'json')
    .option('-c, --compression [compression]', 'Output compression: gzip (default when [compression] is omitted), deflate', normCompression, false)
    .option('--dry-run', 'Don\'t output result, only report what it would have done')
    .option('-f, --force', 'Force overwriting output file')
    .option('-p, --pretty [indent]', 'Pretty-prints the output using the specified indentation (defaults to 4 spaces if omitted)', normPretty, false)
    .option('--no-color', 'Suppress color output')
    // .option('-s, --sandbox', 'Output data and query in sandbox')
    .option('--verbose', 'Output debug info about actions')
    .action(async function({ options, args }) {
        if (process.stdin.isTTY && !options.input) {
            command.run(['--help']);
            return;
        }

        const startTime = Date.now();
        const displayInfo = options.verbose || options.dryRun;
        const writer = process.stderr.isTTY
            ? new TTYWriter(process.stderr, !displayInfo)
            : displayInfo
                ? new StreamWriter(process.stderr)
                : new SilentWriter();
        const setStageProgress = createDefaultReporter(writer);

        let input;

        try {
            input = !options.input
                ? await readFromStdin(setStageProgress)
                : await readFromFile(options.input, setStageProgress);
        } catch (e) {
            if (e.name === 'SyntaxError') {
                throw new cli.Error('JSON parse error: ' + e.message);
            }

            throw e;
        }

        const query = extractQuery(options.query || args[0]);
        const queryFn = prepareQuery(query);
        const resultData = performQuery(queryFn, input.data, undefined);
        const { compression, encoding } = options;

        writer.log();
        await writeToDestination(resultData, {
            compression,
            encoding,
            displayInfo,
            color: options.color && colorsSupported,
            forceRewrite: options.force,
            dryRun: options.dryRun,
            pretty: options.pretty,
            outputPath: options.output,
            inputPath: options.input
        }, setStageProgress);

        setStageProgress('done', { time: Date.now() - startTime });
    });

export const run = command.run.bind(command);
export function isCliError(err) {
    return err instanceof cli.Error;
}
