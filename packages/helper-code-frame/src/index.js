// @flow
import { print } from "@webassemblyjs/wast-printer";

const SHOW_LINES_AROUND_POINTER = 5;

function repeat(char: string, nb: number): string {
  return Array(nb)
    .fill(char)
    .join("");
}

// TODO(sven): allow arbitrary ast nodes
export function codeFrameFromAst(ast: Program, loc: SourceLocation): string {
  return codeFrameFromSource(print(ast), loc);
}

export function codeFrameFromSource(
  source: string,
  loc: SourceLocation
): string {
  const { start, end } = loc;

  let length = 1;

  if (typeof end === "object") {
    length = end.column - start.column + 1;
  }

  return source.split("\n").reduce((acc, line, lineNbr) => {
    if (Math.abs(start.line - lineNbr) < SHOW_LINES_AROUND_POINTER) {
      acc += line + "\n";
    }

    // Add a new line with the pointer padded left
    if (lineNbr === start.line - 1) {
      acc += repeat(" ", start.column - 1);
      acc += repeat("^", length);
      acc += "\n";
    }

    return acc;
  }, "");
}
