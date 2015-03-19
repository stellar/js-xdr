import XDR from "xdr";

let Signature = XDR.Struct.create('Signature', {
  publicKey: new XDR.Opaque(32),
  data: new XDR.Opaque(32),
});

let Envelope = XDR.Struct.create('Envelope', {
  body: new XDR.VarOpaque(1000),
  timestamp: XDR.Int,
  signature: Signature,
});

let sig = Signature.new();
sig.publicKey = new Buffer(32);
sig.publicKey.fill(0x00);
sig.data = new Buffer("00000000000000000000000000000000");

let env = Envelope.new({
  signature: sig,
  body: new Buffer("hello"),
  timestamp: new Date() / 1000
});

console.log(env);


