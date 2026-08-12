import { XdrError } from './error.js';
import { paddingLength, viewFor } from './helpers.js';

export const DEFAULT_MAX_DEPTH = 200;

/**
 * Low-level reader for raw XDR bytes.
 *
 * `Reader` advances through one byte sequence, reads big-endian primitive
 * values, verifies zero padding, and tracks nested schema depth. Schema authors
 * use it from `_read`; application code usually calls `schema.decode(bytes)`.
 */
export class Reader {
  #offset = 0;
  #depth = 0;
  readonly #maxDepth: number;
  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array, maxDepth: number = DEFAULT_MAX_DEPTH) {
    // Re-wrap subclassed inputs as a plain Uint8Array so `slice` in readBytes
    // always copies. Buffer (and any other subclass) overrides `slice` to
    // return a view. The prototype-identity check (not `constructor`, which a
    // subclass can shadow) is a fast path for the common plain-Uint8Array
    // input; the prototype determines which `slice` runs (an own `slice`
    // property planted on a plain instance is the caller sabotaging their
    // own input, same as before this normalization existed). The
    // zero-length guard keeps a view over a detached ArrayBuffer working as
    // before (it reports byteLength 0; constructing over its buffer would
    // throw TypeError and change validateXdr's observable behavior).
    this.bytes =
      Object.getPrototypeOf(bytes) === Uint8Array.prototype
        ? bytes
        : bytes.byteLength === 0
        ? new Uint8Array(0)
        : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.#maxDepth = maxDepth;
  }

  get offset(): number {
    return this.#offset;
  }

  get remaining(): number {
    return this.bytes.length - this.#offset;
  }

  enter(path: string): void {
    this.#depth += 1;
    if (this.#depth > this.#maxDepth) {
      throw new XdrError(
        `${path}: max recursion depth ${this.#maxDepth} exceeded`
      );
    }
  }

  exit(): void {
    this.#depth -= 1;
  }

  done(path: string): void {
    if (this.remaining !== 0) {
      throw new XdrError(
        `${path}: trailing ${this.remaining} byte(s) after XDR value`
      );
    }
  }

  readBytes(length: number, path: string): Uint8Array {
    if (length < 0 || !Number.isInteger(length)) {
      throw new XdrError(`${path}: invalid byte length ${length}`);
    }
    if (this.remaining < length) {
      throw new XdrError(
        `${path}: incomplete XDR data at offset ${
          this.#offset
        }, expected ${length} byte(s)`
      );
    }
    const result = this.bytes.slice(this.#offset, this.#offset + length);
    this.#offset += length;
    return result;
  }

  skipPadding(length: number, path: string): void {
    const padding = paddingLength(length);
    const bytes = this.readBytes(padding, path);
    for (const byte of bytes) {
      if (byte !== 0) {
        throw new XdrError(`${path}: non-zero XDR padding`);
      }
    }
  }

  readInt32(path: string): number {
    const view = viewFor(this.readBytes(4, path));
    return view.getInt32(0, false);
  }

  readUint32(path: string): number {
    const view = viewFor(this.readBytes(4, path));
    return view.getUint32(0, false);
  }

  readBigInt64(path: string): bigint {
    const view = viewFor(this.readBytes(8, path));
    return view.getBigInt64(0, false);
  }

  readBigUint64(path: string): bigint {
    const view = viewFor(this.readBytes(8, path));
    return view.getBigUint64(0, false);
  }

  readFloat32(path: string): number {
    const view = viewFor(this.readBytes(4, path));
    return view.getFloat32(0, false);
  }

  readFloat64(path: string): number {
    const view = viewFor(this.readBytes(8, path));
    return view.getFloat64(0, false);
  }
}
