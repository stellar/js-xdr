import times from "lodash/times";

export function bufferToArray(buffer, length, offset=0) {
  return times(length, n => buffer[offset + n]);
}

export function cursorToArray(io) {
  return bufferToArray(io.buffer(), io.tell());
}
