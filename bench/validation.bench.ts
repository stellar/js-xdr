import { describe } from 'vitest';
import { b } from './_bench.js';
import { Transaction, TX_BYTES, TX_VALUE } from './_fixtures.js';

// validateXdr and validate wrap decode/encode in a try/catch, so accepting
// costs a full parse and rejecting also pays for throwing and catching an
// XdrError. These benches time both outcomes on transaction-sized input.

// Rejected at the very end: the parse succeeds, then reader.done() sees the
// leftover bytes. Measures a full decode plus the throw/catch overhead.
const TX_TRAILING = new Uint8Array(TX_BYTES.length + 4);
TX_TRAILING.set(TX_BYTES);

// Rejected early: the memo discriminant sits after source (36 B), fee (4 B),
// and seqNum (8 B), so corrupting the int32 at offset 48 fails the parse
// 52 bytes in.
const MEMO_TYPE_OFFSET = 48;
const TX_BAD_DISCRIMINANT = TX_BYTES.slice();
new DataView(TX_BAD_DISCRIMINANT.buffer).setUint32(
  MEMO_TYPE_OFFSET,
  0xffff_ffff,
  false
);

// Guard the fixtures: each corrupted buffer must actually be rejected, or the
// reject benches would silently measure the accept path.
if (
  !Transaction.validateXdr(TX_BYTES) ||
  Transaction.validateXdr(TX_TRAILING) ||
  Transaction.validateXdr(TX_BAD_DISCRIMINANT)
) {
  throw new Error('validation bench fixtures are wrong');
}

const TX_BAD_VALUE = { ...TX_VALUE, fee: -1 };

if (!Transaction.validate(TX_VALUE) || Transaction.validate(TX_BAD_VALUE)) {
  throw new Error('validation bench values are wrong');
}

describe('validateXdr (transaction bytes)', () => {
  b('accept', () => void Transaction.validateXdr(TX_BYTES));
  b(
    'reject early (bad enum)',
    () => void Transaction.validateXdr(TX_BAD_DISCRIMINANT)
  );
  b(
    'reject late (trailing bytes)',
    () => void Transaction.validateXdr(TX_TRAILING)
  );
});

describe('validate (transaction value)', () => {
  b('accept', () => void Transaction.validate(TX_VALUE));
  b('reject (bad fee)', () => void Transaction.validate(TX_BAD_VALUE));
});
