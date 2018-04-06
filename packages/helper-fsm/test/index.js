const assert = require("assert");

const { FSM, makeTransition } = require("../lib/index");

describe("fsm", () => {
  it("no move fsm", () => {
    const noMoveFsm = new FSM({}, "start", "stop");
    assert.strictEqual(noMoveFsm.run("hello"), "");
    assert.strictEqual(noMoveFsm.run("hello"), noMoveFsm.run("hello"));
  });

  it("simple fsm", () => {
    const simpleFsm = new FSM(
      {
        A: [makeTransition(/a/, "B")],
        B: [makeTransition(/b/, "A")]
      },
      "A"
    );
    assert.strictEqual(simpleFsm.run("hello"), "");
    assert.strictEqual(simpleFsm.run("ahello"), "a");
    assert.strictEqual(simpleFsm.run("abhello"), "ab");
  });
});
