import BaseCursor from 'cursor';
import { calculatePadding } from './util';

export class Cursor extends BaseCursor {
  writeBufferPadded(buffer) {
    const padding = calculatePadding(buffer.length);
    const paddingBuffer = Buffer.alloc(padding);

    return this.copyFrom(new Cursor(buffer)).copyFrom(
      new Cursor(paddingBuffer)
    );
  }
}
