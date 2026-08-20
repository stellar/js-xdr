import { describe } from 'vitest';
import * as XDR4 from 'js-xdr-v4';
import { b } from './_bench.js';
import { Transaction, TX_BYTES, TX_VALUE } from './_fixtures.js';

// Mirrors the Transaction fixture schema in the v4 API so encode/decode of
// the same wire bytes can be compared across major versions. The round-trip
// guard below proves the mirror is wire-identical.
const v4 = XDR4.config((xdr) => {
  xdr.enum('PublicKeyType', { ed25519: 0 });

  xdr.union('PublicKey', {
    switchOn: xdr.lookup('PublicKeyType'),
    switches: [['ed25519', 'ed25519']],
    arms: { ed25519: xdr.opaque(32) }
  });

  xdr.enum('AssetType', { native: 0, credit: 1 });

  xdr.struct('CreditAsset', [
    ['code', xdr.opaque(4)],
    ['issuer', xdr.lookup('PublicKey')]
  ]);

  xdr.union('Asset', {
    switchOn: xdr.lookup('AssetType'),
    switches: [
      ['native', xdr.void()],
      ['credit', 'credit']
    ],
    arms: { credit: xdr.lookup('CreditAsset') }
  });

  xdr.enum('MemoType', { none: 0, text: 1, id: 2, hash: 3 });

  xdr.union('Memo', {
    switchOn: xdr.lookup('MemoType'),
    switches: [
      ['none', xdr.void()],
      ['text', 'text'],
      ['id', 'id'],
      ['hash', 'hash']
    ],
    arms: { text: xdr.string(28), id: xdr.uhyper(), hash: xdr.opaque(32) }
  });

  xdr.struct('Payment', [
    ['destination', xdr.lookup('PublicKey')],
    ['asset', xdr.lookup('Asset')],
    ['amount', xdr.hyper()]
  ]);

  xdr.struct('Transaction', [
    ['source', xdr.lookup('PublicKey')],
    ['fee', xdr.uint()],
    ['seqNum', xdr.hyper()],
    ['memo', xdr.lookup('Memo')],
    ['operations', xdr.varArray(xdr.lookup('Payment'), 100)],
    ['signatures', xdr.varArray(xdr.array(xdr.opaque(64), 1), 20)]
  ]);
});

// Decoding the v5 fixture bytes through the v4 schema yields the v4-native
// value shape (class instances, Hyper wrappers) so the encode bench measures
// v4 on its own terms rather than through a conversion layer.
const V4Transaction = v4.Transaction;
if (V4Transaction === undefined) {
  throw new Error('v4 mirror schema did not define Transaction');
}

const TX_BUFFER = Buffer.from(TX_BYTES);
const V4_TX_VALUE = V4Transaction.fromXDR(TX_BUFFER);
const V4_TX_BYTES: Buffer = V4_TX_VALUE.toXDR();

if (!V4_TX_BYTES.equals(TX_BUFFER)) {
  throw new Error('v4 mirror schema is not wire-compatible with the fixture');
}

describe('v4 vs v5: transaction (20 operations)', () => {
  b('v5 encode', () => void Transaction.encode(TX_VALUE));
  b('v4 encode', () => void V4_TX_VALUE.toXDR());
  b('v5 decode', () => void Transaction.decode(TX_BYTES));
  b('v4 decode', () => void V4Transaction.fromXDR(TX_BUFFER));
});
