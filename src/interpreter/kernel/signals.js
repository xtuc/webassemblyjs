// @flow

export class ExecutionHasBeenTrapped extends Error {}

/**
 * Trap: signalling abrupt termination
 * https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
 *
 * It triggered using the `trap` instruction
 */
export function createTrap(
  reason?: string = "Execution has been trapped"
): ExecutionHasBeenTrapped {
  return new ExecutionHasBeenTrapped(reason);
}
