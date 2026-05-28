import { opaque, struct, uint32, varOpaque } from '../src/index.js';

const Signature = struct('Signature', {
  publicKey: opaque(32),
  data: opaque(32)
});

const Envelope = struct('Envelope', {
  body: varOpaque(1000),
  timestamp: uint32(),
  signature: Signature
});

const sig = {
  publicKey: Buffer.alloc(32),
  data: Buffer.from('00000000000000000000000000000000')
};

const env = {
  signature: sig,
  body: Buffer.from('hello'),
  timestamp: Math.floor(Date.now() / 1000)
};

const output = Envelope.encode(env);
const parsed = Envelope.decode(output);

console.log(env);
console.log(output);
console.log(parsed);
