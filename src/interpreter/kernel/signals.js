// @flow

const TRAP = 0x0;

/**
 * Trap: signalling abrupt termination
 * https://webassembly.github.io/spec/core/exec/runtime.html#syntax-trap
 *
 * It triggered using the `trap` instruction
 */
export function createTrap(): StackLocal {
  return { value: TRAP, type: "Signal" };
}

export function isTrapped(v: ?StackLocal): boolean {
  if (v == null) {
    return false;
  }

  return v.value === TRAP;
}
