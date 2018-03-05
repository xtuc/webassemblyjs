// @flow

export { resizeSectionByteSize, resizeSectionVecSize } from "./resize";
export { createEmptySection } from "./create";
export { removeSection } from "./remove";

export function getSectionForNode(n: Node): SectionName {
  switch (n.type) {
    case "ModuleImport":
      return "import";

    case "CallInstruction":
      return "code";

    case "ModuleExport":
      return "export";

    case "Start":
      return "start";

    case "TypeInstruction":
      return "type";

    default:
      throw new Error(
        "Unsupported input in getSectionForNode: " + JSON.stringify(n.type)
      );
  }
}
