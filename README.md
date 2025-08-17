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
    -c, --compression [name]     Compress output: gzip (default when [name] is omitted), deflate
        --dry-run                Don't output result, only report what it would have done (enables --verbose mode)
    -e, --encoding <encoding>    Output encoding: json (default), jsonxl (snapshot9)
    -f, --force                  Force overwriting output file
    -h, --help                   Output usage information
    -i, --input <filename>       Input file
    -o, --output <filename>      Output file (outputs to stdout if not set)
    -p, --pretty [indent]        Pretty-prints output with specified indentation (4 spaces if [indent] is omitted)
    -q, --query <query>          Jora query or path to a query file with extension .jora
        --verbose                Output debug info about actions
    -v, --version                Output version
```

## Examples

- Get a single field from, e.g. "version":

  ```bash
  jora <package.json version
  ```

- Get all top level dependencies count:

  ```bash
  jora -i package.json -q '(dependencies.keys() + devDependencies.keys()).size()'
  ```

- Find packages with more than a single version (run query from a file)

  ```bash
  npm ls --json | jora find-multi-version-packages.jora
  ```

  The content of `find-multi-version-packages.jora` may be as follows:

  ```js
  ..(dependencies.entries().({ name: key, ...value }))
      .group(=>name, =>version)
      .({ name: key, versions: value })
      .[versions.size() > 1]
  ```

- Supported queries from JSONXL, and conversion JSON ⇄ JSONXL.
    > Note: JSONXL is a binary replacement for JSON. It is supported by any app built on [Discovery.js](https://github.com/discoveryjs/discovery), including [JsonDiscovery](https://github.com/discoveryjs/JsonDiscovery), [CPUpro](https://github.com/discoveryjs/cpupro) and [Statoscope](https://github.com/statoscope/statoscope). JSONXL not only saves space and transfer time but also offers faster decoding and a lower memory footprint, which is beneficial for processing large datasets.
    - Queries for JSONXL input work the same ways as for JSON:
      ```bash
      jora <input.jsonxl "select.something"
      ```
    - Convert JSON into JSONXL:
      ```bash
      jora <input.json >output.jsonxl -e jsonxl
      ```
    - Convert JSONXL into JSON
      ```
      jora <input.jsonxl >output.json
      ```

* Supported gzip and deflate as input and output

    > `jora-cli` can **read** gzip/deflate on input (auto-detected) and **write** compressed output via `--compression` (`-c`).
    > - Input compression is detected automatically for both stdin and `-i <file>`.
    > - `--compression` (`-c`) affects **output** only; omit the name to default to `gzip`.
    > - Compression is applied after encoding/pretty-printing.
    > - Choose an appropriate extension for compressed files (e.g. `.json.gz`, `.jsonxl.gz`, `.deflate`).

    * **Reading compressed input** (auto-detected for `gzip` and `deflate`, works for files and stdin):

      ```bash
      # query a gzipped JSON
      jora < data.json.gz "stats.total"

      # query a deflated JSON (raw deflate stream)
      jora -i data.json.deflate "items.size()"

      # pipe from cat/gunzip as well
      cat data.json.gz | jora "select.deep.field"
      ```

    * **Writing compressed output** using `-c, --compression`:

      ```bash
      # gzip-compress output (default when name is omitted)
      jora -i data.json -q "items.group(=>type)" -c > result.json.gz

      # explicitly choose deflate
      jora < data.json "items.pick(=>active)" -c deflate > result.json.deflate
      ```

  * **Mixing with JSONXL encoding**:

      ```bash
      # convert JSON -> JSONXL and gzip the result (most compact output combo)
      jora < data.json > data.jsonxl.gz -e jsonxl -c

      # read gzipped JSON, query, and write gzipped JSONXL in one go
      jora < data.json.gz -q "heavy.[score > 0.9]" -e jsonxl -c > filtered.jsonxl.gz

      # convert JSONXL -> JSON while keeping compression on output
      jora < data.jsonxl -e json -c > data.json.gz
      ```

## Caveats

`jora-cli` takes a valid JSON and produce a valid JSON as a result. However, `jora` language could produce some values that incompatable with JSON, such values are transforming:

- `NaN`, `Infinity` and `-Infinity` are converting to `null`, that's a behaviour of `JSON.stringify()`
- `undefined`
  - is convering to `null` when a result of query (top level) or an element of an array
  - object entries with `undefined` as a value are eliminating

## License

MIT
