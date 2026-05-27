import { describe, it, expect } from 'vitest';
import { uint64 } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = uint64();
const MAX = (1n << 64n) - 1n;

describe('uint64', () => {
  describe('decode', () => {
    it('decodes big-endian unsigned bigints', () => {
      expect(schema.decode(bytes([0, 0, 0, 0, 0, 0, 0, 0]))).toBe(0n);
      expect(schema.decode(bytes([0, 0, 0, 0, 0, 0, 0, 1]))).toBe(1n);
      expect(
        schema.decode(bytes([255, 255, 255, 255, 255, 255, 255, 255]))
      ).toBe(MAX);
    });
  });

  describe('encode', () => {
    it('encodes big-endian unsigned bigints', () => {
      expect(toArray(schema.encode(1n))).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
      expect(toArray(schema.encode(MAX))).toEqual([
        255, 255, 255, 255, 255, 255, 255, 255
      ]);
    });

    it('throws when out of range', () => {
      expect(() => schema.encode(-1n)).toThrow(/range/i);
      expect(() => schema.encode(MAX + 1n)).toThrow(/range/i);
    });

    it('throws for non-bigint input', () => {
      expect(() => encodeInvalid(schema, 5)).toThrow(/range/i);
    });
  });

  it('round-trips boundary values', () => {
    for (const value of [0n, 1n, MAX]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
  });
});
