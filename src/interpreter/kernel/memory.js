// @flow

export const NULL = 0x0;

// It's an index not an actual pointer
// FIXME(sven): remove this ^
export const ptrsize = 1;

export function createAllocator(memory: Memory): Allocator {
  const heap = memory.buffer;

  if (heap === null) {
    throw new Error('heap is not initalized');
  }

  function malloc(size: Bytes): Addr {
    memory.offset += size;

    return {
      index: memory.offset,
      size,
    };
  }

  function get(p: Addr): any {
    return heap[p.index];
  }

  function set(p: Addr, value: any) {
    heap[p.index] = value;
  }

  function free(p: Addr) {
    heap[p.index] = NULL;
  }

  return {
    malloc,
    free,

    get,
    set,
  };
}
