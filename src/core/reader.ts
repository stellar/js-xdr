import { XdrError } from './error.js';
import { paddingLength } from './helpers.js';

export const DEFAULT_MAX_DEPTH = 200;

/**
 * Low-level reader for raw XDR bytes.
 *
 * `Reader` advances through one byte sequence, reads big-endian primitive
 * values, verifies zero padding, and tracks nested schema depth. Schema authors
 * use it from `_read`; application code usually calls `schema.decode(bytes)`.
 *
 * The reader borrows `bytes` without copying, and its bounds are fixed at
 * construction. The caller must not mutate, resize, or detach the backing
 * buffer while the reader is in use.
 */
export class Reader {
  #offset = 0;
  #depth = 0;
  readonly #maxDepth: number;
  /**
   * One view over the whole input, reused by every scalar read. Building a
   * fresh `DataView` per read (over a fresh `slice()` of the bytes) costs two
   * allocations per integer, which dominates decoding for union- and
   * struct-heavy schemas like Stellar's.
   */
  readonly #view: DataView;
  /**
   * Input length, snapshot from the view. Bounds checks must use this rather
   * than the live `bytes.length`: over a resizable ArrayBuffer the two can
   * disagree after a resize, and a check that passes against bytes the view
   * cannot see turns into a raw RangeError from the scalar read.
   */
  readonly #length: number;

  constructor(
    private readonly bytes: Uint8Array,
    maxDepth: number = DEFAULT_MAX_DEPTH
  ) {
    if (maxDepth < 0 || !Number.isInteger(maxDepth)) {
      throw new XdrError(`invalid maxDepth ${maxDepth}`);
    }
    this.#maxDepth = maxDepth;
    // A detached ArrayBuffer rejects DataView construction. Treat it as empty
    // input (a detached Uint8Array already reports length 0), so reads fail
    // with the usual XdrError instead of a TypeError here. Only that case:
    // any other bad input must surface the DataView constructor's TypeError.
    this.#view = (bytes.buffer as { detached?: boolean } | undefined)?.detached
      ? new DataView(new ArrayBuffer(0))
      : new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.#length = this.#view.byteLength;
  }

  /**
   * Reserve `size` bytes for an in-place scalar read and return the offset to
   * read them from.
   */
  #takeScalar(size: number, path: string): number {
    if (this.remaining < size) {
      throw new XdrError(
        `${path}: incomplete XDR data at offset ${
          this.#offset
        }, expected ${size} byte(s)`
      );
    }
    const at = this.#offset;
    this.#offset += size;
    return at;
  }

  get offset(): number {
    return this.#offset;
  }

  get remaining(): number {
    return this.#length - this.#offset;
  }

  enter(path: string): void {
    this.#depth += 1;
    if (this.#depth > this.#maxDepth) {
      this.#depth -= 1;
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
    if (result.length !== length) {
      // The bounds check above uses the length fixed at construction, so a
      // caller that shrank or detached the input mid-decode gets a short
      // slice instead of an error. Fail loudly: callers rely on a fixed-length
      // read returning exactly that many bytes.
      throw new XdrError(`${path}: input shrank during decode`);
    }
    this.#offset += length;
    return result;
  }

  skipPadding(length: number, path: string): void {
    if (length < 0 || !Number.isInteger(length)) {
      throw new XdrError(`${path}: invalid byte length ${length}`);
    }
    const padding = paddingLength(length);
    if (padding === 0) {
      return;
    }
    const at = this.#takeScalar(padding, path);
    // Checked in place: the padding bytes are discarded either way, so there
    // is nothing to copy out.
    for (let i = 0; i < padding; i++) {
      if (this.bytes[at + i] !== 0) {
        // Roll back so a caught error leaves the reader where it was.
        this.#offset = at;
        throw new XdrError(`${path}: non-zero XDR padding`);
      }
    }
  }

  readInt32(path: string): number {
    return this.#view.getInt32(this.#takeScalar(4, path), false);
  }

  readUint32(path: string): number {
    return this.#view.getUint32(this.#takeScalar(4, path), false);
  }

  readBigInt64(path: string): bigint {
    return this.#view.getBigInt64(this.#takeScalar(8, path), false);
  }

  readBigUint64(path: string): bigint {
    return this.#view.getBigUint64(this.#takeScalar(8, path), false);
  }

  readFloat32(path: string): number {
    return this.#view.getFloat32(this.#takeScalar(4, path), false);
  }

  readFloat64(path: string): number {
    return this.#view.getFloat64(this.#takeScalar(8, path), false);
  }
}
