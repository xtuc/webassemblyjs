// @flow

import constants from "@webassemblyjs/helper-wasm-bytecode";
import * as leb from "@webassemblyjs/leb128";
import { encodeNode } from "../index";

function assertNotIdentifierNode(n: Node) {
  if (n.type === "Identifier") {
    throw new Error("Unsupported node Identifier");
  }
}

export function encodeVersion(v: number): Array<Byte> {
  const bytes = constants.moduleVersion;
  bytes[0] = v;

  return bytes;
}

export function encodeHeader(): Array<Byte> {
  return constants.magicModuleHeader;
}

export function encodeU32(v: number): Array<Byte> {
  const uint8view = new Uint8Array(leb.encodeU32(v));
  const array = [...uint8view];
  return array;
}

export function encodeVec(elements: Array<Byte>): Array<Byte> {
  const size = elements.length;
  return [size, ...elements];
}

export function encodeValtype(v: Valtype): Byte {
  const byte = constants.valtypesByString[v];

  if (typeof byte === "undefined") {
    throw new Error("Unknown valtype: " + v);
  }

  return parseInt(byte, 10);
}

export function encodeMutability(v: Mutability): Byte {
  const byte = constants.globalTypesByString[v];

  if (typeof byte === "undefined") {
    throw new Error("Unknown mutability: " + v);
  }

  return parseInt(byte, 10);
}

export function encodeUTF8Vec(str: string): Array<Byte> {
  const charCodes = str.split("").map(x => x.charCodeAt(0));

  return encodeVec(charCodes);
}

export function encodeLimits(n: Limit): Array<Byte> {
  const out = [];

  if (typeof n.max === "number") {
    out.push(0x01);
    out.push(...encodeU32(n.min));

    // $FlowIgnore: ensured by the typeof
    out.push(...encodeU32(n.max));
  } else {
    out.push(0x00);
    out.push(...encodeU32(n.min));
  }

  return out;
}

export function encodeModuleImport(n: ModuleImport): Array<Byte> {
  const out = [];

  out.push(...encodeUTF8Vec(n.module));
  out.push(...encodeUTF8Vec(n.name));

  switch (n.descr.type) {
    case "GlobalType": {
      out.push(0x03);

      // $FlowIgnore: GlobalType ensure that these props exists
      out.push(encodeValtype(n.descr.valtype));
      // $FlowIgnore: GlobalType ensure that these props exists
      out.push(encodeMutability(n.descr.mutability));
      break;
    }

    case "Memory": {
      out.push(0x02);

      // $FlowIgnore
      out.push(...encodeLimits(n.descr.limits));

      break;
    }

    case "Table": {
      out.push(0x01);

      out.push(0x70); // element type

      // $FlowIgnore
      out.push(...encodeLimits(n.descr.limits));

      break;
    }

    case "FuncImportDescr": {
      out.push(0x00);

      // $FlowIgnore
      assertNotIdentifierNode(n.descr.id);

      // $FlowIgnore
      out.push(...encodeU32(n.descr.id.value));

      break;
    }

    default:
      throw new Error(
        "Unsupport operation: encode module import of type: " + n.descr.type
      );
  }

  return out;
}

export function encodeSectionMetadata(n: SectionMetadata): Array<Byte> {
  const out = [];

  const sectionId = constants.sections[n.section];

  if (typeof sectionId === "undefined") {
    throw new Error("Unknown section: " + n.section);
  }

  if (n.section === "start") {
    /**
     * This is not implemented yet because it's a special case which
     * doesn't have a vector in its section.
     */
    throw new Error("Unsupported section encoding of type start");
  }

  out.push(sectionId);
  out.push(...encodeU32(n.size.value));
  out.push(...encodeU32(n.vectorOfSize.value));

  return out;
}

export function encodeCallInstruction(n: CallInstruction): Array<Byte> {
  const out = [];

  assertNotIdentifierNode(n.index);

  out.push(0x10);

  // $FlowIgnore
  out.push(...encodeU32(n.index.value));

  return out;
}

export function encodeCallIndirectInstruction(
  n: CallIndirectInstruction
): Array<Byte> {
  const out = [];

  // $FlowIgnore
  assertNotIdentifierNode(n.index);

  out.push(0x11);
  // $FlowIgnore
  out.push(...encodeU32(n.index.value));

  // add a reserved byte
  out.push(0x00);

  return out;
}

export function encodeModuleExport(n: ModuleExport): Array<Byte> {
  const out = [];

  assertNotIdentifierNode(n.descr.id);

  const exportTypeByteString = constants.exportTypesByName[n.descr.type];

  if (typeof exportTypeByteString === "undefined") {
    throw new Error("Unknown export of type: " + n.descr.type);
  }

  const exportTypeByte = parseInt(exportTypeByteString, 10);

  out.push(...encodeUTF8Vec(n.name));
  out.push(exportTypeByte);

  // $FlowIgnore
  out.push(...encodeU32(n.descr.id.value));

  return out;
}

export function encodeTypeInstruction(n: TypeInstruction): Array<Byte> {
  const out = [0x60];

  const params = n.functype.params.map(x => x.valtype).map(encodeValtype);
  const results = n.functype.results.map(encodeValtype);

  out.push(...encodeVec(params));
  out.push(...encodeVec(results));

  return out;
}

export function encodeInstr(
  n: GenericInstruction | ObjectInstruction
): Array<Byte> {
  const out = [];

  let instructionName = n.id;

  if (typeof n.object === "string") {
    instructionName = `${n.object}.${String(n.id)}`;
  }

  const byteString = constants.symbolsByName[instructionName];

  if (typeof byteString === "undefined") {
    throw new Error(
      "encodeInstr: unknown instruction " + JSON.stringify(instructionName)
    );
  }

  const byte = parseInt(byteString, 10);

  out.push(byte);

  if (n.args) {
    n.args.forEach(arg => {
      if (arg.type === "NumberLiteral") {
        out.push(...encodeU32(arg.value));
      } else {
        throw new Error(
          "Unsupported instruction argument encoding " +
            JSON.stringify(arg.type)
        );
      }
    });
  }

  return out;
}

function encodeExpr(instrs: Array<Instruction>): Array<Byte> {
  const out = [];

  instrs.forEach(instr => {
    // $FlowIgnore
    const n = encodeNode(instr);

    out.push(...n);
  });

  out.push(0x0b); // end

  return out;
}

export function encodeGlobal(n: Global): Array<Byte> {
  const out = [];

  const { valtype, mutability } = n.globalType;

  out.push(encodeValtype(valtype));
  out.push(encodeMutability(mutability));

  out.push(...encodeExpr(n.init));

  return out;
}

export function encodeFuncBody(n: Func): Array<Byte> {
  const out = [];

  out.push(-1); // temporary function body size

  // FIXME(sven): get the func locals?
  const localBytes = encodeVec([]);
  out.push(...localBytes);

  const funcBodyBytes = encodeExpr(n.body);
  out[0] = funcBodyBytes.length + localBytes.length;

  out.push(...funcBodyBytes);

  return out;
}

export function encodeIndexInFuncSection(n: IndexInFuncSection): Array<Byte> {
  assertNotIdentifierNode(n.index);

  // $FlowIgnore
  return encodeU32(n.index.value);
}
