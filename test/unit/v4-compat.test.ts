import { describe, expect, it } from 'vitest';
import {
  array,
  bool,
  case as xdrCase,
  double,
  enumType,
  field,
  fixedArray,
  float,
  int32,
  int64,
  lazy,
  opaque,
  option,
  string,
  struct,
  uint32,
  uint64,
  union,
  varOpaque,
  void as xdrVoid,
  type XdrType
} from '../../src/index.js';
import fixture from '../fixtures/v4-compat.json';

type IntListValue = {
  readonly value: number;
  readonly rest: IntListValue | null;
};

const Color = enumType('Color', {
  red: 0,
  green: 1,
  blue: 2
});

const CompatRecord = struct('CompatRecord', {
  i: int32(),
  u: uint32(),
  h: int64(),
  uh: uint64(),
  ok: bool(),
  f: float(),
  d: double(),
  name: string(16),
  fixed: opaque(3),
  varBytes: varOpaque(8),
  fixedInts: fixedArray(int32(), 3),
  varInts: array(int32(), 4),
  maybe: option(int32()),
  color: Color
});

const ResultType = enumType('ResultType', {
  ok: 0,
  error: 1
});

const Result = union('Result', {
  switchOn: ResultType,
  cases: [
    xdrCase('ok', ResultType.ok, xdrVoid()),
    xdrCase('error', ResultType.error, field('message', string(100)))
  ]
});

const IntList: XdrType<IntListValue> = struct('IntList', {
  value: int32(),
  rest: option(lazy(() => IntList))
}) as XdrType<IntListValue>;

// A deeply nested composite: Scene -> Layer -> [Shape (union)] -> Polygon ->
// [Point]. Several layers of nested structs, unions, arrays, and options.
const Point = struct('Point', {
  x: int32(),
  y: int32()
});

const Polygon = struct('Polygon', {
  vertices: array(Point, 8),
  closed: bool()
});

const ShapeKind = enumType('ShapeKind', {
  dot: 0,
  poly: 1
});

const Shape = union('Shape', {
  switchOn: ShapeKind,
  cases: [
    xdrCase('dot', ShapeKind.dot, field('center', Point)),
    xdrCase('poly', ShapeKind.poly, field('polygon', Polygon))
  ]
});

const Layer = struct('Layer', {
  label: string(8),
  shapes: array(Shape, 4)
});

const Scene = struct('Scene', {
  name: string(16),
  root: Layer,
  fallback: option(Shape)
});

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function normalizeCompatRecord(value: ReturnType<typeof CompatRecord.decode>) {
  return {
    i: value.i,
    u: value.u,
    h: value.h.toString(),
    uh: value.uh.toString(),
    ok: value.ok,
    f: value.f,
    d: value.d,
    name: toHex(value.name),
    fixed: toHex(value.fixed),
    varBytes: toHex(value.varBytes),
    fixedInts: value.fixedInts,
    varInts: value.varInts,
    maybe: value.maybe,
    color: value.color
  };
}

// Renders the byte-valued (string) fields nested in a decoded Scene as hex so
// it can be compared against the JSON fixture; numeric/struct/union fields pass
// through unchanged.
function normalizeScene(value: ReturnType<typeof Scene.decode>) {
  return {
    name: toHex(value.name),
    root: {
      label: toHex(value.root.label),
      shapes: value.root.shapes
    },
    fallback: value.fallback
  };
}

describe('v4 wire compatibility fixtures', () => {
  it('records how the fixture bytes were generated', () => {
    expect(fixture.generatedBy).toEqual({
      package: '@stellar/js-xdr',
      alias: 'js-xdr-v4',
      version: '4.0.0',
      script: 'test/fixtures/generate-v4-compat.cjs'
    });
  });

  it('decodes and re-encodes a v4 struct covering primitive and container types', () => {
    const testCase = fixture.cases.compatRecord;
    const bytes = fromHex(testCase.hex);

    const decoded = CompatRecord.decode(bytes);

    expect(normalizeCompatRecord(decoded)).toEqual(testCase.value);
    expect(toHex(CompatRecord.encode(decoded))).toBe(testCase.hex);
  });

  it('decodes and re-encodes a v4 union void arm', () => {
    const testCase = fixture.cases.resultOk;
    const bytes = fromHex(testCase.hex);

    const decoded = Result.decode(bytes);

    expect(decoded).toEqual(testCase.value);
    expect(toHex(Result.encode(decoded))).toBe(testCase.hex);
  });

  it('decodes and re-encodes a v4 union payload arm', () => {
    const testCase = fixture.cases.resultError;
    const bytes = fromHex(testCase.hex);

    const decoded = Result.decode(bytes);
    const errorResult = decoded as {
      readonly type: number;
      message: Uint8Array;
    };

    expect({
      type: errorResult.type,
      message: toHex(errorResult.message)
    }).toEqual(testCase.value);
    expect(toHex(Result.encode(decoded))).toBe(testCase.hex);
  });

  it('decodes and re-encodes a v4 recursive structure', () => {
    const testCase = fixture.cases.linkedList;
    const bytes = fromHex(testCase.hex);

    const decoded = IntList.decode(bytes);

    expect(decoded).toEqual(testCase.value);
    expect(toHex(IntList.encode(decoded))).toBe(testCase.hex);
  });

  it('decodes and re-encodes a v4 deeply nested struct/union/array composite', () => {
    const testCase = fixture.cases.scene;
    const bytes = fromHex(testCase.hex);

    const decoded = Scene.decode(bytes);

    expect(normalizeScene(decoded)).toEqual(testCase.value);
    expect(toHex(Scene.encode(decoded))).toBe(testCase.hex);
  });
});
