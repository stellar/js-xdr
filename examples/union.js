import * as XDR from "../src";

let xdr = XDR.define(xdr => {
  xdr.enum('ResultType', {
    ok: 0,
    error: 1,
    nonsense: 2
  });

  xdr.union('Result', {
    switchOn: xdr.lookup('ResultType'),
    switches: {
      ok:     xdr.void(),
      error:   "message"
    },
    defaultSwitch: xdr.void(),
    arms: {
      message: xdr.string(100)
    }
  });
});




let r = xdr.Result.ok();
r.set("error", "this is an error");
r.message(); // => "this is an error"
r.get("message"); // => "this is an error"

r.set(xdr.ResultType.ok());
r.get(); // => undefined

r.set("nonsense");
r.get(); // => undefined


let output = r.toXDR();
let parsed = xdr.Result.fromXDR(output);

console.log(r);
console.log(parsed);
