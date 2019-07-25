const assert = require('assert');
const path = require('path');
const child = require('child_process');
const cmd = 'node';
const pkgJson = path.join(__dirname, '../package.json');
const pkgJsonData = require(pkgJson);
const fs = require('fs');
const colorize = require('../utils/colorize');
const fixture = require('../test/fixture.json');
const ansiRegex = require('ansi-regex');
const {
    STRING,
    NUMBER,
    EMPTY_ARRAY,
    EMPTY_OBJECT,
    NULL,
    FALSE,
    TRUE
} = require('./helpers');

function match(rx) {
    return actual => rx.test(actual);
}

function matchANSI(fixture) {
    return data => assert.deepEqual(data.match(ansiRegex()), fixture);
}

function run() {
    var args = [path.join(__dirname, '../bin/jora')].concat(Array.prototype.slice.call(arguments));
    var proc = child.spawn(cmd, args, { stdio: 'pipe', env: { FORCE_COLOR: true } });
    var error = '';
    var wrapper = new Promise(function(resolve, reject) {
        proc.once('exit', code =>
            code ? reject(new Error(error)) : resolve()
        );
    });

    wrapper.input = function(data) {
        proc.stdin.write(data);
        proc.stdin.end();
        return wrapper;
    };

    wrapper.output = function(expected) {
        var buffer = [];

        proc.stdout
            .on('data', function(chunk) {
                buffer.push(chunk);
            })
            .on('end', function() {
                var data = buffer.join('').trim();

                if (typeof expected === 'function') {
                    expected(data);
                } else {
                    assert.equal(data, expected);
                }
            });

        return wrapper;
    };

    proc.stderr.once('data', function(data) {
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
    run('--no-color')
        .input('42')
        .output('42')
);

it('should output version', () =>
    run('-v')
        .output(pkgJsonData.version)
);

it('should read content from stdin if no file specified', () =>
    run('version', '--no-color')
        .input(JSON.stringify(pkgJsonData))
        .output(JSON.stringify(pkgJsonData.version))
);

it('should read from file', () =>
    run('-i', pkgJson, '-q', 'version', '--no-color')
        .output(JSON.stringify(pkgJsonData.version))
);

describe('pretty print', function() {
    it('indentation should be 4 spaces by default', () =>
        run('dependencies.keys()', '-p', '--no-color')
            .input(JSON.stringify(pkgJsonData))
            .output(JSON.stringify(Object.keys(pkgJsonData.dependencies), null, 4))
    );

    it('indentation should be as specified', () =>
        run('dependencies.keys()', '-p', '3', '--no-color')
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
    it('Should colorize string', () =>
        run('string')
            .input(JSON.stringify(fixture))
            .output(matchANSI(STRING))
    );
    it('Should colorize number', () =>
        run('number')
            .input(JSON.stringify(fixture))
            .output(matchANSI(NUMBER))
    );
    it('Should colorize empty array', () =>
        run('emptyArray')
            .input(JSON.stringify(fixture))
            .output(matchANSI(EMPTY_ARRAY))
    );
    it('Should colorize empty object', () =>
        run('emptyArray')
            .input(JSON.stringify(fixture))
            .output(matchANSI(EMPTY_OBJECT))
    );
    it('Should colorize empty object', () =>
        run('null')
            .input(JSON.stringify(fixture))
            .output(matchANSI(NULL))
    );
    it('Should colorize empty object', () =>
        run('false')
            .input(JSON.stringify(fixture))
            .output(matchANSI(FALSE))
    );
    it('Should colorize empty object', () =>
        run('true')
            .input(JSON.stringify(fixture))
            .output(matchANSI(TRUE))
    );
    it('Should colorize raw complex JSON', () =>
        colorize(
            fs.readFileSync(path.resolve(__dirname, './fixture.json')).toString()
        ).match(ansiRegex())
    );
});
