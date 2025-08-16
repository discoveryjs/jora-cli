## next

- Added `gzip` and `deflate` compression support for input data
- Updated jsonxl
    - Fixed an edge case for signed numbers in the range ±[MAX_SAFE_INTEGER/2 … MAX_SAFE_INTEGER].
    - Removed the limitation on total encoded string length exceeding the maximum string length (~500 MB for V8)
- Fixed displaying of output progress for jsonxl

## 2.0.3 (July 10, 2025)

- Fixed an exception when running `jora -v`

## 2.0.2 (July 10, 2025)

- Bumped jora to 1.0.0-beta.15 (fixes a security issue, see [1.0.0-beta.14 release notes](https://github.com/discoveryjs/jora/releases/tag/v1.0.0-beta.14))

## 2.0.1 (February 6, 2025)

- Fixed missed package files

## 2.0.0 (February 6, 2025)

- Bumped jora to 1.0.0-beta.13
- Added support for JSONXL (snapshot9) as input encoding
- Added `--encoding` option to specify output encoding, supported JSON and JSONXL
- Added `--force` option to enforce overwritting a file
- Added `--dry-run` option
- Added `--verbose` option
- Extended the `--query` option to accept a file path containing a Jora query, the file must have a `.jora` extension
- Changed behavior for writing to an existing file specified with the --output option. The operation now fails unless the --force option is used
- Removed `--sandbox` option (until re-implemented)

## 1.5.1 (July 29, 2021)

- Bumped jora-sandbox to 1.3.0

## 1.5.0 (November 12, 2020)

- Bumped jora to 1.0.0-beta.5

## 1.4.0 (May 20, 2020)

- Bumped jora to 1.0.0-beta.2
- Bumped jora-sandbox to 1.2.1

## 1.3.0 (December 17, 2019)

- Bumped jora to 1.0.0-alpha.11
- Bumped jora-sandbox to 1.1.0

## 1.2.0 (September 19, 2019)

- Added `--sandbox` option to open data and query in sandbox (opens in a browser a web interface with injected data and query saved in a temporary file)

## 1.1.1 (August 21, 2019)

- Fixed missed files in package

## 1.1.0 (August 22, 2019)

- Added output highlighting when appropriate. Use `--no-color` option to suppress color output (#2)
- Fixed output of `undefined` value

## 1.0.1 (July 4, 2019)

- Used dist version of `jora` to reduce startup time (up to 10x times)
- Removed wrongly added dependency
- Fixed command name in help info
- Fixed returning `undefined` when no query, now command returns input itself as when query is empty string

## 1.0.0 (July 4, 2019)

- Initial release
