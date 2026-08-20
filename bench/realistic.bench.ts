import { describe } from 'vitest';
import { b } from './_bench.js';
import {
  LinkedList,
  LIST_BYTES,
  LIST_VALUE,
  Transaction,
  TX_BYTES,
  TX_VALUE
} from './_fixtures.js';

// A transaction-shaped schema: nested unions, enums, opaques, bigint fields,
// and a 20-operation array. Closest to how the Stellar SDK uses this library.
describe('transaction (20 operations)', () => {
  b('encode', () => void Transaction.encode(TX_VALUE));
  b('decode', () => void Transaction.decode(TX_BYTES));
  b('round trip', () => void Transaction.decode(Transaction.encode(TX_VALUE)));
});

// Recursion through lazy + option; stresses the depth-tracking machinery.
describe('recursive list (300 nodes)', () => {
  b('encode', () => void LinkedList.encode(LIST_VALUE));
  b('decode', () => void LinkedList.decode(LIST_BYTES));
});
