# XDR, for Javascript

Read/write XDR encoded data structures (RFC 4506)

[![Build Status](https://travis-ci.com/stellar/js-xdr.svg?branch=master)](https://travis-ci.com/stellar/js-xdr)
[![Code Climate](https://codeclimate.com/github/stellar/js-xdr/badges/gpa.svg)](https://codeclimate.com/github/stellar/js-xdr)
[![Dependency Status](https://david-dm.org/stellar/js-xdr.svg)](https://david-dm.org/stellar/js-xdr)
[![devDependency Status](https://david-dm.org/stellar/js-xdr/dev-status.svg)](https://david-dm.org/stellar/js-xdr#info=devDependencies)

XDR is an open data format, specified in
[RFC 4506](http://tools.ietf.org/html/rfc4506.html). This library provides a way
to read and write XDR data from javascript. It can read/write all of the
primitive XDR types and also provides facilities to define readers for the
compound XDR types (enums, structs and unions)

## Installation

via npm:

```shell
npm install --save @stellar/js-xdr
```

## Usage

> **Upgrading from v4?** The schema-definition API changed completely in v5.
> See the [migration guide](MIGRATION.md).

Schemas are built by composing the exported builder functions. Each builder
returns a schema with `encode(value)` → `Uint8Array` and `decode(bytes)` → value:

```javascript
import { bool, int32, uint32, int64 } from '@stellar/js-xdr';

// booleans
bool().decode(Uint8Array.from([0, 0, 0, 0])); // returns false
bool().decode(Uint8Array.from([0, 0, 0, 1])); // returns true

// the inverse of `decode` is `encode`, which returns a Uint8Array
bool().encode(true); // returns Uint8Array.from([0, 0, 0, 1])

// XDR ints and unsigned ints are represented as a JavaScript number
int32().decode(Uint8Array.from([0xff, 0xff, 0xff, 0xff])); // returns -1
uint32().decode(Uint8Array.from([0xff, 0xff, 0xff, 0xff])); // returns 4294967295

// XDR hypers cannot be safely represented in a JavaScript `Number`, so
// `int64`/`uint64` use native `bigint` values
int64().encode(1099511627776n); // Uint8Array(8) [0, 0, 1, 0, 0, 0, 0, 0]
int64().decode(Uint8Array.from([0, 0, 1, 0, 0, 0, 0, 0])); // returns 1099511627776n
```

Compound types (`struct`, `union`, `enumType`, `array`, …) are composed the same
way — see the [migration guide](MIGRATION.md) and [examples](examples/) for the
full set of builders.

## Caveats

There are a couple of caveats to be aware of with this library:

1.  Quadruple precision floating point values are not supported.
2.  NaN is not handled perfectly for floats and doubles. There are several forms
    of NaN as defined by IEEE754, and they are not all round-tripped faithfully.

## Code generation

`js-xdr` by itself does not have any ability to parse XDR IDL files and produce
a parser for your custom data types. Instead, that is the responsibility of
[`xdrgen`](http://github.com/stellar/xdrgen). xdrgen will take your .x files
and produce a javascript file that target this library to allow for your own
custom types.

See [`stellar-base`](http://github.com/stellar/js-stellar-base) for an example
(check out the src/generated directory)

## Contributing

Please [see CONTRIBUTING.md for details](CONTRIBUTING.md).

## Development Setup

**Requirements:**
- Node.js ≥ 20.0.0
- pnpm ≥ 9.0
- Git

**Setup Steps:**

1. Clone the repository
   ```shell
   git clone https://github.com/stellar/js-xdr.git
   cd js-xdr
   ```

2. Install pnpm (if not already installed)
   ```shell
   npm install -g pnpm
   ```

3. Install dependencies
   ```shell
   pnpm install
   ```

4. Run tests
   ```shell
   pnpm test
   ```

**Development Tips:**

- Run `pnpm fmt` to format code with Prettier
- Pre-commit hooks will automatically format staged files
- Use `nvm` to manage Node versions: https://github.com/creationix/nvm

**Note:** While the built library supports multiple Node versions, development requires Node.js ≥ 20.0.0 and pnpm ≥ 9.0.

