const assert = require('assert');
const path = require('path');
const child = require('child_process');
const cmd = 'node';
const pkgJson = path.join(__dirname, '../package.json');
const pkgJsonData = require(pkgJson);

function run() {
    var args = [path.join(__dirname, '../bin/jora')].concat(Array.prototype.slice.call(arguments));
    var proc = child.spawn(cmd, args, { stdio: 'pipe' });
    var error = '';
    var wrapper = new Promise(function(resolve, reject) {
        proc.once('exit', function(code) {
            code ? reject(new Error(error)) : resolve();
        });
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

                switch (typeof expected) {
                    case 'function':
                        expected(data);
                        break;

                    default:
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
