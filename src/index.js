require("babel/polyfill");

export * from './types';
export * from './define';

import {define} from './define';

export default function(fn) {
  return define(fn);
}
