// @flow

const { assert } = require("chai");

// const Long = require("long");
const { decodeUInt32, decodeInt64 } = require("../lib");

describe("LEB128", () => {
  describe("should decode an u32", () => {
    let u32;

    it("1 byte", () => {
      u32 = decodeUInt32(Buffer.from([0x00]));
      assert.equal(u32.value, 0);
      assert.equal(u32.nextIndex, 1);

      u32 = decodeUInt32(Buffer.from([0x08]));
      assert.equal(u32.value, 8);
      assert.equal(u32.nextIndex, 1);
    });

    it("2 byte", () => {
      u32 = decodeUInt32(Buffer.from([0x80, 0x7f]));
      assert.equal(u32.value, 16256);
      assert.equal(u32.nextIndex, 2);
    });

    it("3 byte", () => {
      u32 = decodeUInt32(Buffer.from([0xe5, 0x8e, 0x26]));
      assert.equal(u32.value, 624485);
      assert.equal(u32.nextIndex, 3);
    });

    it("4 byte", () => {
      u32 = decodeUInt32(Buffer.from([0x80, 0x80, 0x80, 0x4f]));
      assert.equal(u32.value, 165675008);
      assert.equal(u32.nextIndex, 4);
    });

    it("5 byte", () => {
      u32 = decodeUInt32(Buffer.from([0x89, 0x80, 0x80, 0x80, 0x00]));
      assert.equal(u32.value, 9);
      assert.equal(u32.nextIndex, 5);
    });
  });

  // FIXME(sven): reenable that we have two's complement
  it.skip("should decode number where |n| > 2^53", () => {
    const u64 = decodeInt64(
      Buffer.from([0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x7f])
    );

    assert.typeOf(u64.value, "object");
    assert.typeOf(u64.value.hi, "number");
    assert.typeOf(u64.value.low, "number");

    // console.log(new Long(u64.value.hi, u64.value.low).toString())

    // assert.equal(u32.value, 165675008);
    assert.equal(u64.nextIndex, 10);
  });
});
