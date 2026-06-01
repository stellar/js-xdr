# Migration guide: v4 → v5

v5 is a ground-up rewrite. If you only consume generated schemas through a
package such as `@stellar/stellar-base` or `@stellar/stellar-sdk`, most schema
changes should be handled by that package's code generator. Upgrade that package
first, then use this guide only for code that builds XDR schemas or calls
`@stellar/js-xdr` directly.

Two things changed at the conceptual level; everything else follows from them:

1. **Schemas are plain values built from standalone functions**, not entries in
   a runtime registry created by `xdr.config(...)`.
2. **Decoded values are plain JavaScript data**, not class instances with
   accessor methods. There is no `color.red()` / `result.switch()` anymore; read
   and write ordinary objects, numbers, arrays, `Uint8Array`s, `bigint`s, and
   `null`.

## Migration checklist

1. Replace imports of generated classes and static type objects with schema
   builder imports from `@stellar/js-xdr`.
2. Replace `xdr.config(...)`, `xdr.lookup(...)`, and `xdr.typedef(...)` with
   explicitly declared schema constants.
3. Replace generated constructors, setters, getters, and union arm constructors
   with plain JavaScript values.
4. Replace `toXDR(...)` / `fromXDR(...)` calls with `encode(...)` /
   `decode(...)`.
5. Move hex, base64, and `Buffer` conversion to your application boundary.
6. Update validation calls: encoded bytes use `validateXdr(bytes)`; JavaScript
   values use `validate(value)`.
7. Preserve old fixture bytes in tests and assert that v5 `decode` reads them
   and v5 `encode` produces the same bytes for equivalent values.

## Package / environment

| v4 | v5 |
| --- | --- |
| `main: lib/xdr.js`, `browser: dist/xdr.js`, `module: src/index.js` | `exports` map with ESM (`dist/js-xdr.mjs`) + CJS (`dist/js-xdr.cjs`) + types (`dist/js-xdr.d.ts`) |
| `Buffer` in, `Buffer` out | `Uint8Array` in, `Uint8Array` out |
| Node `>=20` | Node `>=22` |

`encode()` returns a `Uint8Array`. If you need a `Buffer`, hex, or base64,
convert at the boundary. The old `format` argument is gone.

```ts
const bytes = Result.encode(value);
const asBuffer = Buffer.from(bytes);
const asBase64 = Buffer.from(bytes).toString('base64');
const asHex = Buffer.from(bytes).toString('hex');
```

## Defining schemas

The `xdr.config(...)` DSL, `xdr.lookup(...)`, `xdr.typedef(...)`, and the central
type registry are removed. Define each schema as a value and reference it
directly. Define dependencies before the schemas that use them; for forward or
recursive references, wrap the reference in `lazy(() => ...)`.

`typedef` no longer creates a registry entry. Use a normal variable alias:

```ts
const Signature = opaque(32);
```

**Before (v4):**

```js
import * as XDR from '@stellar/js-xdr';

const types = XDR.config((xdr) => {
  xdr.enum('ResultType', { ok: 0, error: 1 });

  xdr.struct('Color', [
    ['red', xdr.uint()],
    ['green', xdr.uint()],
    ['blue', xdr.uint()]
  ]);

  xdr.union('Result', {
    switchOn: xdr.lookup('ResultType'),
    switches: [
      ['ok', XDR.Void],
      ['error', 'code']
    ],
    arms: { code: xdr.int() }
  });

  xdr.typedef('Signature', xdr.opaque(32));
});
```

**After (v5):**

```ts
import {
  enumType, struct, union, uint32, int32, opaque,
  void as xdrVoid, field, case as xdrCase
} from '@stellar/js-xdr';

const ResultType = enumType('ResultType', { ok: 0, error: 1 });

const Color = struct('Color', {
  red: uint32(),
  green: uint32(),
  blue: uint32()
});

const Result = union('Result', {
  switchOn: ResultType,
  cases: [
    xdrCase('ok', ResultType.ok, xdrVoid()),
    xdrCase('error', ResultType.error, field('code', int32()))
  ]
});

const Signature = opaque(32);
```

Notes:
- Struct fields are an **object** (`{ name: schema }`), not an array of pairs.
  JavaScript property insertion order is the wire order.
- A union case is `case(name, discriminant, arm)`. The arm is either `void()` or
  `field(payloadName, schema)`.
- Enum members are plain numbers: `ResultType.ok` is `0`, not
  `ResultType.ok()`.
- A `defaultArm` is still supported:
  `union(name, { switchOn, cases, defaultArm })`.
- The discriminator key on union values defaults to `type`; override it with
  `switchKey`.

### Type mapping

