const { assert } = require("chai");
const t = require("@webassemblyjs/ast");

const diff = require("jest-diff");
const { NO_DIFF_MESSAGE } = require("jest-diff/build/constants");

const codeFrame = require("../lib").codeFrameFromAst;

describe("code frame", () => {
  const m = t.program([
    t.module(null, [t.func(t.identifier("foo"), [], [], [])])
  ]);

  it("should point to a location", () => {
    const pointer = {
      start: {
        line: 2,
        column: 9
      }
    };

    const actual = codeFrame(m, pointer);

    const expected = `(module
  (func $foo)
        ^
)

`;

    const out = diff(actual, expected);

    if (out !== null && out !== NO_DIFF_MESSAGE) {
      throw new Error("\n" + out);
    }

    // When one line the error is not caught
    assert.equal(actual, expected);
  });

  it("should point to a location with a range", () => {
    const pointer = {
      start: {
        line: 2,
        column: 9
      },
      end: {
        line: 2,
        column: 12
      }
    };

    const actual = codeFrame(m, pointer);

    const expected = `(module
  (func $foo)
        ^^^^
)

`;

    const out = diff(actual, expected);

    if (out !== null && out !== NO_DIFF_MESSAGE) {
      throw new Error("\n" + out);
    }

    // When one line the error is not caught
    assert.equal(actual, expected);
  });

  it("should point to a location and collapse", () => {
    // Add 100 modules to our program
    for (let i = 0; i < 100; i++) {
      m.body.push(
        t.module(null, [t.func(t.identifier("foo" + i), [], [], [])])
      );
    }

    const pointer = {
      start: {
        line: 50,
        column: 9
      }
    };

    const actual = codeFrame(m, pointer);

    const expected = `  (func $foo14)
)
(module
  (func $foo15)
        ^
)
(module
  (func $foo16)
)
(module
`;

    const out = diff(actual, expected);

    if (out !== null && out !== NO_DIFF_MESSAGE) {
      throw new Error("\n" + out);
    }

    // When one line the error is not caught
    assert.equal(actual, expected);
  });
});
