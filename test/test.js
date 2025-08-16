import assert from 'assert';
import path from 'path';
import fs from 'fs';
import tempfile from 'tempfile';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { parseJsonxl, style } from './helpers.js';
import { deflateSync, gunzipSync, gzipSync, inflateSync } from 'zlib';

const testFileParsers = {
    '.json': JSON.parse,
    '.jsonxl': parseJsonxl
};
const isBinary = new Set(['.jsonxl', '.jsonxl.gz', '.json.gz']);

function fixtureFile(filename) {
    const filepath = path.join(fixtureDir, filename);
    const raw = fs.readFileSync(filepath);
    const parser = testFileParsers[path.extname(filepath)] || null;
    const data = parser && parser(raw);

    return {
        path: filepath,
        raw,
        text: !isBinary.has(path.extname(filepath)) ? raw.toString('utf8') : undefined,
        data,
        string: JSON.stringify(data)
    };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(__dirname, '../fixtures');
const queryFilename = path.join(fixtureDir, 'query.jora');
const packageJson = fixtureFile('../package.json');
const fixtureJson = fixtureFile('data.json');
const fixtureJsonxl = fixtureFile('data.jsonxl');
const colorFixture = fixtureFile('color-output.json');
const colorFixtureExpected = fixtureFile('color-output.expected').text.trim();
const colorFixtureExpectedCompact = fixtureFile('color-output.compact.expected').text.trim();
const envWithForceColors = Object.assign({}, process.env, {
    FORCE_COLOR: true
});
const nonJsonValues = {
    undefined: 'undefined',
    NaN: '0/0',
    Infinity: '1/0',
    NegativeInfinity: '1/-0'
};

function match(rx) {
    return actual => rx.test(actual);
}

function run(...args) {
    return runCli(false, args);
}

function runWithForceColors(...args) {
    return runCli(true, args);
}

function assertCompressedFactory(type) {
    let decompress = null;
    switch (type) {
        case 'gzip': decompress = gunzipSync; break;
        case 'deflate': decompress = inflateSync; break;
        default:
            throw new Error('Unknown type');
    }

    return function(expected) {
        return function(actual) {
            assert.deepEqual(decompress(actual), expected);
        };
    };
}

function createStreamAssert(stream, expected) {
    const buffer = [];

    stream.on('data', chunk => buffer.push(chunk));

    return function() {
        const data = Buffer.concat(buffer);
        buffer.length = 0;

        if (typeof expected === 'function') {
            expected(data);
        } else if (expected instanceof RegExp) {
            assert.match(data.toString().trimEnd(), expected);
        } else if (typeof expected === 'string') {
            assert.equal(data.toString().trimEnd(), expected);
        } else {
            assert.deepEqual(data, Buffer.from(expected));
        }
    };
}

function runCli(forceColors, cliArgs) {
    let assertStdout = () => {};
    let assertStderr = null;
    let error = '';
    const args = [path.join(__dirname, '../bin/jora')].concat(cliArgs);
    const child = spawn('node', args, {
        stdio: 'pipe',
        env: forceColors ? envWithForceColors : process.env
    });
    const wrapper = new Promise(function(resolve, reject) {
        child.once('exit', (code) => {
            if ((error && !assertStderr) || code) {
                reject(new Error(error || 'Process exit with code' + code));
                return;
            }

            assertStdout();
            assertStderr?.();
            resolve();
        });
    });

    wrapper.input = function(data) {
        child.stdin.write(data);
        child.stdin.end();
        return wrapper;
    };

    wrapper.output = function(expected) {
        assertStdout = createStreamAssert(child.stdout, expected);
        return wrapper;
    };

    wrapper.stderr = function(expected) {
        assertStderr = createStreamAssert(child.stderr, expected);
        return wrapper;
    };

    child.stderr.on('data', function(data) {
        error += data;
    });

    return wrapper;
}

// it('should output help when no arguments', () =>
//     run()
//         .output(match(/Usage:\s+jora/))
// );

it('should output help with `-h` or `--help`', () =>
    run('-h')
        .output(match(/Usage:\s+jora/))
);

it('should output data itself when no query', () =>
    run()
        .input('42')
        .output('42')
);

describe('non-JSON primitives', () => {
    Object.keys(nonJsonValues).forEach(key =>
        it(key, () =>
            run('-q', nonJsonValues[key])
                .input('{}')
                .output('null')
        )
    );
});

it('should output version', () =>
    run('-v')
        .output(packageJson.data.version)
);

it('should read content from stdin if no file specified', () =>
    run('version')
        .input(fixtureJson.string)
        .output(JSON.stringify(fixtureJson.data.version))
);

it('should read from file', () =>
    run('-i', fixtureJson.path, '-q', 'version')
        .output(JSON.stringify(fixtureJson.data.version))
);

it('should write to file', async () => {
    const filename = tempfile({ extension: '.json' });

    await run('-o', filename, '-q', 'version')
        .input(fixtureJson.string)
        .output('');

    assert(fs.existsSync(filename));
    assert.strictEqual(fs.readFileSync(filename, 'utf8'), JSON.stringify(fixtureJson.data.version));
});

it('--verbose', () =>
    run('--verbose', 'version')
        .input(fixtureJson.string)
        .output(JSON.stringify(fixtureJson.data.version))
        .stderr(/Input from/)
);

it('--dry-run', () =>
    run('--dry-run', 'version')
        .input(fixtureJson.string)
        .output('')
        .stderr(/Input from/)
);

describe('query from a file', () => {
    it('as arg', () =>
        run(queryFilename)
            .input(fixtureJson.string)
            .output(JSON.stringify(fixtureJson.data.version))
    );

    it('as option', () =>
        run('-q', queryFilename)
            .input(fixtureJson.string)
            .output(JSON.stringify(fixtureJson.data.version))
    );
});

describe('jsonxl', () => {
    it('should read from jsonxl file', () =>
        run('-i', fixtureJsonxl.path, '-q', 'version')
            .output(JSON.stringify(fixtureJsonxl.data.version))
    );

    it('jsonxl -> JSON', () =>
        run()
            .input(fixtureJsonxl.raw)
            .output(fixtureJsonxl.string)
    );

    it('should output jsonxl', () =>
        run('-e', 'jsonxl')
            .input(fixtureJsonxl.raw)
            .output(fixtureJsonxl.raw)
    );

    it('JSON -> jsonxl', () =>
        run('-e', 'jsonxl')
            .input(fixtureJsonxl.string)
            .output(fixtureJsonxl.raw)
    );

    it('--dry-run jsonxl output', () =>
        run('--dry-run', 'version', '-e', 'jsonxl')
            .input(fixtureJson.string)
            .output('')
            .stderr(/Encoded jsonxl/)
    );
});

describe('compression', function() {
    describe('gzip', () => {
        describe('input', () => {
            it('JSON', () =>
                run()
                    .input(gzipSync(fixtureJson.raw))
                    .output(fixtureJson.string)
            );

            it('JSONXL', () =>
                run()
                    .input(gzipSync(fixtureJsonxl.raw))
                    .output(fixtureJsonxl.string)
            );
        });

        describe('output', () => {
            const assertCompressed = assertCompressedFactory('gzip');

            it('JSON', () =>
                run('-c')
                    .input(fixtureJson.text)
                    .output(assertCompressed(Buffer.from(fixtureJson.string)))
            );

            it('JSON (explicit -c gzip)', () =>
                run('-c', 'gzip')
                    .input(fixtureJson.text)
                    .output(assertCompressed(Buffer.from(fixtureJson.string)))
            );

            it('formatted JSON', () =>
                run('-c', '-p')
                    .input(fixtureJson.text)
                    .output(assertCompressed(Buffer.from(fixtureJson.text.trim())))
            );

            it('JSONXL', () =>
                run('-c', '-e', 'jsonxl')
                    .input(fixtureJsonxl.raw)
                    .output(assertCompressed(fixtureJsonxl.raw))
            );
        });
    });

    describe('deflate', () => {
        describe('input', () => {
            it('JSON', () =>
                run()
                    .input(deflateSync(fixtureJson.raw))
                    .output(fixtureJson.string)
            );

            it('JSONXL', () =>
                run()
                    .input(deflateSync(fixtureJsonxl.raw))
                    .output(fixtureJsonxl.string)
            );
        });

        describe('output', () => {
            const assertCompressed = assertCompressedFactory('deflate');

            it('JSON', () =>
                run('-c', 'deflate')
                    .input(fixtureJson.text)
                    .output(assertCompressed(Buffer.from(fixtureJson.string)))
            );

            it('JSONXL', () =>
                run('-c', 'deflate', '-e', 'jsonxl')
                    .input(fixtureJsonxl.raw)
                    .output(assertCompressed(fixtureJsonxl.raw))
            );
        });
    });
});

describe('pretty print', function() {
    it('indentation should be 4 spaces by default', () =>
        run('dependencies.keys()', '-p')
            .input(fixtureJson.string)
            .output(JSON.stringify(Object.keys(fixtureJson.data.dependencies), null, 4))
    );

    it('indentation should be as specified', () =>
        run('dependencies.keys()', '-p', '3')
            .input(fixtureJson.string)
            .output(JSON.stringify(Object.keys(fixtureJson.data.dependencies), null, 3))
    );
});

describe('errors', function() {
    it('JSON parse', () =>
        assert.rejects(
            () => run('foo').input('broken json'),
            /JSON parse error/
        )
    );

    it('Query prepare', () =>
        assert.rejects(
            () => run('broken query').input('{}'),
            /Jora query prepare error/
        )
    );

    it('Query perform', () =>
        assert.rejects(
            () => run('foo()').input('{}'),
            /Query perform error/
        )
    );
});

// FIXME: skip colored output tests for Windows since no way currently to pass custom env variable (FORCE_COLOR) to a child process
// FIXME: --color temporary disabled
(process.platform !== 'win32' ? describe : describe.skip)('colored output', function() {
    const tests = {
        string: style('STRING', JSON.stringify(colorFixture.data.string)),
        number: style('NUMBER', colorFixture.data.number),
        emptyArray: style('LEFT_BRACKET', '[', 'RIGHT_BRACKET', ']'),
        emptyObject: style('LEFT_BRACE', '{', 'RIGHT_BRACE', '}'),
        singlePropObject: style('LEFT_BRACE', '{', 'STRING_KEY', '"', 'STRING_KEY_CONTENT', 'foo', 'STRING_KEY', '"', 'COLON', ':', 'STRING', '"test"', 'RIGHT_BRACE', '}'),
        null: style('NULL', 'null'),
        false: style('FALSE', 'false'),
        true: style('TRUE', 'true')
    };

    Object.keys(tests).forEach(key => {
        it(key, () =>
            runWithForceColors(key)
                .input(colorFixture.string)
                .output(tests[key])
        );
    });

    // non JSON values
    describe('non-JSON primitives', () =>
        Object.keys(nonJsonValues).forEach(key =>
            it(key, () =>
                runWithForceColors('-q', nonJsonValues[key])
                    .input('{}')
                    .output(style('NULL', 'null'))
            )
        )
    );

    // How to update snapshot:
    describe('Complex JSON', () => {
        // FORCE_COLOR=true node bin/jora <test/color-fixture.json >test/color-fixture.string.expected
        it('compact', () =>
            runWithForceColors()
                .input(colorFixture.string)
                .output(colorFixtureExpectedCompact)
        );

        // FORCE_COLOR=true node bin/jora -p <test/color-fixture.json >test/color-fixture.expected
        it('pretty print', () =>
            runWithForceColors('-p')
                .input(colorFixture.string)
                .output(colorFixtureExpected)
        );
    });

    it('--no-color should suppress output coloring', () =>
        runWithForceColors('--no-color')
            .input(colorFixture.string)
            .output(JSON.stringify(colorFixture.data))
    );
});
