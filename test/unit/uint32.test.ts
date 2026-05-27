import { describe, it, expect } from 'vitest';
import { uint32 } from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const schema = uint32();

describe('uint32', () => {
  describe('decode', () => {
    it('decodes big-endian unsigned integers', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBe(0);
      expect(schema.decode(bytes([0, 0, 0, 255]))).toBe(255);
      expect(schema.decode(bytes([255, 255, 255, 255]))).toBe(4294967295);
    });
  });

  describe('encode', () => {
    it('encodes big-endian unsigned integers', () => {
      expect(toArray(schema.encode(0))).toEqual([0, 0, 0, 0]);
      expect(toArray(schema.encode(255))).toEqual([0, 0, 0, 255]);
      expect(toArray(schema.encode(4294967295))).toEqual([255, 255, 255, 255]);
    });

    it('throws when out of range', () => {
      expect(() => schema.encode(-1)).toThrow(/range/i);
      expect(() => schema.encode(4294967296)).toThrow(/range/i);
    });

    it('throws for non-integers', () => {
      expect(() => schema.encode(1.5)).toThrow(/range/i);
      expect(() => encodeInvalid(schema, '1')).toThrow(/range/i);
    });
  });

  it('round-trips boundary values', () => {
    for (const value of [0, 1, 255, 4294967295]) {
      expect(roundTrip(schema, value)).toBe(value);
    }
  });

  describe('validate', () => {
    it('accepts in-range integers and rejects everything else', () => {
      expect(schema.validate(0)).toBe(true);
      expect(schema.validate(4294967295)).toBe(true);
      expect(schema.validate(-1)).toBe(false);
      expect(schema.validate(4294967296)).toBe(false);
      expect(schema.validate(1.5)).toBe(false);
    });
  });
});
