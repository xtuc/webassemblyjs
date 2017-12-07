// @flow

const {assert} = require('chai');

const t = require('../../../../lib/compiler/AST');
const {executeStackFrame} = require('../../../../lib/interpreter/kernel/exec');
const {createStackFrame} = require('../../../../lib/interpreter/kernel/stackframe');

describe('kernel exec - control instruction', () => {

  it('should execute nop', () => {
    let pc;

    const code = [
      t.instruction('nop'),
      t.instruction('nop'),
      t.instruction('nop'),
    ];

    const stackFrame = createStackFrame(code, []);
    stackFrame.trace = (_, x) => (pc = x);

    executeStackFrame(stackFrame);

    assert.equal(code.length, pc + 1);
  });

  it('should execute the body of loop in a child stack frame', () => {
    let maxDepth = 0;

    const loopCode = [
      t.instruction('nop'),
      t.instruction('nop'),
    ];

    const loop = [
      t.loopInstruction(undefined, undefined, loopCode),
    ];

    const stackFrame = createStackFrame(loop, []);
    stackFrame.trace = (depth, pc) => {

      if (depth === 0) {
        assert.equal(pc, 0);
      }

      if (depth === 1) {
        assert.isAtLeast(pc, 0);
        assert.isBelow(pc, 2);
      }

      if (maxDepth < depth) {
        maxDepth = depth;
      }
    };

    executeStackFrame(stackFrame);

    assert.equal(maxDepth, 1);
  });

  describe('block', () => {

    it('should enter and execute an empty block', () => {
      const code = [
        t.blockInstruction('label', []),
      ];

      const stackFrame = createStackFrame(code, []);
      executeStackFrame(stackFrame);
    });

    it('should enter a block and execute instructions', () => {
      let maxDepth = 0;
      let instructionExecuted = 0;

      const code = [
        t.blockInstruction('label', [
          t.instruction('nop'),
          t.instruction('nop'),
          t.instruction('nop'),
        ]),
      ];

      const stackFrame = createStackFrame(code, []);

      stackFrame.trace = (depth, pc) => {
        instructionExecuted++;

        if (depth === 0) {
          assert.equal(pc, 0);
        }

        if (maxDepth < depth) {
          maxDepth = depth;
        }
      };

      executeStackFrame(stackFrame);

      assert.equal(maxDepth, 1);
      assert.equal(instructionExecuted, 4);
    });

    it('should remove the label when existing the block', () => {
      const code = [
        t.blockInstruction('label', [
          t.objectInstruction('const', 'i32', [10]),
        ]),
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value, 10);
    });
  });

  describe('if', () => {

    it('should NOT execute consequent when test is zero', () => {
      const code = [
        t.ifInstruction([
          t.objectInstruction('const', 'i32', [0]),
        ], [
          t.objectInstruction('const', 'i32', [10]),
        ], []),
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.typeOf(res, 'undefined');
    });

    it('should NOT execute consequent but alternate when test is zero', () => {
      const code = [
        t.ifInstruction([
          t.objectInstruction('const', 'i32', [0]),
        ], null, [
          t.objectInstruction('const', 'i32', [10]),
        ]),
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.typeOf(res, 'undefined');
    });

    it('should execute consequent when test is non-zero', () => {
      const code = [
        t.ifInstruction([
          t.objectInstruction('const', 'i32', [1]),
        ], null, [
          t.objectInstruction('const', 'i32', [10]),
        ]),
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value, 10);
    });

  });

  describe('call', () => {

    it('should call a function', () => {
      const label = 'foo';

      const code = [
        t.func(label, /* params */ [], /* result */ null, [
          t.objectInstruction('const', 'i32', [10]),
        ]),
        t.callInstruction(t.identifier(label)),
      ];

      const stackFrame = createStackFrame(code, []);
      const res = executeStackFrame(stackFrame);

      assert.equal(res.value, 10);
    });

    it('should handle unexisting label', () => {
      const code = [
        t.callInstruction(t.identifier('some_label')),
      ];

      const stackFrame = createStackFrame(code, []);
      const fn = () => executeStackFrame(stackFrame);

      assert.throws(fn, /Cannot call some_label/);
    });

  });
});
