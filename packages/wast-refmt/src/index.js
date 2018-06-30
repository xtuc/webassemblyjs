// @flow

import { parse } from "@webassemblyjs/wast-parser";
import { print } from "@webassemblyjs/wast-printer";

export default function(content: string): string {
  const ast = parse(content);
  return print(ast);
}
