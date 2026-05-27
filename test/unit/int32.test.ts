import { describe, it, expect } from 'vitest';
import { int32 } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = int32();

describe('int32', () => {
  describe('decode', () => {
    it('decodes big-endian signed integers', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBe(0);
      expect(schema.decode(bytes([0, 0, 0, 5]))).toBe(5);
      expect(schema.decode(bytes([255, 255, 255, 255]))).toBe(-1);
      expect(schema.decode(bytes([127, 255, 255, 255]))).toBe(2147483647);
      expect(schema.decode(bytes([128, 0, 0, 0]))).toBe(-2147483648);
    });
  });

  describe('encode', () => {
    it('encodes big-endian signed integers', () => {
      expect(toArray(schema.encode(0))).toEqual([0, 0, 0, 0]);
      expect(toArray(schema.encode(5))).toEqual([0, 0, 0, 5]);
      expect(toArray(schema.encode(-1))).toEqual([255, 255, 255, 255]);
      expect(toArray(schema.encode(2147483647))).toEqual([127, 255, 255, 255]);
      expect(toArray(schema.encode(-2147483648))).toEqual([128, 0, 0, 0]);
    });

    it('throws when out of range', () => {
      expect(() => schema.encode(2147483648)).toThrow(/range/i);
      expect(() => schema.encode(-2147483649)).toThrow(/range/i);
    });

    it('throws for non-integers', () => {
      expect(() => schema.encode(1.5)).toThrow(/range/i);
      expect(() => encodeInvalid(schema, '1')).toThrow(/range/i);
    });
  });

  it('round-trips boundary values', () => {
    for (const value of [0, 1, -1, 2147483647, -2147483648]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
  });

  describe('validate', () => {
    it('accepts in-range integers and rejects everything else', () => {
      expect(schema.validate(0)).toBe(true);
      expect(schema.validate(-2147483648)).toBe(true);
      expect(schema.validate(2147483648)).toBe(false);
      expect(schema.validate(1.5)).toBe(false);
      expect(schema.validate('1')).toBe(false);
    });
  });
});
