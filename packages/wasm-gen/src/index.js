// @flow

import * as encoder from "./encoder";

export function encodeNode(n: Node): Array<Byte> {
  switch (n.type) {
    case "ModuleImport":
      // $FlowIgnore: ModuleImport ensure that the node is well formated
      return encoder.encodeModuleImport(n);

    case "SectionMetadata":
      // $FlowIgnore: SectionMetadata ensure that the node is well formated
      return encoder.encodeSectionMetadata(n);

    case "CallInstruction":
      // $FlowIgnore: SectionMetadata ensure that the node is well formated
      return encoder.encodeCallInstruction(n);

    case "CallIndirectInstruction":
      // $FlowIgnore: SectionMetadata ensure that the node is well formated
      return encoder.encodeCallIndirectInstruction(n);

    case "TypeInstruction":
      return encoder.encodeTypeInstruction(n);

    case "Instr":
      // $FlowIgnore
      return encoder.encodeInstr(n);

    case "ModuleExport":
      // $FlowIgnore: SectionMetadata ensure that the node is well formated
      return encoder.encodeModuleExport(n);

    case "Global":
      // $FlowIgnore
      return encoder.encodeGlobal(n);

    case "Func":
      return encoder.encodeFuncBody(n);

    case "IndexInFuncSection":
      return encoder.encodeIndexInFuncSection(n);

    case "StringLiteral":
      return encoder.encodeStringLiteral(n);

    case "Elem":
      return encoder.encodeElem(n);

    case "ProducerMetadataVersionedName":
      return encoder.encodeProducerMetadataVersionedName(n);

    case "ProducerMetadata":
      return encoder.encodeProducerMetadata(n);

    default:
      throw new Error(
        "Unsupported encoding for node of type: " + JSON.stringify(n.type)
      );
  }
}

export const encodeU32 = encoder.encodeU32;
export const encodeUTF8Vec = encoder.encodeUTF8Vec;
