# jora-cli

[![NPM version](https://img.shields.io/npm/v/jora-cli.svg)](https://www.npmjs.com/package/jora-cli)
[![Build Status](https://github.com/discoveryjs/jora-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/discoveryjs/jora-cli/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora-cli/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora-cli?)

Command line interface for [Jora](https://github.com/discoveryjs/jora) (a JSON query language)

![jora-cli-demo](https://user-images.githubusercontent.com/270491/63531735-d4fd5980-c511-11e9-95ff-ed58dc94738a.gif)

## Install

```bash
npm i -g jora-cli
```

## Usage

```bash
> jora -h
Usage:

    jora [query] [options]

Options:

        --no-color               Suppress color output
        --dry-run                Don't output result, only report what it would have done
    -e, --encoding <encoding>    Output encoding: json (default), jsonxl (snapshot9)
    -f, --force                  Force overwriting output file
    -h, --help                   Output usage information
    -i, --input <filename>       Input file
    -o, --output <filename>      Output file (outputs to stdout if not set)
    -p, --pretty [indent]        Pretty print with optionally specified indentation (4 spaces by default)
    -q, --query <query>          Jora query
        --verbose                Output debug info about actions
    -v, --version                Output version
```

## Examples

Then you can do this wonderful requests in terminal
```bash
# get a single field, e.g. version
jora version <package.json

# get all top level dependencies count
jora -i package.json -q '(dependencies.keys() + devDependencies.keys()).size()'

# find packages with more than a single version
npm ls --json | jora "
    ..(dependencies.entries().({ name: key, ...value }))
        .group(=>name, =>version)
        .({ name: key, versions: value })
        .[versions.size() > 1]
";
```

## Caveats

`jora-cli` takes a valid JSON and produce a valid JSON as a result. However, `jora` language could produce some values that incompatable with JSON, such values are transforming:

- `NaN`, `Infinity` and `-Infinity` are converting to `null`, that's a behaviour of `JSON.stringify()`
- `undefined`
  - is convering to `null` when a result of query (top level) or an element of an array
  - object entries with `undefined` as a value are eliminating

## License

MIT
