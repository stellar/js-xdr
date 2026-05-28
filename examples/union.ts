import {
  case as xdrCase,
  enumType,
  field,
  int32,
  string,
  union,
  void as xdrVoid
} from '../src/index.js';

const ResultType = enumType('ResultType', {
  ok: 0,
  error: 1,
  nonsense: 2
});

const Result = union('Result', {
  switchOn: ResultType,
  cases: [
    xdrCase('ok', ResultType.ok, xdrVoid()),
    xdrCase('error', ResultType.error, field('message', string(100)))
  ]
});

const message = new TextEncoder().encode('this is an error');
const errorResult = { type: ResultType.error, message };

console.log(errorResult.type); // 1
console.log(new TextDecoder().decode(errorResult.message)); // this is an error

const errorBytes = Result.encode(errorResult);
const parsedError = Result.decode(errorBytes);

console.log(parsedError);
// @ts-expect-error TypeScript doesn't know about the discriminated union here, so `message` is still a `Uint8Array`.
console.log(new TextDecoder().decode(parsedError.message));

const okResult = { type: ResultType.ok };
const okBytes = Result.encode(okResult);
const parsedOk = Result.decode(okBytes);

console.log(parsedOk); // { type: 0 }

const Tagged = union('Tagged', {
  switchOn: int32(),
  cases: [xdrCase('known', 1, field('value', int32()))],
  defaultArm: field('unknown', int32())
});

console.log(Tagged.decode(Uint8Array.from([0, 0, 0, 99, 0, 0, 0, 7])));
