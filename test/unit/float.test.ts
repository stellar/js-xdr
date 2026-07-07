import { describe, it, expect } from 'vitest';
import { float } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = float();

describe('float', () => {
  describe('decode', () => {
    it('decodes 32-bit IEEE-754 values', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBe(0);
      expect(schema.decode(bytes([63, 128, 0, 0]))).toBe(1);
      expect(schema.decode(bytes([192, 0, 0, 0]))).toBe(-2);
    });
  });

  describe('encode', () => {
    it('encodes 32-bit IEEE-754 values', () => {
      expect(toArray(schema.encode(0))).toEqual([0, 0, 0, 0]);
      expect(toArray(schema.encode(1))).toEqual([63, 128, 0, 0]);
      expect(toArray(schema.encode(-2))).toEqual([192, 0, 0, 0]);
    });

    it('throws on non-number input', () => {
      expect(() => encodeInvalid(schema, '1')).toThrow(/expected number/i);
    });

    it('encodes IEEE-754 specials to their wire representations', () => {
      expect(toArray(schema.encode(Infinity))).toEqual([0x7f, 0x80, 0, 0]);
      expect(toArray(schema.encode(-Infinity))).toEqual([0xff, 0x80, 0, 0]);
      // NaN encodes as the canonical quiet NaN.
      expect(toArray(schema.encode(NaN))).toEqual([0x7f, 0xc0, 0, 0]);
      // -0 keeps its sign bit.
      expect(toArray(schema.encode(-0))).toEqual([0x80, 0, 0, 0]);
    });
  });

  it('decodes IEEE-754 specials from the wire', () => {
    expect(schema.decode(bytes([0x7f, 0x80, 0, 0]))).toBe(Infinity);
    expect(schema.decode(bytes([0xff, 0x80, 0, 0]))).toBe(-Infinity);
    expect(schema.decode(bytes([0x7f, 0xc0, 0, 0]))).toBeNaN();
    // A non-canonical (signaling) NaN payload still decodes to NaN.
    expect(schema.decode(bytes([0x7f, 0x80, 0, 1]))).toBeNaN();
    expect(Object.is(schema.decode(bytes([0x80, 0, 0, 0])), -0)).toBe(true);
  });

  it('round-trips representable values', () => {
    for (const value of [0, 1, -1, 0.5, -2, 1234.5, Infinity, -Infinity]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
    expect(roundTrip(schema, NaN)).toBeNaN();
  });
});
