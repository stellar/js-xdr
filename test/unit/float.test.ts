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

    it('throws on non-finite numbers', () => {
      expect(() => schema.encode(NaN)).toThrow(/finite/i);
      expect(() => schema.encode(Infinity)).toThrow(/finite/i);
      expect(() => encodeInvalid(schema, '1')).toThrow(/finite/i);
    });
  });

  it('round-trips representable values', () => {
    for (const value of [0, 1, -1, 0.5, -2, 1234.5]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
  });
});
