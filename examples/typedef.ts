import { int32, opaque, struct } from '../dist/js-xdr.mjs';

const Signature = struct('Signature', {
  publicKey: opaque(32),
  data: opaque(32)
});

// v5 has no typedef registry. Use normal JavaScript aliases.
const SignatureTypedef = Signature;
const IntTypedef = int32();
const AlsoInt = IntTypedef;

console.log(SignatureTypedef === Signature); // true
console.log(AlsoInt === IntTypedef); // true
console.log(IntTypedef.validate(123)); // true
