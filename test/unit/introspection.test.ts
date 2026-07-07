import { describe, it, expect } from 'vitest';
import {
  array,
  enumType,
  field,
  fixedArray,
  int32,
  lazy,
  opaque,
  option,
  string,
  struct,
  union,
  case as caseOf,
  void as voidType
} from '../../src/index.js';
import type { AnySchema, UnionSchema, XdrType } from '../../src/index.js';

// A miniature schema-driven walker, the way an external toJson/fromJson
// implementation would consume this API: one cast to the closed AnySchema
// union at the entry, after which `switch (kind)` genuinely narrows each
// branch to its *Schema interface -- no per-branch casts.
function describeSchema(schema: XdrType<unknown>): unknown {
  const s = schema as AnySchema;
  switch (s.kind) {
    case 'struct':
      return {
        struct: s.name,
        fields: s.entries.map(([key, child]) => [key, describeSchema(child)])
      };
    case 'union':
      return {
        union: s.name,
        switchKey: s.switchKey,
        switchOn: describeSchema(s.switchOn),
        cases: s.cases.map((c) => c.name),
        hasDefault: s.defaultArm !== undefined
      };
    case 'enum':
      return { enum: s.name, members: [...s.nameByValue.values()] };
    case 'array':
      return { array: describeSchema(s.element), maxLength: s.maxLength };
    case 'fixedArray':
      return { fixedArray: describeSchema(s.element), length: s.length };
    case 'option':
      return { option: describeSchema(s.element) };
    case 'lazy':
      // A real walker must track visited schemas; this fixture's lazy target
      // is non-recursive so a direct step through is safe here.
      return { lazy: describeSchema(s.getSchema()) };
    case 'opaque':
      return { opaque: s.length };
    case 'varOpaque':
    case 'string':
      return { [s.kind]: s.maxLength };
    default:
      return s.kind;
  }
}

describe('schema introspection', () => {
  it('exposes the walker surface for every compound kind', () => {
    const Hash = opaque(4);
    const Kind = enumType('Kind', { a: 0, b: 1 });
    const Entry = struct('Entry', {
      id: int32(),
      hash: Hash,
      tag: option(string(8))
    });
    const Payload = union('Payload', {
      switchOn: Kind,
      cases: [
        caseOf('a', 0, voidType()),
        caseOf(
          'b',
          1,
          field(
            'entries',
            array(
              lazy(() => Entry),
              10
            )
          )
        )
      ]
    });
    const Fixed = fixedArray(int32(), 2);

    expect(describeSchema(Payload)).toEqual({
      union: 'Payload',
      switchKey: 'type',
      switchOn: { enum: 'Kind', members: ['a', 'b'] },
      cases: ['a', 'b'],
      hasDefault: false
    });

    const kindCase = (Payload as unknown as UnionSchema<unknown>).cases.find(
      (c) => c.name === 'b'
    );
    expect(kindCase && 'schema' in kindCase.arm).toBe(true);

    expect(describeSchema(Entry)).toEqual({
      struct: 'Entry',
      fields: [
        ['id', 'int32'],
        ['hash', { opaque: 4 }],
        ['tag', { option: { string: 8 } }]
      ]
    });

    expect(describeSchema(Fixed)).toEqual({ fixedArray: 'int32', length: 2 });
    expect(describeSchema(lazy(() => Hash))).toEqual({ lazy: { opaque: 4 } });
  });

  it('exposes struct entries and union cases directly off the factory return type', () => {
    // No casts here: the factory return types themselves carry the surface.
    const Color = struct('Color', { red: int32(), green: int32() });
    expect(Color.entries.map(([k]) => k)).toEqual(['red', 'green']);

    const Tagged = union('Tagged', {
      switchOn: int32(),
      cases: [caseOf('one', 1, voidType())]
    });
    expect(Tagged.switchKey).toBe('type');
    expect(Tagged.cases.map((c) => c.discriminant)).toEqual([1]);
    expect(Tagged.defaultArm).toBeUndefined();

    expect(opaque(32).length).toBe(32);
    expect(string(64).maxLength).toBe(64);
    expect(array(int32(), 5).maxLength).toBe(5);
    expect(fixedArray(int32(), 3).length).toBe(3);
    expect(option(int32()).element.kind).toBe('int32');
  });
});
