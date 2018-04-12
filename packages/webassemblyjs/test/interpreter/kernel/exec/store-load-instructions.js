// @flow

const t = require("@webassemblyjs/ast");

const { assert } = require("chai");
const Long = require("long");

const { i64 } = require("../../../../lib/interpreter/runtime/values/i64");
const { Memory } = require("../../../../lib/interpreter/runtime/values/memory");
const {
  executeStackFrame
} = require("../../../../lib/interpreter/kernel/exec");
const {
  createStackFrame
} = require("../../../../lib/interpreter/kernel/stackframe");

describe("kernel exec - store / load instructions", () => {
  let linearMemory;
  let allocator;
  let originatingModule;

  const PAGE_SIZE = Math.pow(2, 16);
  const PAGES = 2;
  const I32_SIZE = 4;

  beforeEach(() => {
    linearMemory = new Memory({ initial: PAGES, maximum: 1024 });

    originatingModule = {
      memaddrs: [linearMemory]
    };

    allocator = {
      get() {
        return linearMemory;
      }
    };
  });

  it("should correctly store i32 values", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(12)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x70000000)]),
      t.objectInstruction("store", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );
    executeStackFrame(stackFrame);

    const i32Array = new Uint32Array(linearMemory.buffer);
    assert.equal(i32Array[3], 1879048192);
  });

  it("should correctly store f32 values", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(12)]),
      t.objectInstruction("const", "f32", [t.numberLiteral(123.456)]),
      t.objectInstruction("store", "f32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );
    executeStackFrame(stackFrame);

    const f32Array = new Float32Array(linearMemory.buffer);
    assert.equal(f32Array[3], 123.45600128173828);
  });

  it("should correctly store f64 values", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(16)]),
      t.objectInstruction("const", "f64", [t.numberLiteral(123.456)]),
      t.objectInstruction("store", "f64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );
    executeStackFrame(stackFrame);

    const f32Array = new Float64Array(linearMemory.buffer);
    assert.equal(f32Array[2], 123.456);
  });

  it("should support wrapping store operations", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(12)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x12345678)]),
      t.objectInstruction("store8", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );
    executeStackFrame(stackFrame);

    const i32Array = new Uint32Array(linearMemory.buffer);
    assert.equal(i32Array[3], 0x78);
  });

  it("should support i32.load operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x01020304)]),
      t.objectInstruction("store", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value, 0x01020304);
  });

  it("should support i32.load16_s operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(-0x01020304)]),
      t.objectInstruction("store", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load16_s", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value, -0x0304);
  });

  it("should support i32.load16_u operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(-0x01020304)]),
      t.objectInstruction("store", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load16_u", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value, 0xfcfc);
  });

  it("should support i64.load16_s operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i64", [
        t.numberLiteral("-0x0102030405060708", "i64")
      ]),
      t.objectInstruction("store", "i64"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load16_s", "i64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);
    const expected = new i64(Long.fromString("-0x0708", false, 16));
    assert.isTrue(res.value.equals(expected));
  });

  it("should support i64.load8_s operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i64", [
        t.numberLiteral("-0x0102030405060708", "i64")
      ]),
      t.objectInstruction("store", "i64"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load8_s", "i64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);
    const expected = new i64(Long.fromString("-0x08", false, 16));
    assert.isTrue(res.value.equals(expected));
  });

  it("should support i64.load32_s operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i64", [
        t.numberLiteral("-0x0102030405060708", "i64")
      ]),
      t.objectInstruction("store", "i64"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load32_s", "i64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);
    const expected = new i64(Long.fromString("-0x05060708", false, 16));
    assert.isTrue(res.value.equals(expected));
  });

  it("should support i32.load8_u operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(-0x01020304)]),
      t.objectInstruction("store", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load8_u", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value, 0xfc);
  });

  it("should support i32.load8_s operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(-0x01020304)]),
      t.objectInstruction("store", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load8_s", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value, -0x04);
  });

  it("should support i64.load operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i64", [
        t.numberLiteral("0x0102030405060708", "i64")
      ]),
      t.objectInstruction("store", "i64"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load", "i64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.isTrue(
      res.value.equals(new i64(Long.fromString("0102030405060708", false, 16)))
    );
  });

  it("should support f32.load operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "f32", [t.numberLiteral(123.456)]),
      t.objectInstruction("store", "f32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load", "f32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value._value, 123.45600128173828);
  });

  it("should support f64.load operations", () => {
    // to test, we store a value, then load it
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "f64", [t.numberLiteral(123.456, "f64")]),
      t.objectInstruction("store", "f64"),
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("load", "f64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    const res = executeStackFrame(stackFrame);

    assert.equal(res.value._value, 123.456);
  });

  it("should not over-write neighbouring bytes when wrapping", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(12)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x01020304)]), // writes 0x04
      t.objectInstruction("store8", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(13)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x01020203)]), // writes 0x0302 (little-endian)
      t.objectInstruction("store16", "i32"),
      t.objectInstruction("const", "i32", [t.numberLiteral(15)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x01020101)]), // writes 0x01
      t.objectInstruction("store8", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );
    executeStackFrame(stackFrame);

    const i32Array = new Uint32Array(linearMemory.buffer);
    assert.equal(i32Array[3], 0x01020304);
  });

  it("should correctly store i64 values", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(8)]),
      t.objectInstruction("const", "i64", [
        t.numberLiteral("0x0102030405060708", "i64")
      ]),
      t.objectInstruction("store", "i64"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    executeStackFrame(stackFrame);

    const i8Array = new Uint8Array(linearMemory.buffer);
    assert.equal(i8Array[8], 8);
    assert.equal(i8Array[9], 7);
    assert.equal(i8Array[10], 6);
    assert.equal(i8Array[11], 5);
    assert.equal(i8Array[12], 4);
    assert.equal(i8Array[13], 3);
    assert.equal(i8Array[14], 2);
    assert.equal(i8Array[15], 1);
  });

  it("should throw if no linear memory is defined", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(12)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0x70000000)]),
      t.objectInstruction("store", "i32"),
      t.instruction("end")
    ];

    const args = [];

    originatingModule.memaddrs = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    assert.throws(() => executeStackFrame(stackFrame), "unknown memory");
  });

  it("should throw if memory accessed out of bounds", () => {
    const code = [
      t.objectInstruction("const", "i32", [
        t.numberLiteral(PAGE_SIZE * PAGES - I32_SIZE + 1)
      ]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
      t.objectInstruction("store", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    assert.throws(
      () => executeStackFrame(stackFrame),
      "memory access out of bounds"
    );
  });

  it("should not throw if memory accessed within bounds - upper boundary value", () => {
    const code = [
      t.objectInstruction("const", "i32", [
        t.numberLiteral(PAGE_SIZE - I32_SIZE) // upper boundary value
      ]),
      t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
      t.objectInstruction("store", "i32"),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    executeStackFrame(stackFrame);
  });

  it("should allow an offset to be specified", () => {
    const code = [
      t.objectInstruction("const", "i32", [t.numberLiteral(4)]),
      t.objectInstruction("const", "i32", [t.numberLiteral(25)]),
      t.objectInstruction("store", "i32", [], {
        offset: t.numberLiteral(0x4)
      }),
      t.instruction("end")
    ];

    const args = [];

    const stackFrame = createStackFrame(
      code,
      args,
      originatingModule,
      allocator
    );

    executeStackFrame(stackFrame);

    const i32Array = new Uint32Array(linearMemory.buffer);
    assert.equal(i32Array[2], 25);
  });

  it("should ensure the offset is within the required bounds", () => {
    const execueteStoreWithOffset = offset => {
      const code = [
        t.objectInstruction("const", "i32", [t.numberLiteral(0)]),
        t.objectInstruction("const", "i32", [t.numberLiteral(25)]),
        t.objectInstruction("store", "i32", [], {
          offset: t.numberLiteral(offset)
        }),
        t.instruction("end")
      ];

      const args = [];

      const stackFrame = createStackFrame(
        code,
        args,
        originatingModule,
        allocator
      );

      executeStackFrame(stackFrame);
    };

    assert.doesNotThrow(() => execueteStoreWithOffset(0));
    assert.throws(() => execueteStoreWithOffset(-1), "offset must be positive");
    assert.throws(
      () => execueteStoreWithOffset(0xffffffff + 1),
      "offset must be less than or equal to 0xffffffff"
    );
  });
});