| v4 | v5 | v5 value type |
| --- | --- | --- |
| `xdr.int()` / `XDR.Int` | `int32()` | `number` |
| `xdr.uint()` / `XDR.UnsignedInt` | `uint32()` | `number` |
| `XDR.Hyper` | `int64()` | `bigint` |
| `XDR.UnsignedHyper` | `uint64()` | `bigint` |
| `XDR.Float` | `float()` | `number` |
| `XDR.Double` | `double()` | `number` |
| `XDR.Quadruple` | removed | - |
| `XDR.Bool` | `bool()` | `boolean` |
| `new XDR.String(n)` | `string(maxLength)` | `Uint8Array` |
| `xdr.opaque(n)` | `opaque(length)` | `Uint8Array` |
| `xdr.varOpaque(n)` | `varOpaque(maxLength)` | `Uint8Array` |
| `xdr.array(child, n)` fixed | `fixedArray(element, length)` | `T[]` |
| `xdr.varArray(child, max)` variable | `array(element, maxLength)` | `T[]` |
| `xdr.option(child)` | `option(element)` | `T \| null` |
| `XDR.Void` | `void()` | `undefined` |
| `xdr.enum(...)` | `enumType(...)` | member number |
| `xdr.struct(...)` | `struct(...)` | plain object |
| `xdr.union(...)` | `union(...)` | tagged object |
| name lookup / forward ref | `lazy(() => schema)` | inferred |

Watch out for two renames:
- **`array` is now the variable-length type** (was `varArray`); the fixed-length
  one is `fixedArray` (was `array`).
- **`int64`/`uint64` are native `bigint`s**. There is no `Hyper` wrapper class,
  so `.toBigInt()`, `.toString()`, and `Hyper.fromString(...)` no longer exist.

### Strings are bytes

`string(maxLength)` reads and writes a `Uint8Array`, not a JavaScript string.
Charset handling moved out of this layer. Encode/decode text yourself:

```ts
const Name = string(64);
const bytes = Name.encode(new TextEncoder().encode('hello'));
const text = new TextDecoder().decode(Name.decode(bytes));
```

## Working with values

This is the largest behavioral change. v4 returned class instances whose fields
were accessor methods. v5 reads and writes plain JavaScript values.

### Struct values

**Before (v4):**

```js
const c = new types.Color({ red: 1, green: 2, blue: 3 });
c.red();               // 1
c.red(9);              // setter
const buf = c.toXDR(); // Buffer
```

**After (v5):**

```ts
const c = { red: 1, green: 2, blue: 3 };
c.red;                 // 1
c.red = 9;
const bytes = Color.encode(c); // Uint8Array
```

There are no generated constructors, field getter methods, or field setter
methods. Encoding rejects missing fields and non-object values.

### Union values

v4 generated static constructors and instance accessors for union arms. v5 uses
plain tagged objects.

**Before (v4):**

```js
const ok = types.Result.ok();
ok.switch();       // ResultType.ok()

const err = types.Result.error(7);
err.switch();      // ResultType.error()
err.code();        // 7
```

**After (v5):**

```ts
const ok = { type: ResultType.ok };

const err = { type: ResultType.error, code: 7 };
err.type;          // 1
err.code;          // 7
```

Union rules:
- A void arm is just the discriminator object: `{ type: ResultType.ok }`.
- A payload arm includes the discriminator plus the field name declared with
  `field(payloadName, schema)`.
- The discriminator key defaults to `type`.
- Use `switchKey` to use a different discriminator property.

```ts
const Custom = union('Custom', {
  switchOn: ResultType,
  switchKey: 'kind',
  cases: [
    xdrCase('ok', ResultType.ok, xdrVoid()),
    xdrCase('error', ResultType.error, field('code', int32()))
  ]
});

Custom.encode({ kind: ResultType.error, code: 7 });
```

Default arms still work:

```ts
const Tagged = union('Tagged', {
  switchOn: int32(),
  cases: [xdrCase('known', 1, field('value', int32()))],
  defaultArm: field('unknown', int32())
});

Tagged.decode(bytes); // { type: 99, unknown: ... } for an unknown discriminator
```

### Optional values

`option(child)` returns the child value or `null`. There is no wrapper object.

```ts
const MaybeCode = option(int32());
MaybeCode.encode(7);
MaybeCode.encode(null);
```

## Encoding, decoding, and validation

| v4 | v5 |
| --- | --- |
| `T.toXDR(value)` / `value.toXDR()` | `T.encode(value)` -> `Uint8Array` |
| `T.fromXDR(input)` | `T.decode(bytes)` |
| `T.validateXDR(input)` | `T.validateXdr(bytes)` |
| `T.isValid(value)` | `T.validate(value)` |
| `T.toXDR(value, 'base64' \| 'hex')` | no `format` arg; convert at the boundary |

