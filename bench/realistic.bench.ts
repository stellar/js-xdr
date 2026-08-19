import { bench, describe } from 'vitest';
import {
  BENCH_OPTS,
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
  bench('encode', () => void Transaction.encode(TX_VALUE), BENCH_OPTS);
  bench('decode', () => void Transaction.decode(TX_BYTES), BENCH_OPTS);
  bench(
    'round trip',
    () => void Transaction.decode(Transaction.encode(TX_VALUE)),
    BENCH_OPTS
  );
});

// Recursion through lazy + option; stresses the depth-tracking machinery.
describe('recursive list (300 nodes)', () => {
  bench('encode', () => void LinkedList.encode(LIST_VALUE), BENCH_OPTS);
  bench('decode', () => void LinkedList.decode(LIST_BYTES), BENCH_OPTS);
});
