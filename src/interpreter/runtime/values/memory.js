// @flow

const WEBASSEMBLY_PAGE_SIZE = 64 * 1024 /* 64KiB */;

export class Memory implements MemoryInstance {
  _initialBytes: number;
  _maximumBytes: number;

  buffer: ArrayBuffer;

  constructor(descr: MemoryDescriptor) {
    if (typeof descr !== "object") {
      throw new TypeError("MemoryDescriptor must be an object");
    }

    if (typeof descr.maximum === "number") {
      this._maximumBytes = descr.maximum * WEBASSEMBLY_PAGE_SIZE;
    }

    if (typeof descr.initial === "number") {
      this._initialBytes = descr.initial * WEBASSEMBLY_PAGE_SIZE;

      if (this._initialBytes > this._maximumBytes) {
        throw new RangeError(
          "Initial memory can not be higher than the maximum"
        );
      }
    }

    this._allocateInitial();
  }

  _allocateInitial() {
    this.buffer = new ArrayBuffer(this._initialBytes);
  }
}
