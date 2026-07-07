import { describe, it, expect } from 'vitest';
import { lazy, int32, struct, option } from '../../src/index.js';
import type { XdrType } from '../../src/index.js';
import { bytes, toArray } from './_helpers.js';

interface ListNodeValue {
  value: number;
  next: ListNodeValue | null;
}

describe('lazy', () => {
  it('delegates encode/decode to the resolved schema', () => {
    const schema = lazy(() => int32());
    expect(toArray(schema.encode(7))).toEqual([0, 0, 0, 7]);
    expect(schema.decode(bytes([0, 0, 0, 7]))).toBe(7);
  });

  it('does not resolve the schema until first use', () => {
    let resolved = 0;
    const schema = lazy(() => {
      resolved += 1;
      return int32();
    });
    expect(resolved).toBe(0);
    schema.encode(1);
    expect(resolved).toBeGreaterThan(0);
  });

  it('supports recursive, self-referential schemas', () => {
    // A cons-list node referencing itself through a lazy thunk. The explicit
    // annotation breaks the self-referential type-inference cycle.
    const ListNode: XdrType<ListNodeValue> = struct('ListNode', {
      value: int32(),
      next: option(lazy((): XdrType<ListNodeValue> => ListNode))
    });

    const list = { value: 1, next: { value: 2, next: null } };
    const encoded = ListNode.encode(list);
    expect(toArray(encoded)).toEqual([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0
    ]);
    expect(ListNode.decode(encoded)).toEqual(list);
  });

  describe('encode depth guard', () => {
    const ListNode: XdrType<ListNodeValue> = struct('ListNode', {
      value: int32(),
      next: option(lazy((): XdrType<ListNodeValue> => ListNode))
    });

    it('throws XdrError (not RangeError) for a cyclic value', () => {
      const node: ListNodeValue = { value: 1, next: null };
      node.next = node;
      let caught: unknown;
      try {
        ListNode.encode(node);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).name).toBe('XdrError');
      expect((caught as Error).message).toMatch(/max recursion depth/i);
    });

    it('honors EncodeOptions.maxDepth', () => {
      const list: ListNodeValue = {
        value: 1,
        next: { value: 2, next: { value: 3, next: null } }
      };
      expect(() => ListNode.encode(list, { maxDepth: 2 })).toThrow(
        /max recursion depth 2/i
      );
      expect(() => ListNode.encode(list)).not.toThrow();
    });

    it('makes validate return false for a cyclic value instead of crashing', () => {
      const node: ListNodeValue = { value: 1, next: null };
      node.next = node;
      expect(ListNode.validate(node)).toBe(false);
    });
  });
});
