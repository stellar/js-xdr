import { describe, it, expect } from 'vitest';
import { Reader, array, int32 } from '../../src/index.js';
import { bytes } from './_helpers.js';

// Resizable ArrayBuffer is ES2024; the compiler lib is ES2022, so go through
// a cast to reach the constructor options and `resize`.
const ResizableArrayBuffer = ArrayBuffer as unknown as new (
  byteLength: number,
  options: { maxByteLength: number }
) => ArrayBuffer & { resize(byteLength: number): void };

describe('Reader', () => {
  it('reads big-endian values and advances the offset', () => {
    const reader = new Reader(bytes([0, 0, 0, 5, 255, 255, 255, 255]));
    expect(reader.offset).toBe(0);
    expect(reader.readInt32('p')).toBe(5);
    expect(reader.offset).toBe(4);
    expect(reader.readInt32('p')).toBe(-1);
    expect(reader.remaining).toBe(0);
  });

  it('reads 64-bit and floating-point values', () => {
    expect(
      new Reader(bytes([255, 255, 255, 255, 255, 255, 255, 255])).readBigInt64(
        'p'
      )
    ).toBe(-1n);
    expect(new Reader(bytes([0, 0, 0, 0, 0, 0, 0, 1])).readBigUint64('p')).toBe(
      1n
    );
    expect(new Reader(bytes([63, 128, 0, 0])).readFloat32('p')).toBe(1);
    expect(
      new Reader(bytes([63, 240, 0, 0, 0, 0, 0, 0])).readFloat64('p')
    ).toBe(1);
  });

  describe('readBytes', () => {
    it('throws on an invalid length', () => {
      const reader = new Reader(bytes([0, 0, 0, 0]));
      expect(() => reader.readBytes(-1, 'p')).toThrow(/invalid byte length/i);
      expect(() => reader.readBytes(1.5, 'p')).toThrow(/invalid byte length/i);
    });

    it('throws when there is not enough data', () => {
      const reader = new Reader(bytes([0, 0]));
      expect(() => reader.readBytes(4, 'p')).toThrow(/incomplete/i);
    });

    it('throws rather than returning short data when the input shrinks', () => {
      const buffer = new ResizableArrayBuffer(32, { maxByteLength: 64 });
      const reader = new Reader(new Uint8Array(buffer));
      buffer.resize(8);
      expect(() => reader.readBytes(32, 'issuer')).toThrow(/shrank/i);
      expect(reader.offset).toBe(0);
    });
  });

  describe('skipPadding', () => {
    it('throws on a non-integer or negative length', () => {
      const reader = new Reader(bytes([0, 0, 0, 0]));
      expect(() => reader.skipPadding(NaN, 'p')).toThrow(
        /invalid byte length/i
      );
      expect(() => reader.skipPadding(1.5, 'p')).toThrow(
        /invalid byte length/i
      );
      expect(() => reader.skipPadding(-1, 'p')).toThrow(/invalid byte length/i);
      expect(reader.offset).toBe(0);
    });

    it('consumes the padding bytes for a given length', () => {
      const reader = new Reader(bytes([0, 0, 0]));
      reader.skipPadding(1, 'p');
      expect(reader.remaining).toBe(0);
    });

    it('throws on non-zero padding', () => {
      const reader = new Reader(bytes([0, 9, 0]));
      expect(() => reader.skipPadding(1, 'p')).toThrow(/non-zero/i);
      expect(reader.offset).toBe(0);
    });
  });

  describe('done', () => {
    it('passes when input is fully consumed', () => {
      expect(() => new Reader(bytes([])).done('p')).not.toThrow();
    });

    it('throws when bytes remain', () => {
      expect(() => new Reader(bytes([1, 2])).done('p')).toThrow(/trailing/i);
    });
  });

  describe('enter / exit depth tracking', () => {
    it('throws once depth exceeds maxDepth', () => {
      const reader = new Reader(bytes([]), 2);
      reader.enter('p');
      reader.enter('p');
      expect(() => reader.enter('p')).toThrow(/max recursion depth/i);
    });

    it('rejects a non-integer or negative maxDepth', () => {
      expect(() => new Reader(bytes([]), NaN)).toThrow(/invalid maxDepth/i);
      expect(() => new Reader(bytes([]), 1.5)).toThrow(/invalid maxDepth/i);
      expect(() => new Reader(bytes([]), -1)).toThrow(/invalid maxDepth/i);
    });

    it('a failed enter does not consume a level of depth', () => {
      const reader = new Reader(bytes([]), 1);
      reader.enter('p');
      expect(() => reader.enter('p')).toThrow(/max recursion depth/i);
      reader.exit();
      expect(() => reader.enter('p')).not.toThrow();
    });

    it('exit frees a level of depth', () => {
      const reader = new Reader(bytes([]), 1);
      reader.enter('p');
      reader.exit();
      expect(() => reader.enter('p')).not.toThrow();
    });
  });

  it('decode honors the maxDepth option', () => {
    const nested = array(array(int32(), 1), 1);
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(() => nested.decode(wire, { maxDepth: 1 })).toThrow(
      /max recursion depth/i
    );
    expect(nested.decode(wire, { maxDepth: 2 })).toEqual([[5]]);
  });

  it('treats a detached ArrayBuffer as empty input', () => {
    const u8 = new Uint8Array([0, 0, 0, 5]);
    structuredClone(u8.buffer, { transfer: [u8.buffer] });
    expect(() => new Reader(u8).readInt32('p')).toThrow(/incomplete/i);
    expect(int32().validateXdr(u8)).toBe(false);
  });

  it('bounds reads by the length at construction, not a later resize', () => {
    const buffer = new ResizableArrayBuffer(4, { maxByteLength: 64 });
    const u8 = new Uint8Array(buffer);
    const reader = new Reader(u8);
    buffer.resize(8);
    expect(reader.readInt32('p')).toBe(0);
    expect(() => reader.readInt32('p')).toThrow(/incomplete/i);
  });

  it('rejects input that is not a typed array at construction', () => {
    expect(() => new Reader([0, 0, 0, 5] as unknown as Uint8Array)).toThrow(
      TypeError
    );
  });

  it('validateXdr honors the maxDepth option', () => {
    const nested = array(array(int32(), 1), 1);
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(nested.validateXdr(wire, { maxDepth: 1 })).toBe(false);
    expect(nested.validateXdr(wire, { maxDepth: 2 })).toBe(true);
  });
});
