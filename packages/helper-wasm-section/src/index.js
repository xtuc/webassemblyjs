// @flow

export { resizeSectionByteSize, resizeSectionVecSize } from "./resize";
export { createEmptySection } from "./create";
export { removeSection } from "./remove";

export function getSectionForNode(n: Node): SectionName {
  switch (n.type) {
    case "ModuleImport":
      return "import";

    case "CallInstruction":
    case "CallIndirectInstruction":
    case "Func":
    case "Instr":
      return "code";

    case "ModuleExport":
      return "export";

    case "Start":
      return "start";

    case "TypeInstruction":
      return "type";

    case "IndexInFuncSection":
      return "func";

    case "Global":
      return "global";

    default:
      throw new Error(
        "Unsupported input in getSectionForNode: " + JSON.stringify(n.type)
      );
  }
}
