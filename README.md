# Jora CLI

[![NPM version](https://img.shields.io/npm/v/jora-cli.svg)](https://www.npmjs.com/package/jora-cli)
[![Build Status](https://travis-ci.org/discoveryjs/jora-cli.svg?branch=master)](https://travis-ci.org/discoveryjs/jora-cli)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora-cli/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora-cli?)

Command line interface for [Jora](https://github.com/discoveryjs/jora)

## Install

```bash
npm i -g jora-cli
```

## Usage

```bash
> jora -h
Usage:

  csso [query] [options]

Options:

  -h, --help               Output usage information
  -i, --input <filename>   Input file
  -o, --output <filename>  Output file (outputs to stdout if not set)
  -p, --pretty [indent]    Pretty print with optionally specified indentation(4
                           spaces by default)
  -q, --query <query>      Jora query
  -v, --version            Output version
```

## Examples

Then you can do this wonderful requests in terminal
```bash
# get a single field, e.g. version
jora package.json version

# get all top level dependencies count
jora package.json '(.dependencies.keys() + .devDependencies.keys()).size()'

# find dublicated packages
npm ls --json | jora "
    ..(dependencies.mapToArray())
        .group(<key>, <version>)
        .({ name: key, versions: value })
        .[versions.size() > 1]
";
```

## License

MIT
