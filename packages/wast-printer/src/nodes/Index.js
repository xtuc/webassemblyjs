// @flow

export function printIndex(n: Index): string {
  if (typeof n.identifier === "object") {
    return printIdentifier(n.identifier);
  }

  if (typeof n.index === "object") {
    return printNumberLiteral(n.index);
  }

  throw new Error("Unsupported index: " + n.type);
}
