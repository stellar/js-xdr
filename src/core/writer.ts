import { XdrError } from './error.js';
import { paddingLength } from './helpers.js';
import { DEFAULT_MAX_DEPTH } from './reader.js';

const INITIAL_BUFFER_SIZE = 8192;

/**
 * Low-level writer for raw XDR bytes.
 *
 * `Writer` appends big-endian primitive values to a growable byte buffer and
 * can add the zero padding required by XDR's 4-byte alignment rules. Schema
 * authors use it from `_write`; application code usually calls
 * `schema.encode(value)`.
 */
export class Writer {
  #buffer = new Uint8Array(INITIAL_BUFFER_SIZE);
  /**
   * View over `#buffer`, reused by every scalar write and rebuilt only when
   * the buffer grows. Writing through a per-call `Uint8Array` + `DataView`
   * pair costs two allocations and a copy per integer.
   */
  #view = new DataView(this.#buffer.buffer);
  #offset = 0;
  #depth = 0;
  readonly #maxDepth: number;

  constructor(maxDepth: number = DEFAULT_MAX_DEPTH) {
    if (maxDepth < 0 || !Number.isInteger(maxDepth)) {
      throw new XdrError(`invalid maxDepth ${maxDepth}`);
    }
    this.#maxDepth = maxDepth;
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

  writeBytes(bytes: Uint8Array): void {
    this.#ensureCapacity(bytes.length);
    this.#buffer.set(bytes, this.#offset);
    this.#offset += bytes.length;
  }

  writePadding(length: number): void {
    const padding = paddingLength(length);
    if (padding > 0) {
      this.#ensureCapacity(padding);
      this.#buffer.fill(0, this.#offset, this.#offset + padding);
      this.#offset += padding;
    }
  }

  writeInt32(value: number): void {
    const offset = this.#prepareScalar(4);
    this.#view.setInt32(offset, value, false);
    this.#offset += 4;
  }

  writeUint32(value: number): void {
    const offset = this.#prepareScalar(4);
    this.#view.setUint32(offset, value, false);
    this.#offset += 4;
  }

  writeBigInt64(value: bigint): void {
    const offset = this.#prepareScalar(8);
    this.#view.setBigInt64(offset, value, false);
    this.#offset += 8;
  }

  writeBigUint64(value: bigint): void {
    const offset = this.#prepareScalar(8);
    this.#view.setBigUint64(offset, value, false);
    this.#offset += 8;
  }

  writeFloat32(value: number): void {
    const offset = this.#prepareScalar(4);
    this.#view.setFloat32(offset, value, false);
    this.#offset += 4;
  }

  writeFloat64(value: number): void {
    const offset = this.#prepareScalar(8);
    this.#view.setFloat64(offset, value, false);
    this.#offset += 8;
  }

  /**
   * Ensure a scalar fits and return its starting offset without advancing.
   * Callers commit the offset only after the DataView write succeeds.
   */
  #prepareScalar(size: number): number {
    this.#ensureCapacity(size);
    return this.#offset;
  }

  toUint8Array(): Uint8Array {
    return this.#buffer.slice(0, this.#offset);
  }

  #ensureCapacity(additionalBytes: number): void {
    const requiredLength = this.#offset + additionalBytes;
    if (requiredLength <= this.#buffer.length) {
      return;
    }

    let nextLength = this.#buffer.length;
    while (nextLength < requiredLength) {
      nextLength *= 2;
    }

    const nextBuffer = new Uint8Array(nextLength);
    nextBuffer.set(this.#buffer);
    this.#buffer = nextBuffer;
    this.#view = new DataView(nextBuffer.buffer);
  }
}
