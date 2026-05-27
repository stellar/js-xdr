import { describe, it, expect } from 'vitest';
import { Reader, option, int32 } from '../../src/index.js';
import { bytes } from './_helpers.js';

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
  });

  describe('skipPadding', () => {
    it('consumes the padding bytes for a given length', () => {
      const reader = new Reader(bytes([0, 0, 0]));
      reader.skipPadding(1, 'p');
      expect(reader.remaining).toBe(0);
    });

    it('throws on non-zero padding', () => {
      const reader = new Reader(bytes([0, 9, 0]));
      expect(() => reader.skipPadding(1, 'p')).toThrow(/non-zero/i);
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

    it('exit frees a level of depth', () => {
      const reader = new Reader(bytes([]), 1);
      reader.enter('p');
      reader.exit();
      expect(() => reader.enter('p')).not.toThrow();
    });
  });

  it('decode honors the maxDepth option', () => {
    const nested = option(option(int32()));
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(() => nested.decode(wire, { maxDepth: 1 })).toThrow(
      /max recursion depth/i
    );
    expect(nested.decode(wire, { maxDepth: 2 })).toBe(5);
  });

  it('validateXdr honors the maxDepth option', () => {
    const nested = option(option(int32()));
    const wire = bytes([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5]);
    expect(nested.validateXdr(wire, { maxDepth: 1 })).toBe(false);
    expect(nested.validateXdr(wire, { maxDepth: 2 })).toBe(true);
  });
});
