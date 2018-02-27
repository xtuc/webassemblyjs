// @flow

import * as decoder from "./decoder";

const defaultDecoderOpts = {
  dump: false,
  ignoreCodeSection: false,
  ignoreDataSection: false
};

export function decode(buf: ArrayBuffer, customOpts: Object): Program {
  const opts: DecoderOpts = Object.assign({}, defaultDecoderOpts, customOpts);
  return decoder.decode(buf, opts);
}
