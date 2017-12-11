// @flow

const NULL = 0x0;

const WEBASSEMBLY_PAGE_SIZE = 2 ** 16 /* bytes */;

class Memory {

  _initialBytes: number;
  _maximumBytes: number;

  constructor(descr: MemoryDescriptor) {

    if (typeof descr !== 'object') {
      throw new TypeError('MemoryDescriptor must be an object');
    }

    if (typeof descr.maximum === 'number') {
      this._maximumBytes = descr.maximum * WEBASSEMBLY_PAGE_SIZE;
    }

    if (typeof descr.initial === 'number') {
      this._initialBytes = descr.initial * WEBASSEMBLY_PAGE_SIZE;

      if (this._initialBytes > this._maximumBytes) {
        throw new RangeError('Initial memory can not be higher than the maximum');
      }
    }
  }
}

// state
let heap, index;

function initializeMemory(size: Bytes) {
  heap = Array(size);
  index = NULL;
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

  Memory,
};
