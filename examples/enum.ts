import { enumType } from '../src/index.js';

const Color = enumType('Color', {
  red: 0,
  green: 1,
  blue: 2
});

const ResultType = enumType('ResultType', {
  ok: 0,
  error: 1
});

console.log(Color.name); // Color
console.log(Object.fromEntries(Color.nameByValue)); // { '0': 'red', '1': 'green', '2': 'blue' }

console.log(Color.red); // 0
console.log(Color.decode(Uint8Array.from([0, 0, 0, 0]))); // 0

const encoded = Color.encode(Color.red);
console.log(encoded); // Uint8Array
console.log(Buffer.from(encoded).toString('hex')); // 00000000

// Enum members are plain numbers in v5, so equal wire values compare equal
// across enum schemas.
console.log(Color.red === ResultType.ok); // true
