import XDR from "xdr";

let ResultType = XDR.Enum.create('ResultType', {
  ok: 0,
  error: 1,
  nonsense: 2
});

let Result = XDR.Union.create('Result', {
  switchOn: ResultType,
  switches: {
    ok:      XDR.Void,
    error:   "message"
  },
  defaultSwitch: XDR.Void,
  arms: {
    message: new XDR.String(100)
  }
});

let r = Result.ok();
r.set("error", "this is an error");
r.message(); // => "this is an error"
r.get(); // => "this is an error"

r.set(ResultType.ok());
r.get(); // => undefined

r.set("nonsense");
r.get(); // => undefined

r.message(); // throws an error