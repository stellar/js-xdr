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
});
