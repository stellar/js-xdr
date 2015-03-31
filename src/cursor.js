import BaseCursor from 'cursor';
import {calculatePadding} from "./util";

export class Cursor extends BaseCursor {

  writeBufferPadded(buffer) {
    let padding = calculatePadding(buffer.length);
    let paddingBuffer = new Buffer(padding);
    paddingBuffer.fill(0);
    
    return this
      .copyFrom(new Cursor(buffer))
      .copyFrom(new Cursor(paddingBuffer));
  }
}