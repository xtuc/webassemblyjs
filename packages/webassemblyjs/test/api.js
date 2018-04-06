// @flow

const WebAssembly = require("../lib");
const { assert } = require("chai");

describe("WebAssembly JavaScript API", () => {
  it("should export an Object", () => {
    assert.typeOf(WebAssembly, "Object");
  });

  it("should export WebAssembly.RuntimeError", () => {
    assert.typeOf(WebAssembly.RuntimeError, "function");
    assert.instanceOf(new WebAssembly.RuntimeError(), Error);
  });

  it("should export WebAssembly.Module", () => {
    assert.typeOf(WebAssembly.Module, "function");
    assert.typeOf(WebAssembly.Module.constructor, "Function");
  });

  describe("WebAssembly.instantiate", () => {
    it("should be a function with 2 arguments", () => {
      assert.typeOf(WebAssembly.instantiate, "Function");
      assert.equal(WebAssembly.instantiate.length, 1 /* + one optional */);
    });

    it("should return a promise", () => {
      const res = WebAssembly.instantiate().catch(() => {});
      assert.instanceOf(res, Promise);
    });
  });

  describe("WebAssembly.Instance", () => {
    it("should have a constructor", () => {
      assert.typeOf(WebAssembly.Instance, "function");
      assert.typeOf(WebAssembly.Instance.constructor, "Function");
      assert.equal(WebAssembly.Instance.length, 2);
    });
  });

  describe("WebAssembly.compile", () => {
    it("should be a function", () => {
      assert.typeOf(WebAssembly.compile, "function");
    });
  });

  describe("WebAssembly.Memory", () => {
    it("should have a constructor", () => {
      assert.typeOf(WebAssembly.Memory, "function");
      assert.typeOf(WebAssembly.Memory.constructor, "Function");
      assert.equal(WebAssembly.Memory.length, 1);
    });

    it("should expect a MemoryDescriptor object", () => {
      const fn = () => new WebAssembly.Memory("");

      assert.throws(fn, TypeError, "MemoryDescriptor must be an object");
    });

    it("should ensure that initial < maximum", () => {
      const fn = () => new WebAssembly.Memory({ initial: 10, maximum: 1 });

      assert.throws(
        fn,
        RangeError,
        "Initial memory can not be higher than the maximum"
      );
    });
  });

  describe("WebAssembly.Table", () => {
    it("should have a constructor", () => {
      assert.typeOf(WebAssembly.Table, "function");
      assert.typeOf(WebAssembly.Table.constructor, "Function");
      assert.equal(WebAssembly.Table.length, 1);
    });

    it("should expect a TableDescriptor object", () => {
      const fn = () => new WebAssembly.Table("");

      assert.throws(fn, TypeError, "TableDescriptor must be an object");
    });

    it("should ensure that initial < maximum", () => {
      const fn = () =>
        new WebAssembly.Table({
          element: "anyfunc",
          initial: 10,
          maximum: 1
        });

      assert.throws(
        fn,
        RangeError,
        "Initial number can not be higher than the maximum"
      );
    });
  });
});
