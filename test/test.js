import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { parseJsonxl, style } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgJson = path.join(__dirname, '../package.json');
const pkgJsonData = JSON.parse(fs.readFileSync(pkgJson));
const fixture = fs.readFileSync(path.join(__dirname, 'color-fixture.json'), 'utf8');
const fixtureData = JSON.parse(fixture);
const fixtureJsonxlFilename = path.join(__dirname, './fixture.jsonxl');
const fixtureJsonxl = fs.readFileSync(fixtureJsonxlFilename);
const fixtureJsonxlData = parseJsonxl(fixtureJsonxl);
const fixtureJsonxlJson = JSON.stringify(fixtureJsonxlData);
const fixtureExpected = fs.readFileSync(path.join(__dirname, 'color-fixture.expected'), 'utf8').trim();
const fixtureExpectedCompact = fs.readFileSync(path.join(__dirname, 'color-fixture.compact.expected'), 'utf8').trim();
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

function runCli(forceColors, cliArgs) {
    let assertStdout = () => {};
    let error = '';
    const args = [path.join(__dirname, '../bin/jora')].concat(cliArgs);
    const child = spawn('node', args, {
        stdio: 'pipe',
        env: forceColors ? envWithForceColors : process.env
    });
    const wrapper = new Promise(function(resolve, reject) {
        child.once('exit', (code) => {
            if (error || code) {
                reject(new Error(error || 'Process exit with code' + code));
                return;
            }

            assertStdout();
            resolve();
        });
    });

    wrapper.input = function(data) {
        child.stdin.write(data);
        child.stdin.end();
        return wrapper;
    };

    wrapper.output = function(expected) {
        const buffer = [];

        child.stdout.on('data', chunk => buffer.push(chunk));
        assertStdout = function() {
            const data = buffer.join('').trim();

            if (typeof expected === 'function') {
                expected(data);
            } else {
                assert.equal(data, expected);
            }
        };

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
        .output(pkgJsonData.version)
);

it('should read content from stdin if no file specified', () =>
    run('version')
        .input(JSON.stringify(pkgJsonData))
        .output(JSON.stringify(pkgJsonData.version))
);

it('should read from file', () =>
    run('-i', pkgJson, '-q', 'version')
        .output(JSON.stringify(pkgJsonData.version))
);

describe('jsonxl', () => {
    it('should read from jsonxl file', () =>
        run('-i', fixtureJsonxlFilename, '-q', 'version')
            .output(JSON.stringify(fixtureJsonxlData.version))
    );

    it('jsonxl -> JSON', () =>
        run()
            .input(fixtureJsonxl)
            .output(fixtureJsonxlJson)
    );

    it('should output jsonxl', () =>
        run('-e', 'jsonxl')
            .input(fixtureJsonxl)
            .output(fixtureJsonxl)
    );

    it('JSON -> jsonxl', () =>
        run('-e', 'jsonxl')
            .input(fixtureJsonxlJson)
            .output(fixtureJsonxl)
    );
});

describe('pretty print', function() {
    it('indentation should be 4 spaces by default', () =>
        run('dependencies.keys()', '-p')
            .input(JSON.stringify(pkgJsonData))
            .output(JSON.stringify(Object.keys(pkgJsonData.dependencies), null, 4))
    );

    it('indentation should be as specified', () =>
        run('dependencies.keys()', '-p', '3')
            .input(JSON.stringify(pkgJsonData))
            .output(JSON.stringify(Object.keys(pkgJsonData.dependencies), null, 3))
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
(false && process.platform !== 'win32' ? describe : describe.skip)('colored output', function() {
    const tests = {
        string: style('STRING', JSON.stringify(fixtureData.string)),
        number: style('NUMBER', fixtureData.number),
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
                .input(fixture)
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
        // FORCE_COLOR=true node bin/jora <test/color-fixture.json >test/color-fixture.compact.expected
        it('compact', () =>
            runWithForceColors()
                .input(fixture)
                .output(fixtureExpectedCompact)
        );

        // FORCE_COLOR=true node bin/jora -p <test/color-fixture.json >test/color-fixture.expected
        it('pretty print', () =>
            runWithForceColors('-p')
                .input(fixture)
                .output(fixtureExpected)
        );
    });

    it('--no-color should suppress output coloring', () =>
        runWithForceColors('--no-color')
            .input(fixture)
            .output(JSON.stringify(fixtureData))
    );
});
