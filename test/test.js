const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const pkgJson = path.join(__dirname, '../package.json');
const pkgJsonData = require(pkgJson);
const fs = require('fs');
const fixture = fs.readFileSync(path.join(__dirname, 'color-fixture.json'), 'utf8');
const fixtureData = JSON.parse(fixture);
const fixtureExpected = fs.readFileSync(path.join(__dirname, 'color-fixture.expected'), 'utf8').trim();
const { color } = require('./helpers');
const envWithForceColors = Object.assign({}, process.env, {
    FORCE_COLOR: true
});

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
    let error = '';
    const args = [path.join(__dirname, '../bin/jora')].concat(cliArgs);
    const child = cp.spawn('node', args, {
        stdio: 'pipe',
        env: forceColors ? envWithForceColors : process.env
    });
    const wrapper = new Promise(function(resolve, reject) {
        child.once('exit', code =>
            code ? reject(new Error(error)) : resolve()
        );
    });

    wrapper.input = function(data) {
        child.stdin.write(data);
        child.stdin.end();
        return wrapper;
    };

    wrapper.output = function(expected) {
        const buffer = [];

        child.stdout
            .on('data', chunk => buffer.push(chunk))
            .on('end', function() {
                const data = buffer.join('').trim();

                if (typeof expected === 'function') {
                    expected(data);
                } else {
                    assert.equal(data, expected);
                }
            });

        return wrapper;
    };

    child.stderr.once('data', function(data) {
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
    it('JSON parse error', () =>
        assert.rejects(
            () => run('foo').input('broken json'),
            /JSON parse error/
        )
    );

    it('Query prepare error', () =>
        assert.rejects(
            () => run('broken query').input('{}'),
            /Jora query prepare error/
        )
    );

    it('Query perform error', () =>
        assert.rejects(
            () => run('foo()').input('{}'),
            /Query perform error/
        )
    );
});

describe('colorizer', function() {
    const tests = {
        string: color.STRING,
        number: color.NUMBER,
        emptyArray: () => color.LEFT_BRACKET('[') + color.RIGHT_BRACKET(']'),
        emptyObject: () => color.LEFT_BRACE('{') + color.RIGHT_BRACE('}'),
        null: color.NULL,
        false: color.FALSE,
        true: color.TRUE
    };

    Object.keys(tests).forEach(key => {
        it(`Should colorize "${key}"`, () =>
            runWithForceColors(key)
                .input(fixture)
                .output(tests[key](JSON.stringify(fixtureData[key])))
        );
    });

    // update snapshot
    // FORCE_COLOR=true node bin/jora -p <test/fixture.json >test/fixture.expected.json
    it('Should colorize complex JSON', () =>
        runWithForceColors('-p')
            .input(fixture)
            .output(fixtureExpected)
    );
});
