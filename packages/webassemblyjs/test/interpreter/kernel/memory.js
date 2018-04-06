// @flow

const { assert } = require("chai");

const { Memory } = require("../../../lib/interpreter/runtime/values/memory");
const { createAllocator } = require("../../../lib/interpreter/kernel/memory");

describe("kernel - memory management", () => {
  const memory = new Memory({ initial: 100 });

  describe("memory allocation", () => {
    it("should start from NULL and increment", () => {
      const size = 8;

      const allocator = createAllocator(memory);
      const p = allocator.malloc(size);

      assert.equal(p.index, size);

      const p2 = allocator.malloc(size);
      assert.equal(p2.index, size * 2);
    });
  });

  describe("set/get", () => {
    it("should get an empty value", () => {
      const allocator = createAllocator(memory);
      const p = allocator.malloc(8);

      const value = allocator.get(p);

      assert.equal(value, undefined);
    });

    it("should get and set a value", () => {
      const allocator = createAllocator(memory);

      const data = 1;
      const p = allocator.malloc(1);

      allocator.set(p, data);

      const value = allocator.get(p);

      assert.equal(value, data);
    });
  });
});
