import { paddingLength, viewFor } from './helpers.js';

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
  #offset = 0;

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
    const bytes = new Uint8Array(4);
    viewFor(bytes).setInt32(0, value, false);
    this.writeBytes(bytes);
  }

  writeUint32(value: number): void {
    const bytes = new Uint8Array(4);
    viewFor(bytes).setUint32(0, value, false);
    this.writeBytes(bytes);
  }

  writeBigInt64(value: bigint): void {
    const bytes = new Uint8Array(8);
    viewFor(bytes).setBigInt64(0, value, false);
    this.writeBytes(bytes);
  }

  writeBigUint64(value: bigint): void {
    const bytes = new Uint8Array(8);
    viewFor(bytes).setBigUint64(0, value, false);
    this.writeBytes(bytes);
  }

  writeFloat32(value: number): void {
    const bytes = new Uint8Array(4);
    viewFor(bytes).setFloat32(0, value, false);
    this.writeBytes(bytes);
  }

  writeFloat64(value: number): void {
    const bytes = new Uint8Array(8);
    viewFor(bytes).setFloat64(0, value, false);
    this.writeBytes(bytes);
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
  }
}
