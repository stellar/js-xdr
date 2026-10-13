import { describe, it, expect } from 'vitest';
import {
  union,
  enumType,
  int32,
  uint32,
  bool,
  float,
  double,
  lazy,
  int64,
  uint64,
  string,
  void as voidType
} from '../../src/index.js';
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

  describe('inherited property names', () => {
    it('rejects a switchKey named __proto__ at construction', () => {
      expect(() =>
        union('Bad', {
          switchOn: AssetType,
          cases: [caseOf('native', AssetType.native, voidType())],
          switchKey: '__proto__'
        })
      ).toThrow(/'__proto__' is not allowed/);
    });

    it('rejects an arm payload field named __proto__ at construction', () => {
      expect(() =>
        union('Bad', {
          switchOn: AssetType,
          cases: [
            caseOf('credit', AssetType.credit, field('__proto__', int32()))
          ]
        })
      ).toThrow(/'__proto__' is not allowed/);
    });

    it('detects a missing discriminator that shadows Object.prototype', () => {
      const Shadow = union('Shadow', {
        switchOn: AssetType,
        cases: [caseOf('native', AssetType.native, voidType())],
        switchKey: 'constructor'
      });
      // `'constructor' in value` is true for any plain object; only an
      // own-property check catches the missing discriminator.
      expect(() => encodeInvalid(Shadow, {})).toThrow(/discriminator/i);
    });

    it('detects a missing arm payload that shadows Object.prototype', () => {
      const Shadow = union('Shadow', {
        switchOn: AssetType,
        cases: [caseOf('credit', AssetType.credit, field('toString', int32()))]
      });
      expect(() => encodeInvalid(Shadow, { type: 1 })).toThrow(
        /missing union arm payload/i
      );
    });
  });
  describe('construction validation', () => {
    it('rejects a case discriminator the switch schema cannot encode', () => {
      expect(() =>
        union('Bad', {
          switchOn: AssetType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cases: [caseOf('bogus', 5 as any, voidType())]
        })
      ).toThrow(/discriminator 5 is not a valid AssetType value/i);
    });

    it('rejects an empty union with no default arm', () => {
      expect(() => union('Empty', { switchOn: int32(), cases: [] })).toThrow(
        /at least one case or a default arm/i
      );
    });

    it('accepts an empty union with a default arm', () => {
      expect(() =>
        union('DefaultOnly', {
          switchOn: int32(),
          cases: [],
          defaultArm: field('a', int32())
        })
      ).not.toThrow();
    });

    it.each([
      ['float', float()],
      ['double', double()],
      ['int64', int64()],
      ['uint64', uint64()],
      ['string', string(8)]
    ])('rejects a %s switch at construction', (_kind, schema) => {
      expect(() =>
        union('Bad', {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          switchOn: schema as any,
          cases: [],
          defaultArm: voidType()
        })
      ).toThrow(/switchOn must be int32, uint32, bool, or an enum/);
    });

    it('accepts uint32 and bool switches', () => {
      expect(() =>
        union('U', { switchOn: uint32(), cases: [caseOf('a', 1, voidType())] })
      ).not.toThrow();
      expect(() =>
        union('B', {
          switchOn: bool(),
          cases: [caseOf('t', true, voidType())]
        })
      ).not.toThrow();
    });

    it('rejects a lazy float switch with cases at construction', () => {
      expect(() =>
        union('Bad', {
          switchOn: lazy(() => float()),
          cases: [caseOf('a', 0.5, voidType())]
        })
      ).toThrow(/Bad: switchOn must be .*, got float/);
    });

    it('accepts a lazy switch wrapped in another lazy', () => {
      const Kind = enumType('Kind', { a: 0 });
      const U = union('U', {
        switchOn: lazy(() => lazy(() => Kind)),
        cases: [caseOf('a', Kind.a, voidType())]
      });
      expect(U.decode(U.encode({ type: Kind.a }))).toEqual({ type: 0 });
    });

    it('rejects a lazy switch that resolves to itself', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Self: any = lazy(() => Self);
      const Bad = union('Bad', {
        switchOn: Self,
        cases: [],
        defaultArm: voidType()
      });
      expect(() => Bad.encode({ type: 0 })).toThrow(
        /switchOn lazy schema never resolves/
      );
    });

    it('rejects a case-less lazy float switch on first use', () => {
      const Bad = union('Bad', {
        switchOn: lazy(() => float()),
        cases: [],
        defaultArm: voidType()
      });
      expect(() => Bad.encode({ type: 0 })).toThrow(
        /Bad: switchOn must be int32, uint32, bool, or an enum, got float/
      );
      expect(() => Bad.decode(new Uint8Array(4))).toThrow(/switchOn must be/);
    });

    it('accepts a lazy switch declared after the union', () => {
      const Later = union('Later', {
        switchOn: lazy(() => Kind),
        cases: [],
        defaultArm: voidType()
      });
      const Kind = enumType('Kind', { a: 0 });
      expect(Later.decode(Later.encode({ type: Kind.a }))).toEqual({
        type: 0
      });
    });
  });
});
