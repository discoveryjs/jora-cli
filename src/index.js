import fs from 'fs';
import path from 'path';
import * as cli from 'clap';
// import tempfile from 'tempfile';
// import open from 'open';
// import createSandboxFileContent from 'jora-sandbox';
import jora from 'jora';
import { colorsSupported } from './colorize.js';
import { readFromFile, readFromStdin } from './read-from-stream.js';
import { createDefaultReporter, SilentWriter, StreamWriter, TTYWriter } from './reporter.js';
import { writeToDestination } from './write.js';

// function processOptions(options, args) {
//     const query = options.query || args[0];
//     const pretty = options.pretty || false;
//     const color = options.color && colorsSupported;
//     const sandbox = options.sandbox || false;
//     let inputFile = options.input;
//     let outputFile = options.output;

//     if (process.stdin.isTTY && process.argv.length <= 2) {
//         return null;
//     }

//     if (!inputFile) {
//         inputFile = '<stdin>';
//     } else {
//         inputFile = path.resolve(process.cwd(), inputFile);
//     }

//     if (outputFile) {
//         outputFile = path.resolve(process.cwd(), outputFile);
//     }

//     return {
//         query,
//         pretty,
//         color,
//         sandbox,
//         inputFile,
//         outputFile
//     };
// }

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

const encodings = ['json', 'jsonxl'];
const command = cli.command('jora [query]')
    .version('', '', '', () => console.log(JSON.parse(fs.readFileSync('./package.json')).version))
    .option('-q, --query <query>', 'Jora query or path to a query file with extension .jora', normFilepath)
    .option('-i, --input <filename>', 'Input file', normFilepath)
    .option('-o, --output <filename>', 'Output file (outputs to stdout if not set)')
    .option('-e, --encoding <encoding>', 'Output encoding: json (default), jsonxl (snapshot9)', normFormat, 'json')
    .option('--dry-run', 'Don\'t output result, only report what it would have done')
    .option('-f, --force', 'Force overwriting output file')
    .option('-p, --pretty [indent]', 'Pretty print with optionally specified indentation (4 spaces by default)', value =>
        value === undefined ? 4 : Number(value) || false
    , false)
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

        // if (options.sandbox) {
        //     const filepath = tempfile({ extension: '.html' });
        //     fs.writeFileSync(filepath, createSandboxFileContent(
        //         { name: options.inputFile, data },
        //         options.query
        //     ));
        //     open(filepath);
        //     return;
        // }

        const query = extractQuery(options.query || args[0]);
        const queryFn = prepareQuery(query);
        const resultData = performQuery(queryFn, input.data, undefined);
        const encoding = options.encoding;

        writer.log();
        await writeToDestination(resultData, {
            encoding,
            displayInfo,
            color: options.color && colorsSupported,
            forceRewrite: options.force,
            dryRun: options.dryRun,
            pretty: options.pretty,
            outputPath: options.output,
            inputPath: options.input
        }, setStageProgress);

        // if (options.output) {
        //     pipeline(
        //         stringifyChunked(result, null, options.pretty),
        //         fs.createWriteStream(options.outputFile)
        //     );
        // } else {
        //     const serializedResult = JSON.stringify(result ?? null, null, options.pretty);
        //     console.log(options.color ? colorize(serializedResult) : serializedResult);
        // }

        setStageProgress('done', { time: Date.now() - startTime });
    });

export const run = command.run.bind(command);
export function isCliError(err) {
    return err instanceof cli.Error;
}
