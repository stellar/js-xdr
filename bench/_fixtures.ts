import {
  array,
  bool,
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
import { fill } from './_bench.js';

// -- Flat struct ------------------------------------------------------------

// Mirrors the Range schema in test/unit/struct.test.ts, bool() included, so
// the struct benches also cover the bool codec path.
export const Range = struct('Range', {
  begin: int32(),
  end: int32(),
  inclusive: bool()
});

export const RANGE_VALUE = { begin: 5, end: 255, inclusive: true };
export const RANGE_BYTES = Range.encode(RANGE_VALUE);

export const Line = struct('Line', { a: Range, b: Range });
export const LINE_VALUE = { a: RANGE_VALUE, b: RANGE_VALUE };
export const LINE_BYTES = Line.encode(LINE_VALUE);

// -- Stellar-flavored transaction schema -------------------------------------

const PublicKeyType = enumType('PublicKeyType', { ed25519: 0 });

const PublicKey = union('PublicKey', {
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

const Asset = union('Asset', {
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

function makeTransaction(operationCount: number) {
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

function makeList(length: number): ListNode {
  let node: ListNode = { value: 0, next: null };
  for (let i = 1; i < length; i += 1) {
    node = { value: i, next: node };
  }
  return node;
}

// Each node costs 3 recursion-depth units (struct + option + lazy), so with
// the default maxDepth of 1500 the ceiling is 500 nodes. 300 leaves headroom;
// going past 500 throws "max recursion depth exceeded" at module load.
export const LIST_VALUE = makeList(300);
export const LIST_BYTES = LinkedList.encode(LIST_VALUE);
