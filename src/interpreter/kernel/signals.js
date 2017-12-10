// @flow

const TRAP = 0x0;

/**
 * Trap: signalling abrupt termination
 * https://webassembly.github.io/spec/exec/runtime.html#syntax-trap
 *
 * It triggered using the `trap` instruction
 */
export function createTrap(): Signal {
  return TRAP;
}

export function isTrapped(v: any): boolean {
  return v === TRAP;
}
