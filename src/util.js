import every from 'lodash/every';


export function calculatePadding(length) {
    switch(length % 4) {
    case 0: return 0;
    case 1: return 3;
    case 2: return 2;
    case 3: return 1;
  }
}
export function slicePadding(io, length) {
  let padding = io.slice(length);
  let allZero = every(padding.buffer(), (byte) => {
    return byte === 0;
  });

  if (allZero !== true) {
     throw new Error(`XDR Read Error: invalid padding`);
  }
}
