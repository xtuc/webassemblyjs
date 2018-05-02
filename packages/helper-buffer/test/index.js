const { assert } = require("chai");
const { overrideBytesInBuffer } = require("../lib");

describe("override bytes in buffer", () => {
  it("should replace bytes", () => {
    const newBytes = [0x5, 0x10];

    const actual = Uint8Array.of(0x01, 0x02, 0x03);
    const expected = Uint8Array.of(0x01, ...newBytes, 0x03);

    const at = 1;
    const end = at + 1;

    const newBuffer = overrideBytesInBuffer(actual, at, end, newBytes);

    assert.deepEqual(newBuffer, expected);
  });

  it("should add bytes at the end", () => {
    const newBytes = [0x01, 0x02, 0x03];

    const actual = Uint8Array.of(0x00);
    const expected = Uint8Array.of(0x00, ...newBytes);

    const at = 1;
    const end = at;

    const newBuffer = overrideBytesInBuffer(actual, at, end, newBytes);

    assert.deepEqual(newBuffer, expected);
  });

  it("should add bytes in the middle", () => {
    const newBytes = [0x01, 0x02, 0x03];

    const actual = Uint8Array.of(0x00, 0x04);
    const expected = Uint8Array.of(0x00, ...newBytes, 0x04);

    const at = 1;
    const end = at;

    const newBuffer = overrideBytesInBuffer(actual, at, end, newBytes);

    assert.deepEqual(newBuffer, expected);
  });

  it("should remove bytes at the end", () => {
    const newBytes = [];

    const actual = Uint8Array.of(0x00, 0x01, 0x02, 0x03);
    const expected = Uint8Array.of(0x00);

    const at = 1;
    const end = at + 3;

    const newBuffer = overrideBytesInBuffer(actual, at, end, newBytes);

    assert.deepEqual(newBuffer, expected);
  });

  it("should remove bytes in the middle", () => {
    const newBytes = [];

    const actual = Uint8Array.of(0x00, 0x01, 0x02, 0x03);
    const expected = Uint8Array.of(0x00, 0x03);

    const at = 1;
    const end = at + 2;

    const newBuffer = overrideBytesInBuffer(actual, at, end, newBytes);

    assert.deepEqual(newBuffer, expected);
  });
});
