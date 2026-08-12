import { describe, it, expect } from 'vitest';
import {
  array,
  BaseType,
  fixedArray,
  int32,
  lazy,
  opaque,
  struct,
  void as voidType,
  XdrError,
  type XdrType
} from '../../src/index.js';
import { bytes, toArray, roundTrip, encodeInvalid } from './_helpers.js';

// The documented unbounded idiom array(elem, UNBOUNDED_MAX_LENGTH).
const UNBOUNDED_MAX_LENGTH = 4294967295;

const schema = array(int32(), 3);

describe('array (variable-length)', () => {
  describe('encode', () => {
    it('writes a length prefix followed by each element', () => {
      expect(toArray(schema.encode([1, 2, 3]))).toEqual([
        0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3
      ]);
    });

    it('encodes an empty array', () => {
      expect(toArray(schema.encode([]))).toEqual([0, 0, 0, 0]);
    });

    it('throws when exceeding maxLength', () => {
      expect(() => schema.encode([1, 2, 3, 4])).toThrow(/exceeds maximum/i);
    });

    it('throws for non-array input', () => {
      expect(() => encodeInvalid(schema, 'nope')).toThrow(/expected array/i);
    });
  });

  describe('decode', () => {
    it('reads the length prefix then the elements', () => {
      expect(
        schema.decode(bytes([0, 0, 0, 2, 0, 0, 0, 7, 0, 0, 0, 8]))
      ).toEqual([7, 8]);
      expect(schema.decode(bytes([0, 0, 0, 0]))).toEqual([]);
    });

    it('throws when the declared length exceeds maxLength', () => {
      expect(() =>
        schema.decode(bytes([0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 2]))
      ).toThrow(/exceeds maximum/i);
    });

    it('rejects a declared element count larger than the remaining input', () => {
      // Declares 10 elements but only 4 bytes follow. Every element consumes
      // at least one byte, so the count is rejected before any element reads.
      const wide = array(int32(), 100);
      const input = bytes([0, 0, 0, 10, 0, 0, 0, 1]);
      expect(() => wide.decode(input)).toThrow(XdrError);
      expect(() => wide.decode(input)).toThrow(/exceeds remaining/i);
    });

    it('still rejects a huge count of int32 elements', () => {
      // The element count is wire-supplied, so it is checked against the
      // remaining byte count before any element is decoded.
      const wide = array(int32(), UNBOUNDED_MAX_LENGTH);
      const input = bytes([0xff, 0xff, 0xff, 0xff]);

      let caught: unknown;
      try {
        wide.decode(input);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(XdrError);
      expect(caught).not.toBeInstanceOf(RangeError);
    });
  });

  it('round-trips element values', () => {
    expect(roundTrip(schema, [10, 20, 30])).toEqual([10, 20, 30]);
  });

  describe('zero-width element types', () => {
    // An element that encodes to nothing decouples the element count from the
    // encoded size, so the count alone would decide how much memory a decode
    // allocates. RFC 4506 cannot express such an array except through a
    // struct of `void` members. `readArray` and `writeArray` require every
    // element to move the offset, so any non-empty value of such an array is
    // rejected with an error naming the element type.

    it('rejects void as an element type on first use', () => {
      const voids = array(voidType(), 8);
      expect(() => voids.encode([undefined])).toThrow(XdrError);
      expect(() => voids.encode([undefined])).toThrow(
        /element type 'void' encoded to zero bytes/i
      );
      expect(() => voids.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toThrow(
        /element type 'void' consumed no input/i
      );
    });

    it('rejects a struct whose fields are all void, naming the struct', () => {
      const empty = struct('Empty', { a: voidType(), b: voidType() });
      expect(() =>
        array(empty, 8).encode([{ a: undefined, b: undefined }])
      ).toThrow(/element type 'Empty' encoded to zero bytes/i);
    });

    it('rejects zero-length opaque and nested zero-width arrays', () => {
      expect(() => array(opaque(0), 8).encode([bytes([])])).toThrow(
        /encoded to zero bytes/i
      );
      expect(() => array(fixedArray(int32(), 0), 8).encode([[]])).toThrow(
        /encoded to zero bytes/i
      );
    });

    it('accepts any element type that consumes input', () => {
      expect(roundTrip(array(int32(), 8), [1, 2])).toEqual([1, 2]);
      // A void field does not make the struct zero-width as long as another
      // field consumes input.
      expect(
        roundTrip(array(struct('S', { a: voidType(), b: int32() }), 8), [
          { a: undefined, b: 5 }
        ])
      ).toEqual([{ a: undefined, b: 5 }]);
    });

    it('accepts a lazy element type that resolves to a real schema', () => {
      const lazyInt = array(
        lazy(() => int32()),
        8
      );
      expect(roundTrip(lazyInt, [1, 2])).toEqual([1, 2]);
    });
  });

  describe('zero-width element types behind lazy and custom schemas', () => {
    // The runtime checks read the offset, not the schema, so they also cover
    // element types whose zero width is not visible in the schema structure:
    // behind `lazy` or inside a custom `XdrType`.
    //
    // A count of two followed by eight bytes: enough input to satisfy the
    // count, so a decode failure can only come from an element consuming
    // none of it.
    const COUNTED = bytes([0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0]);

    it('rejects an unsatisfiable count before decoding any element', () => {
      // uint32 100000 with no element bytes: every element consumes at least
      // one byte, so the count is rejected without allocating anything.
      const lazyVoid = array(
        lazy(() => voidType()),
        UNBOUNDED_MAX_LENGTH
      );
      expect(() => lazyVoid.decode(bytes([0, 1, 134, 160]))).toThrow(
        /exceeds remaining/i
      );
    });

    it('rejects a zero-width schema behind a lazy element', () => {
      const lazyVoid = array(
        lazy(() => voidType()),
        UNBOUNDED_MAX_LENGTH
      );
      expect(() => lazyVoid.decode(COUNTED)).toThrow(/consumed no input/i);
      expect(() => lazyVoid.encode([undefined])).toThrow(
        /encoded to zero bytes/i
      );
    });

    it('rejects a zero-width schema behind a lazy struct field', () => {
      // The zero width is a level down: the struct itself consumes nothing
      // because its only field does.
      const hidden = struct('Hidden', { a: lazy(() => voidType()) });
      const hiddenArray = array(hidden, UNBOUNDED_MAX_LENGTH);
      expect(() => hiddenArray.decode(COUNTED)).toThrow(/consumed no input/i);
      expect(() => hiddenArray.encode([{ a: undefined }])).toThrow(
        /encoded to zero bytes/i
      );
    });

    it('rejects a zero-width schema behind a long lazy chain', () => {
      // Deeply wrapped but still inside the decoder's depth limit; the
      // offset check works at any depth.
      let chain: XdrType<unknown> = voidType();
      for (let i = 0; i < 150; i += 1) {
        const inner = chain;
        chain = lazy(() => inner);
      }
      expect(() => array(chain, UNBOUNDED_MAX_LENGTH).decode(COUNTED)).toThrow(
        /consumed no input/i
      );
    });

    it('rejects a custom XdrType that reads and writes nothing', () => {
      class Nothing extends BaseType<Record<string, never>> {
        readonly kind = 'nothing';
        _read(): Record<string, never> {
          return {};
        }
        _write(): void {}
      }
      const customArray = array(
        new Nothing() as unknown as XdrType<Record<string, never>>,
        UNBOUNDED_MAX_LENGTH
      );
      expect(() => customArray.decode(COUNTED)).toThrow(/consumed no input/i);
      expect(() => customArray.encode([{}])).toThrow(/encoded to zero bytes/i);
    });

    it('rejects a lazy element whose target becomes zero-width later', () => {
      // Nothing is cached, so a callback that changes what it returns is
      // re-checked on every use rather than trusted after the first.
      let target: XdrType<unknown> = int32();
      const mutable = array(
        lazy(() => target),
        UNBOUNDED_MAX_LENGTH
      );
      expect(mutable.decode(bytes([0, 0, 0, 1, 0, 0, 0, 7]))).toEqual([7]);
      target = voidType();
      expect(() => mutable.decode(COUNTED)).toThrow(/consumed no input/i);
    });

    it('leaves arrays of byte-backed elements alone', () => {
      expect(roundTrip(array(int32(), 8), [1, 2, 3])).toEqual([1, 2, 3]);
      expect(
        roundTrip(
          array(
            lazy(() => int32()),
            8
          ),
          [4, 5]
        )
      ).toEqual([4, 5]);
    });

    it('accepts an empty array of a zero-width element type', () => {
      // The runtime check runs per element, so a count of zero never reaches
      // it. Nothing is allocated, and encode and decode agree, so the empty
      // value round-trips while any non-empty one is rejected.
      const lazyVoid = array(
        lazy(() => voidType()),
        UNBOUNDED_MAX_LENGTH
      );
      expect(toArray(lazyVoid.encode([]))).toEqual([0, 0, 0, 0]);
      expect(lazyVoid.decode(bytes([0, 0, 0, 0]))).toEqual([]);
      expect(lazyVoid.validateXdr(bytes([0, 0, 0, 0]))).toBe(true);
      expect(() => lazyVoid.decode(bytes([0, 0, 0, 1, 0, 0, 0, 0]))).toThrow(
        /consumed no input/i
      );
    });
  });
});
