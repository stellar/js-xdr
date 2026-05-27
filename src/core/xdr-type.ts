import { Reader } from './reader.js';
import { Writer } from './writer.js';

export const UNBOUNDED_MAX_LENGTH = 4294967295;

/**
 * Options for decoding XDR bytes.
 */
export interface DecodeOptions {
  /**
   * Maximum number of nested schemas that may be entered while decoding.
   *
   * Lower this when decoding untrusted recursive data. If the limit is
   * exceeded, `decode` throws and `validateXdr` returns `false`.
   */
  readonly maxDepth?: number;
}

/**
 * Runtime schema for one XDR type.
 *
 * `T` is the JavaScript value shape used by this schema. For example,
 * `int32()` is `XdrType<number>`, `string(64)` is `XdrType<Uint8Array>`, and
 * `struct(...)` is `XdrType<{ ... }>` rather than a generated class instance.
 */
export interface XdrType<T> {
  /**
   * Schema name when the type was declared with one, such as a struct, union,
   * or enum name.
   */
  readonly name: string | undefined;
  /**
   * Internal type kind used in diagnostics and schema introspection.
   */
  readonly kind: string;
  /**
   * Encodes a JavaScript value to raw XDR bytes.
   *
   * Throws `XdrError` if the value does not match this schema.
   */
  encode(value: T): Uint8Array;
  /**
   * Decodes raw XDR bytes into a JavaScript value.
   *
   * Decoding must consume the entire input. Trailing bytes, malformed padding,
   * unknown enum values, and schema mismatches throw `XdrError`.
   */
  decode(input: Uint8Array, options?: DecodeOptions): T;
  /**
   * Returns whether raw XDR bytes can be decoded by this schema.
   *
   * This is the non-throwing form of `decode`; it validates encoded bytes, not
   * a JavaScript value.
   */
  validateXdr(input: Uint8Array, options?: DecodeOptions): boolean;
  /**
   * Returns whether a JavaScript value can be encoded by this schema.
   *
   * This is value validation. Use `validateXdr` when you already have encoded
   * XDR bytes.
   */
  validate(value: unknown): value is T;
  /**
   * Reads this schema from an existing streaming reader.
   *
   * Intended for schema composition; most callers should use `decode`.
   */
  _read(reader: Reader, path: string): T;
  /**
   * Writes this schema to an existing streaming writer.
   *
   * Intended for schema composition; most callers should use `encode`.
   */
  _write(value: T, writer: Writer, path: string): void;
}

/**
 * Extracts the JavaScript value type from a schema.
 *
 * @example
 * ```ts
 * const Color = struct('Color', { red: uint32(), green: uint32(), blue: uint32() });
 * type Color = Infer<typeof Color>;
 * ```
 */
export type Infer<T> = T extends XdrType<infer V> ? V : never;

/**
 * Base implementation for concrete schema classes.
 *
 * Subclasses define streaming `_read` and `_write` behavior. `BaseType`
 * supplies complete-buffer `encode`, `decode`, `validateXdr`, and `validate`
 * implementations with consistent error handling.
 */
export abstract class BaseType<T> implements XdrType<T> {
  abstract readonly kind: string;
  readonly name: string | undefined;

  constructor(name: string | undefined = undefined) {
    this.name = name;
  }

  encode(value: T): Uint8Array {
    const writer = new Writer();
    this._write(value, writer, this.name ?? this.kind);
    return writer.toUint8Array();
  }

  decode(input: Uint8Array, options?: DecodeOptions): T {
    const reader = new Reader(input, options?.maxDepth);
    const value = this._read(reader, this.name ?? this.kind);
    reader.done(this.name ?? this.kind);
    return value;
  }

  validateXdr(input: Uint8Array, options?: DecodeOptions): boolean {
    try {
      this.decode(input, options);
      return true;
    } catch {
      return false;
    }
  }

  validate(value: unknown): value is T {
    try {
      const writer = new Writer();
      this._write(value as T, writer, this.name ?? this.kind);
      return true;
    } catch {
      return false;
    }
  }

  abstract _read(reader: Reader, path: string): T;
  abstract _write(value: T, writer: Writer, path: string): void;
}
