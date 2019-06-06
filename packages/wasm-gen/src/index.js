// @flow

import { assert } from "mamacro";
import bytecode, { getSectionForNode } from "@webassemblyjs/helper-wasm-bytecode";
import * as t from "@webassemblyjs/ast";

import * as encoder from "./encoder";

export function encodeNode(n: Node): Array<Byte> {
  switch (n.type) {
    case "ModuleImport":
      return encoder.encodeModuleImport(n);
    case "SectionMetadata":
      return encoder.encodeSectionMetadata(n);
    case "CallInstruction":
      return encoder.encodeCallInstruction(n);
    case "CallIndirectInstruction":
      return encoder.encodeCallIndirectInstruction(n);
    case "TypeInstruction":
      return encoder.encodeTypeInstruction(n);
    case "Instr":
      return encoder.encodeInstr(n);
    case "ModuleExport":
      return encoder.encodeModuleExport(n);
    case "Global":
      return encoder.encodeGlobal(n);
    case "Func":
      return encoder.encodeFuncBody(n);
    case "IndexInFuncSection":
      return encoder.encodeIndexInFuncSection(n);
    case "StringLiteral":
      return encoder.encodeStringLiteral(n);
    case "Elem":
      return encoder.encodeElem(n);
    default:
      throw new Error(
        "Unsupported encoding for node of type: " + JSON.stringify(n.type)
      );
  }
}

export function encodeProgram(n: Program): Array<Byte> {
  assert(n.body.length === 1);
  return [
    ...encoder.encodeHeader(),
    ...encoder.encodeVersion(1),
    ...encodeModule(n.body[0])
  ];
}

export function encodeModule(n: Node): Array<Byte> {
  // $FlowIgnore
  const module: Module = n;

  // holds the bytes and size of the sections we found corresponding nodes
  const sectionsBytes = {};
  const sectionsSizes = {};

  function appendInSection(name, bytes) {
    if (sectionsBytes[name] === undefined) {
      sectionsBytes[name] = [];
      sectionsSizes[name] = 0;
    }

    sectionsBytes[name].push(...bytes);
    sectionsSizes[name]++;
  }

  for (let i = 0, len = module.fields.length; i < len; i++) {
    const node = module.fields[i];
    const sectionName = getSectionForNode(node);

    if (t.isTypeInstruction(node)) {
      // TODO: could use an IndexInFuncSection node
      appendInSection("func", encodeU32(sectionsSizes["type"]));
    }

    appendInSection(sectionName, encodeNode(node));
  }

  const bytes = [];

  function writeSection(name, id) {
    bytes.push(id);
    const beforeOffset = bytes.length;
    bytes.push(0x0); // section bytes

    bytes.push(...encodeU32(sectionsSizes[name]));
    bytes.push(...sectionsBytes[name]);

    const afterOffset = bytes.length;
    // fixup section byte size
    const sectionLength = afterOffset - beforeOffset - 1;

    // FIXME: leb128
    bytes[beforeOffset] = sectionLength;
  }

  if (sectionsBytes["type"] !== undefined) {
    writeSection("type", bytecode.sections.type);
  }
  if (sectionsBytes["func"] !== undefined) {
    writeSection("func", bytecode.sections.func);
  }
  if (sectionsBytes["export"] !== undefined) {
    writeSection("export", bytecode.sections.export);
  }
  if (sectionsBytes["code"] !== undefined) {
    writeSection("code", bytecode.sections.code);
  }

  return bytes;
}

export const encodeU32 = encoder.encodeU32;