```ts
// v4: const b64 = Result.toXDR(value, 'base64');
const b64 = Buffer.from(Result.encode(value)).toString('base64');

// v4: const value = Result.fromXDR(b64, 'base64');
const value = Result.decode(Buffer.from(b64, 'base64'));
```

`validateXdr(bytes)` checks whether encoded XDR bytes can be decoded by the
schema and fully consume the input. It accepts raw `Uint8Array` bytes only. If
you have hex or base64, convert first:

```ts
const bytes = Buffer.from(b64, 'base64');
if (Result.validateXdr(bytes)) {
  const result = Result.decode(bytes);
}
```

`validate(value)` checks whether a JavaScript value can be encoded by the schema:

```ts
Result.validate({ type: ResultType.error, code: 7 }); // true
Result.validate({ type: ResultType.error });          // false
```

The recursion-depth guard is now a decode option rather than a constructor
argument:

```ts
Result.decode(bytes, { maxDepth: 100 });
Result.validateXdr(bytes, { maxDepth: 100 });
```

## Errors

`XdrReaderError`, `XdrWriterError`, `XdrDefinitionError`, and
`XdrNotImplementedDefinitionError` are replaced by a single `XdrError`.

```ts
import { XdrError } from '@stellar/js-xdr';

try {
  Result.decode(bytes);
} catch (error) {
  if (error instanceof XdrError) {
    // Malformed XDR, trailing bytes, unknown enum value, invalid padding,
    // invalid schema value, or schema definition problem.
  }
}
```

If your old code distinguished reader, writer, and definition errors with
`instanceof`, replace that branching with message- or operation-level handling.

## Low-level Reader / Writer

Most consumers should use `schema.encode(value)` and `schema.decode(bytes)`.
If you used the raw streaming primitives, update the names and output method:

| v4 | v5 |
| --- | --- |
| `XdrReader` | `Reader` |
| `XdrWriter` | `Writer` |
| `writer.finalize()` | `writer.toUint8Array()` |
| `writer.writeInt32BE(value)` | `writer.writeInt32(value)` |
| `writer.writeUInt32BE(value)` | `writer.writeUint32(value)` |
| `writer.writeBigInt64BE(value)` | `writer.writeBigInt64(value)` |
| `writer.writeBigUInt64BE(value)` | `writer.writeBigUint64(value)` |
| `writer.writeFloatBE(value)` | `writer.writeFloat32(value)` |
| `writer.writeDoubleBE(value)` | `writer.writeFloat64(value)` |
| `reader.readInt32BE()` | `reader.readInt32(path)` |
| `reader.readUInt32BE()` | `reader.readUint32(path)` |
| `reader.readBigInt64BE()` | `reader.readBigInt64(path)` |
| `reader.readBigUInt64BE()` | `reader.readBigUint64(path)` |
| `reader.readFloatBE()` | `reader.readFloat32(path)` |
| `reader.readDoubleBE()` | `reader.readFloat64(path)` |

Reader methods now take a `path` string used in diagnostics, for example
`reader.readInt32('Result.code')`.

## Custom schema types

If you defined your own XDR types by subclassing v4's `XdrPrimitiveType`,
`XdrCompositeType`, or `NestedXdrType`, those base classes were removed. Extend
`BaseType<T>` — supply `kind`, `_read`, and `_write`, and you inherit
`encode`/`decode`/`validate`/`validateXdr` — or implement the `XdrType<T>`
interface directly.

## TypeScript

Schemas are fully typed. Derive the value type of any schema with `Infer`:

```ts
import type { Infer } from '@stellar/js-xdr';

type Color = Infer<typeof Color>; // { red: number; green: number; blue: number }
```

`struct`, `union`, `enumType`, `array`, and `option` preserve value types through
composition, so prefer deriving types from schemas instead of duplicating object
shapes by hand.

For very large XDR definitions, or definitions with cyclic references, deriving
all value types through `Infer` can put significant pressure on the TypeScript
compiler and language server. In those cases, prefer explicit hand-written value
types at module boundaries and use `Infer` selectively for smaller local schemas.

## Verifying your migration

Use existing XDR fixtures to prove that the wire format is unchanged:

```ts
const oldBytes = Buffer.from(oldBase64, 'base64');
const value = Result.decode(oldBytes);
expect(Result.encode(value)).toEqual(Uint8Array.from(oldBytes));
```

Recommended checks:
- Decode old fixture bytes with the new schema.
- Re-encode the decoded value and compare bytes exactly.
- Add tests for invalid enum values, invalid padding, and trailing bytes if your
  code accepts untrusted XDR.
- Add tests for boundary conversions if your public API still accepts hex,
  base64, or `Buffer`.
- For recursive schemas, add at least one `maxDepth` test.
