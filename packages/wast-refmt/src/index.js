// @flow

import { parse } from "@webassemblyjs/wast-parser";
import { print } from "@webassemblyjs/wast-parser/lib/printer";

export default function(content: string): string {
  const ast = parse(content);
  return print(ast);
}
