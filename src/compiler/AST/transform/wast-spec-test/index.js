// @flow

const wastInstructionToCall = require("../wast-instruction-to-call");
const wastWrapModuleIfMissing = require("../wast-wrap-module-if-missing");

export function transform(ast: Program) {
  wastWrapModuleIfMissing.transform(ast);
  wastInstructionToCall.transform(ast);
}
