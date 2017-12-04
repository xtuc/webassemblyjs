// @flow

const NULL = 0;

// state
let heap = null;
let index = NULL;

function initializeMemory(size: Bytes) {
  heap = Array(size);
}

function dump() {
  console.log(heap);
}

function malloc(size: Bytes): Addr {
  if (heap === null) {
    throw new Error('heap is not initalized');
  }

  index += size;

  return {
    index,
    size,
  };
}

function get(p: Addr) {
  if (heap === null) {
    throw new Error('heap is not initalized');
  }

  return heap[p.index];
}

function set(p: Addr, value: any) {
  if (heap === null) {
    throw new Error('heap is not initalized');
  }

  heap[p.index] = value;
}

function free(p: Addr) {
  if (heap === null) {
    throw new Error('heap is not initalized');
  }

  heap[p.index] = NULL;
}

module.exports = {
  malloc,
  free,
  initializeMemory,

  get,
  set,

  NULL,
  dump,

  ptrsize: 1, // It's an index not an actual pointer
};
