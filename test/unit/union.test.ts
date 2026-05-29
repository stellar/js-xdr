import { describe, it, expect } from 'vitest';
import { union, enumType, int32, void as voidType } from '../../src/index.js';
import { field, case as caseOf } from '../../src/types/union.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

const AssetType = enumType('AssetType', { native: 0, credit: 1 });
const Asset = union('Asset', {
  switchOn: AssetType,
  cases: [
    caseOf('native', AssetType.native, voidType()),
    caseOf('credit', AssetType.credit, field('code', int32()))
  ]
});

describe('union', () => {
  it('keeps its name', () => {
    expect(Asset.name).toBe('Asset');
  });

  describe('encode', () => {
    it('writes the discriminant then a void arm', () => {
      expect(toArray(Asset.encode({ type: 0 }))).toEqual([0, 0, 0, 0]);
    });

    it('writes the discriminant then the arm payload', () => {
      expect(toArray(Asset.encode({ type: 1, code: 7 }))).toEqual([
        0, 0, 0, 1, 0, 0, 0, 7
      ]);
    });

    it('throws when the arm payload is missing', () => {
      expect(() => encodeInvalid(Asset, { type: 1 })).toThrow(
        /missing union arm payload/i
      );
    });

    it('throws when the value has no discriminator key', () => {
      expect(() => encodeInvalid(Asset, {})).toThrow(/expected union object/i);
    });

    it('rejects class instances rather than treating them as plain objects', () => {
      // Carries the discriminator key, so it is only rejected by the
      // plain-object check itself (not the missing-key fallback).
      class FakeAsset {
        type = 0;
      }
      expect(() => encodeInvalid(Asset, new FakeAsset())).toThrow(
        /expected union object/i
      );
    });
  });

  describe('decode', () => {
    it('reads a void arm', () => {
      expect(Asset.decode(bytes([0, 0, 0, 0]))).toEqual({ type: 0 });
    });

    it('reads an arm payload', () => {
      expect(Asset.decode(bytes([0, 0, 0, 1, 0, 0, 0, 7]))).toEqual({
        type: 1,
        code: 7
      });
    });
  });

  it('round-trips both arms', () => {
    expect(roundTrip(Asset, { type: 0 })).toEqual({ type: 0 });
    expect(roundTrip(Asset, { type: 1, code: 42 })).toEqual({
      type: 1,
      code: 42
    });
  });

  describe('default arm', () => {
    const Tagged = union('Tagged', {
      switchOn: int32(),
      cases: [caseOf('one', 1, field('a', int32()))],
      defaultArm: field('other', int32())
    });

    it('uses the matching case when present', () => {
      expect(toArray(Tagged.encode({ type: 1, a: 5 }))).toEqual([
        0, 0, 0, 1, 0, 0, 0, 5
      ]);
    });

    it('falls back to the default arm', () => {
      expect(toArray(Tagged.encode({ type: 99, other: 7 }))).toEqual([
        0, 0, 0, 99, 0, 0, 0, 7
      ]);
      expect(Tagged.decode(bytes([0, 0, 0, 99, 0, 0, 0, 7]))).toEqual({
        type: 99,
        other: 7
      });
    });
  });

  describe('without a default arm', () => {
    const NoDefault = union('NoDefault', {
      switchOn: int32(),
      cases: [caseOf('one', 1, voidType())]
    });

    it('throws on an unmatched discriminant when encoding', () => {
      expect(() => encodeInvalid(NoDefault, { type: 2 })).toThrow(/no case/i);
    });

    it('throws on an unmatched discriminant when decoding', () => {
      expect(() => NoDefault.decode(bytes([0, 0, 0, 2]))).toThrow(/no case/i);
    });
  });

  describe('custom switchKey', () => {
    const Custom = union('Custom', {
      switchOn: int32(),
      switchKey: 'kind',
      cases: [caseOf('one', 1, field('a', int32()))]
    });

    it('uses the configured discriminator key', () => {
      expect(toArray(Custom.encode({ kind: 1, a: 5 }))).toEqual([
        0, 0, 0, 1, 0, 0, 0, 5
      ]);
      expect(Custom.decode(bytes([0, 0, 0, 1, 0, 0, 0, 5]))).toEqual({
        kind: 1,
        a: 5
      });
    });
  });
});
