import { describe, it, expect } from 'vitest';
import { void as voidType } from '../../src/index.js';
import { bytes, toArray, encodeInvalid } from './_helpers.js';

const schema = voidType();

describe('void', () => {
  it('encodes to zero bytes', () => {
    expect(toArray(schema.encode(undefined))).toEqual([]);
  });

  it('decodes empty input to undefined', () => {
    expect(schema.decode(bytes([]))).toBeUndefined();
  });

  it('throws when encoding a non-undefined value', () => {
    expect(() => encodeInvalid(schema, null)).toThrow(/expected void/i);
    expect(() => encodeInvalid(schema, 0)).toThrow(/expected void/i);
  });

  it('validates only undefined', () => {
    expect(schema.validate(undefined)).toBe(true);
    expect(schema.validate(null)).toBe(false);
    expect(schema.validate(0)).toBe(false);
  });
});
