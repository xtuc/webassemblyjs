// @flow

const { assert } = require("chai");

const { decodeUInt32 } = require("../lib/LEB128");

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
  });
});
