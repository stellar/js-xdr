# XDR, for Javascript

Read/write XDR encoded data structures (RFC 4506)

[![Tests](https://github.com/stellar/js-xdr/actions/workflows/tests.yml/badge.svg)](https://github.com/stellar/js-xdr/actions/workflows/tests.yml)
[![npm version](https://img.shields.io/npm/v/@stellar/js-xdr)](https://www.npmjs.com/package/@stellar/js-xdr)

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

> **Upgrading from v4?** The schema-definition API changed completely in v5. See
> the [migration guide](MIGRATION.md).

Schemas are built by composing the exported builder functions. Each builder
returns a schema with `encode(value)` → `Uint8Array` and `decode(bytes)` →
value:

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

Compound types are composed the same way. Struct values are plain objects,
union values are tagged objects, and enum members are plain numbers:

```javascript
import {
  enumType,
  struct,
  union,
  uint32,
  int32,
  void as xdrVoid,
  case as xdrCase,
  field
} from '@stellar/js-xdr';

const Color = struct('Color', {
  red: uint32(),
  green: uint32(),
  blue: uint32()
});
Color.encode({ red: 1, green: 2, blue: 3 }); // Uint8Array(12)

const ResultType = enumType('ResultType', { ok: 0, error: 1 });
const Result = union('Result', {
  switchOn: ResultType,
  cases: [
    xdrCase('ok', ResultType.ok, xdrVoid()),
    xdrCase('error', ResultType.error, field('code', int32()))
  ]
});
Result.encode({ type: ResultType.error, code: 7 });
```

Recursive or forward references use `lazy(() => schema)`, optionals use
`option(element)` (absent is `null`), and `validate(value)` /
`validateXdr(bytes)` check values and bytes without throwing. See the
[migration guide](MIGRATION.md) and [examples](examples/) for the full set of
builders.

### TypeScript

Schemas carry full type information. Derive the value type of any schema with
`Infer` instead of writing it by hand:

```typescript
import type { Infer } from '@stellar/js-xdr';

type ColorValue = Infer<typeof Color>;
// { readonly red: number; readonly green: number; readonly blue: number }
```

## Caveats

There are a couple of caveats to be aware of with this library:

1.  Quadruple precision floating point values are not supported.
2.  NaN payload bits are not preserved for floats and doubles. IEEE-754 defines
    many NaN bit patterns; they all decode to the JavaScript `NaN`, which
    re-encodes as the canonical quiet NaN.

## Code generation

`js-xdr` by itself does not have any ability to parse XDR IDL files and produce
schemas for your custom data types. For an example of a code generator that
targets this library, see the
[`tools/xdrgen/generate.mjs`](https://github.com/stellar/js-stellar-sdk/blob/main/tools/xdrgen/generate.mjs)
script in [`js-stellar-sdk`](https://github.com/stellar/js-stellar-sdk): it
reads a JSON schema graph (`xdr/xdr.json`) and emits TypeScript files built on
this library. Its output lives in that repository's `src/xdr/generated/`
directory.

## Contributing

Please [see CONTRIBUTING.md for details](CONTRIBUTING.md).

## Development Setup

**Requirements:**

- Node.js ≥ 22.0.0
- pnpm ≥ 10.0
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

**Note:** The package's `engines` field requires Node.js ≥ 22.0.0 for
consumers and development alike; pnpm ≥ 10.0 is needed for development only.
