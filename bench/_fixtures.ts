import type { BenchOptions } from 'vitest';
import {
  array,
  enumType,
  fixedArray,
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
  case as caseOf,
  field,
  void as voidType,
  type XdrType
} from '../src/index.js';

// Keep each benchmark short so the whole suite stays fast; raise `time`
// locally when chasing small regressions.
export const BENCH_OPTS: BenchOptions = { time: 250 };

export function fill(length: number, seed = 7): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    out[i] = (i * seed + 3) & 0xff;
  }
  return out;
}

// -- Flat struct ------------------------------------------------------------

export const Range = struct('Range', {
  begin: int32(),
  end: int32(),
  inclusive: int32()
});

export const RANGE_VALUE = { begin: 5, end: 255, inclusive: 1 };
export const RANGE_BYTES = Range.encode(RANGE_VALUE);

export const Line = struct('Line', { a: Range, b: Range });
export const LINE_VALUE = { a: RANGE_VALUE, b: RANGE_VALUE };
export const LINE_BYTES = Line.encode(LINE_VALUE);

// -- Stellar-flavored transaction schema -------------------------------------

const PublicKeyType = enumType('PublicKeyType', { ed25519: 0 });

export const PublicKey = union('PublicKey', {
  switchOn: PublicKeyType,
  cases: [
    caseOf('ed25519', PublicKeyType.ed25519, field('ed25519', opaque(32)))
  ]
});

const AssetType = enumType('AssetType', { native: 0, credit: 1 });

const CreditAsset = struct('CreditAsset', {
  code: opaque(4),
  issuer: PublicKey
});

export const Asset = union('Asset', {
  switchOn: AssetType,
  cases: [
    caseOf('native', AssetType.native, voidType()),
    caseOf('credit', AssetType.credit, field('credit', CreditAsset))
  ]
});

const MemoType = enumType('MemoType', { none: 0, text: 1, id: 2, hash: 3 });

export const Memo = union('Memo', {
  switchOn: MemoType,
  cases: [
    caseOf('none', MemoType.none, voidType()),
    caseOf('text', MemoType.text, field('text', string(28))),
    caseOf('id', MemoType.id, field('id', uint64())),
    caseOf('hash', MemoType.hash, field('hash', opaque(32)))
  ]
});

export const Payment = struct('Payment', {
  destination: PublicKey,
  asset: Asset,
  amount: int64()
});

export const Transaction = struct('Transaction', {
  source: PublicKey,
  fee: uint32(),
  seqNum: int64(),
  memo: Memo,
  operations: array(Payment, 100),
  signatures: array(fixedArray(opaque(64), 1), 20)
});

export type PaymentValue = ReturnType<typeof makePayment>;

export function makePayment(i: number) {
  return {
    destination: { type: 0 as const, ed25519: fill(32, i + 1) },
    asset:
      i % 2 === 0
        ? { type: 0 as const }
        : {
            type: 1 as const,
            credit: {
              code: fill(4, i + 2),
              issuer: { type: 0 as const, ed25519: fill(32, i + 3) }
            }
          },
    amount: BigInt(i) * 10_000_000n
  };
}

export function makeTransaction(operationCount: number) {
  const operations = [];
  for (let i = 0; i < operationCount; i += 1) {
    operations.push(makePayment(i));
  }
  return {
    source: { type: 0 as const, ed25519: fill(32) },
    fee: 100 * operationCount,
    seqNum: 123_456_789_012n,
    memo: { type: 2 as const, id: 987_654_321n },
    operations,
    signatures: [[fill(64, 11)], [fill(64, 13)]]
  };
}

export const TX_VALUE = makeTransaction(20);
export const TX_BYTES = Transaction.encode(TX_VALUE);

// -- Recursive schema (lazy + option) ----------------------------------------

interface ListNode {
  value: number;
  next: ListNode | null;
}

export const LinkedList: XdrType<ListNode> = struct('ListNode', {
  value: int32(),
  next: option(lazy((): XdrType<ListNode> => LinkedList))
});

export function makeList(length: number): ListNode {
  let node: ListNode = { value: 0, next: null };
  for (let i = 1; i < length; i += 1) {
    node = { value: i, next: node };
  }
  return node;
}

export const LIST_VALUE = makeList(300);
export const LIST_BYTES = LinkedList.encode(LIST_VALUE);
