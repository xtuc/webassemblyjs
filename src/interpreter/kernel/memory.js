// @flow
export const NULL = 0x0;

// Allocates memory addresses within the store
// https://webassembly.github.io/spec/core/exec/modules.html#alloc
export function createAllocator(): Allocator {
  // https://webassembly.github.io/spec/core/exec/runtime.html#store
  const store = [];
  let offset = 0;

  function malloc(size: Bytes): Addr {
    offset += size;

    return {
      index: offset,
      size
    };
  }

  function get(p: Addr): any {
    return store[p.index];
  }

  function set(p: Addr, value: any) {
    store[p.index] = value;
  }

  function free(p: Addr) {
    store[p.index] = NULL;
  }

  return {
    malloc,
    free,
    get,
    set
  };
}
