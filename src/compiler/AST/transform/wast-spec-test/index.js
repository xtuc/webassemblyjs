// @flow
const wastInstructionToCall = require("../wast-instruction-to-call");

export function transform(ast: Program) {
  wastInstructionToCall.transform(ast);
}
