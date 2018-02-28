// @flow

import * as encoder from "./encoder";

export function encodeNode(n: Node): Array<Byte> {
  switch (n.type) {
    case "ModuleImport":
      return encoder.encodeModuleImport(n);

    default:
      throw new Error("Unsupported replacement for node of type: " + n.type);
  }
}

export const encodeU32 = encoder.encodeU32;
