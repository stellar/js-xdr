import { describe, it, expect } from 'vitest';
import { bool } from '../../src/index.js';
import { bytes, toArray, encodeInvalid } from './_helpers.js';

const schema = bool();

describe('bool', () => {
  describe('decode', () => {
    it('decodes 0 as false and 1 as true', () => {
      expect(schema.decode(bytes([0, 0, 0, 0]))).toBe(false);
      expect(schema.decode(bytes([0, 0, 0, 1]))).toBe(true);
    });

    it('throws on an invalid discriminant', () => {
      expect(() => schema.decode(bytes([0, 0, 0, 2]))).toThrow(/invalid bool/i);
      expect(() => schema.decode(bytes([255, 255, 255, 255]))).toThrow(
        /invalid bool/i
      );
    });
  });

  describe('encode', () => {
    it('encodes booleans', () => {
      expect(toArray(schema.encode(false))).toEqual([0, 0, 0, 0]);
      expect(toArray(schema.encode(true))).toEqual([0, 0, 0, 1]);
    });

    it('throws on non-boolean input', () => {
      expect(() => encodeInvalid(schema, 1)).toThrow(/expected boolean/i);
      expect(() => encodeInvalid(schema, null)).toThrow(/expected boolean/i);
    });
  });

  describe('validate', () => {
    it('accepts booleans', () => {
      expect(schema.validate(true)).toBe(true);
      expect(schema.validate(false)).toBe(true);
    });

    it('rejects non-booleans', () => {
      expect(schema.validate(0)).toBe(false);
      expect(schema.validate('0')).toBe(false);
      expect(schema.validate([true])).toBe(false);
      expect(schema.validate(null)).toBe(false);
      expect(schema.validate({})).toBe(false);
      expect(schema.validate(undefined)).toBe(false);
    });
  });

  describe('validateXdr', () => {
    it('accepts valid encoded XDR bytes', () => {
      expect(schema.validateXdr(bytes([0, 0, 0, 0]))).toBe(true);
      expect(schema.validateXdr(bytes([0, 0, 0, 1]))).toBe(true);
    });

    it('rejects invalid encoded XDR bytes', () => {
      expect(schema.validateXdr(bytes([0, 0, 0, 2]))).toBe(false);
      expect(schema.validateXdr(bytes([0, 0]))).toBe(false);
    });

    it('rejects encoded XDR bytes with trailing data', () => {
      expect(schema.validateXdr(bytes([0, 0, 0, 1, 0]))).toBe(false);
    });
  });
});
