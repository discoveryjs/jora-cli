const fs = require('fs');
const path = require('path');
const cli = require('clap');
const tempfile = require('tempfile');
const open = require('open');
const createSandboxFileContent = require('jora-sandbox');
const jora = require('jora/dist/jora');
const colorize = require('./utils/colorize');

function readFromStream(stream, processBuffer) {
    const buffer = [];

    stream
        .setEncoding('utf8')
        .on('data', chunk => buffer.push(chunk))
        .on('end', () => processBuffer(buffer.join('')));
}

function processOptions(options, args) {
    const query = options.query || args[0];
    const pretty = options.pretty || false;
    const color = options.color && colorize.supported;
    const sandbox = options.sandbox || false;
    let inputFile = options.input;
    let outputFile = options.output;

    if (process.stdin.isTTY && process.argv.length <= 2) {
        return null;
    }

    if (!inputFile) {
        inputFile = '<stdin>';
    } else {
        inputFile = path.resolve(process.cwd(), inputFile);
    }

    if (outputFile) {
        outputFile = path.resolve(process.cwd(), outputFile);
    }

    return {
        query,
        pretty,
        color,
        sandbox,
        inputFile,
        outputFile
    };
}

function convertUndefinedToNull(value) {
    return value === undefined ? null : value;
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

function prepareQuery(options) {
    return safeOperation('Jora query prepare', () =>
        jora(options.query || '')
    );
}

function prepareData(source) {
    return safeOperation('JSON parse', () =>
        JSON.parse(source)
    );
}

function performQuery(query, data, context) {
    return safeOperation('Query perform', () =>
        query(data, context)
    );
}

function serializeResult(data, options) {
    return safeOperation('Serialize query result', () =>
        JSON.stringify(data, null, options.pretty || undefined)
    );
}

function processStream(options) {
    const inputStream = options.inputFile === '<stdin>'
        ? process.stdin
        : fs.createReadStream(options.inputFile);

    readFromStream(inputStream, function(source) {
        const data = prepareData(source);

        if (options.sandbox) {
            const filepath = tempfile('.html');
            fs.writeFileSync(filepath, createSandboxFileContent(
                { name: options.inputFile, data },
                options.query
            ));
            open(filepath);
            return;
        }

        const query = prepareQuery(options);
        const result = performQuery(query, data, undefined);
        const serializedResult = serializeResult(convertUndefinedToNull(result), options);

        if (options.outputFile) {
            fs.writeFileSync(options.outputFile, serializedResult, 'utf-8');
        } else {
            console.log(options.color ? colorize(serializedResult) : serializedResult);
        }
    });
}

const command = cli.command('jora', '[query]')
    .version(require('./package.json').version)
    .option('-q, --query <query>', 'Jora query')
    .option('-i, --input <filename>', 'Input file')
    .option('-o, --output <filename>', 'Output file (outputs to stdout if not set)')
    .option('-p, --pretty [indent]', 'Pretty print with optionally specified indentation (4 spaces by default)', value =>
        value === undefined ? 4 : Number(value) || false
    , false)
    .option('--no-color', 'Suppress color output')
    .option('-s, --sandbox', 'Output data and query in sandbox')
    .action(function(args) {
        const options = processOptions(this.values, args);

        if (options === null) {
            this.showHelp();
            return;
        }

        processStream(options);
    });

module.exports = {
    run: command.run.bind(command),
    isCliError: function(err) {
        return err instanceof cli.Error;
    }
};
