# Changelog

All notable changes to this project will be documented in this
file.  This project adheres to [Semantic Versioning](http://semver.org/).

## [v1.0.3](https://github.com/stellar/js-xdr/compare/v1.0.2...v1.0.3)

### Changed
- Updated dependencies
- Improved lodash imports (the browser build should be smaller)

## [v1.0.2](https://github.com/stellar/js-xdr/compare/v1.0.1...v1.0.2)

### Changed
- bugfix: removed `runtime` flag from babel to make this package working in React/Webpack environments

## [v1.0.1](https://github.com/stellar/js-xdr/compare/v1.0.0...v1.0.1)

### Changed
- bugfix: padding bytes are now ensured to be zero when reading

## [v1.0.0](https://github.com/stellar/js-xdr/compare/v0.0.12...v1.0.0)

### Changed
- Strings are now encoded/decoded as utf-8

## [v0.0.12](https://github.com/stellar/js-xdr/compare/v0.0.11...v0.0.12)

### Changed
- bugfix: Hyper.fromString() no longer silently accepts strings with decimal points
- bugfix: UnsignedHyper.fromString() no longer silently accepts strings with decimal points
