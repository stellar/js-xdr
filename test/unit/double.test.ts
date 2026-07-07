import { describe, it, expect } from 'vitest';
import { double } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = double();

describe('double', () => {
  describe('decode', () => {
    it('decodes 64-bit IEEE-754 values', () => {
      expect(schema.decode(bytes([0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0);
      expect(schema.decode(bytes([63, 240, 0, 0, 0, 0, 0, 0]))).toBe(1);
      expect(schema.decode(bytes([192, 0, 0, 0, 0, 0, 0, 0]))).toBe(-2);
    });
  });

  describe('encode', () => {
    it('encodes 64-bit IEEE-754 values', () => {
      expect(toArray(schema.encode(0))).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
      expect(toArray(schema.encode(1))).toEqual([63, 240, 0, 0, 0, 0, 0, 0]);
      expect(toArray(schema.encode(-2))).toEqual([192, 0, 0, 0, 0, 0, 0, 0]);
    });

    it('throws on non-number input', () => {
      expect(() => encodeInvalid(schema, '1')).toThrow(/expected number/i);
    });

    it('encodes IEEE-754 specials to their wire representations', () => {
      expect(toArray(schema.encode(Infinity))).toEqual([
        0x7f, 0xf0, 0, 0, 0, 0, 0, 0
      ]);
      expect(toArray(schema.encode(-Infinity))).toEqual([
        0xff, 0xf0, 0, 0, 0, 0, 0, 0
      ]);
      // NaN encodes as the canonical quiet NaN.
      expect(toArray(schema.encode(NaN))).toEqual([
        0x7f, 0xf8, 0, 0, 0, 0, 0, 0
      ]);
      // -0 keeps its sign bit.
      expect(toArray(schema.encode(-0))).toEqual([0x80, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  it('decodes IEEE-754 specials from the wire', () => {
    expect(schema.decode(bytes([0x7f, 0xf0, 0, 0, 0, 0, 0, 0]))).toBe(Infinity);
    expect(schema.decode(bytes([0xff, 0xf0, 0, 0, 0, 0, 0, 0]))).toBe(
      -Infinity
    );
    expect(schema.decode(bytes([0x7f, 0xf8, 0, 0, 0, 0, 0, 0]))).toBeNaN();
    expect(
      Object.is(schema.decode(bytes([0x80, 0, 0, 0, 0, 0, 0, 0])), -0)
    ).toBe(true);
  });

  it('round-trips representable values', () => {
    for (const value of [
      0,
      1,
      -1,
      0.1,
      -2,
      3.141592653589793,
      1e308,
      Number.MIN_VALUE,
      Infinity,
      -Infinity
    ]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
    expect(roundTrip(schema, NaN)).toBeNaN();
  });
});
