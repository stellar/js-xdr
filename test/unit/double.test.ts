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

    it('throws on non-finite numbers', () => {
      expect(() => schema.encode(NaN)).toThrow(/finite/i);
      expect(() => schema.encode(-Infinity)).toThrow(/finite/i);
      expect(() => encodeInvalid(schema, '1')).toThrow(/finite/i);
    });
  });

  it('round-trips representable values', () => {
    for (const value of [0, 1, -1, 0.1, -2, 3.141592653589793, 1e308]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
  });
});
