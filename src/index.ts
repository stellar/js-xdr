// Bases (XdrValue, BytesValue, …) and the schema-builder primitives.
export { BaseType } from './core/xdr-type.js';
export type { DecodeOptions } from './core/xdr-type.js';
export type { Infer } from './core/xdr-type.js';
export { Writer } from './core/writer.js';
export { Reader } from './core/reader.js';
export { XdrError } from './core/error.js';
export type { XdrType } from './core/xdr-type.js';

export { array } from './types/array.js';
export type { ArraySchema } from './types/array.js';
export { bool } from './types/bool.js';
export { double } from './types/double.js';
export { enumType } from './types/enum.js';
export type { EnumMember, EnumName, EnumSchema } from './types/enum.js';
export { fixedArray } from './types/fixed-array.js';
export type { FixedArraySchema } from './types/fixed-array.js';
export { float } from './types/float.js';
export { int32 } from './types/int32.js';
export { int64 } from './types/int64.js';
export { lazy } from './types/lazy.js';
export type { LazySchema } from './types/lazy.js';
export { opaque } from './types/opaque.js';
export type { OpaqueSchema } from './types/opaque.js';
export { option } from './types/option.js';
export type { OptionSchema } from './types/option.js';
export { string } from './types/string.js';
export type { StringSchema } from './types/string.js';
export { struct } from './types/struct.js';
export type { StructSchema } from './types/struct.js';
export { uint32 } from './types/uint32.js';
export { uint64 } from './types/uint64.js';
export { union, case, field } from './types/union.js';
export type { Field, UnionArm, UnionCase, UnionSchema } from './types/union.js';
export { varOpaque } from './types/var-opaque.js';
export type { VarOpaqueSchema } from './types/var-opaque.js';
export { void } from './types/void.js';

import type { XdrType } from './core/xdr-type.js';
import type { ArraySchema } from './types/array.js';
import type { EnumSchema } from './types/enum.js';
import type { FixedArraySchema } from './types/fixed-array.js';
import type { LazySchema } from './types/lazy.js';
import type { OpaqueSchema } from './types/opaque.js';
import type { OptionSchema } from './types/option.js';
import type { StringSchema } from './types/string.js';
import type { StructSchema } from './types/struct.js';
import type { UnionSchema } from './types/union.js';
import type { VarOpaqueSchema } from './types/var-opaque.js';

/**
 * Built-in schema kinds with no extra introspection surface beyond `kind`.
 */
export type PrimitiveSchema = XdrType<unknown> & {
  readonly kind:
    | 'bool'
    | 'double'
    | 'float'
    | 'int32'
    | 'int64'
    | 'uint32'
    | 'uint64'
    | 'void';
};

/**
 * Closed union of every built-in schema shape, discriminated by `kind`.
 *
 * Cast an `XdrType<unknown>` to `AnySchema` once at the entry of a
 * schema-driven walker; a `switch (schema.kind)` then narrows each branch to
 * the matching `*Schema` interface with no further casts.
 *
 * The union covers only the schemas this package creates. Custom schemas
 * (subclasses of `BaseType` with their own `kind`) are not part of it, so
 * walkers over schema trees containing custom types must handle them before
 * the cast.
 */
export type AnySchema =
  | ArraySchema<unknown>
  | EnumSchema<string, Record<string, number>>
  | FixedArraySchema<unknown>
  | LazySchema<unknown>
  | OpaqueSchema
  | OptionSchema<unknown>
  | PrimitiveSchema
  | StringSchema
  | StructSchema<unknown>
  | UnionSchema<unknown>
  | VarOpaqueSchema;
