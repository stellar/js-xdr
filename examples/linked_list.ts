import { int32, lazy, option, struct, XdrType } from '../src/index.js';

type IntListWire = {
  value: number;
  rest: IntListWire | null;
};
const IntList: XdrType<IntListWire> = struct('IntList', {
  value: int32(),
  rest: option(lazy(() => IntList))
});

const n1 = { value: 1, rest: null };
const n2 = { value: 3, rest: n1 };

const encoded = IntList.encode(n2);
const parsed = IntList.decode(encoded);

console.log(encoded);
console.log(parsed);
