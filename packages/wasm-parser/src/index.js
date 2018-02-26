// @flow

import * as decoder from "./decoder";

type Opts = {
  dump: boolean
};

export function decode(buf: ArrayBuffer, { dump }: Opts = {}): Program {
  return decoder.decode(buf, dump);
}
