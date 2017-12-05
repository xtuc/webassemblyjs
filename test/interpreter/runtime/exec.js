// @flow

const {assert} = require('chai');

const t = require('../../../lib/compiler/AST');
const {executeStackFrame} = require('../../../lib/interpreter/kernel/exec');
const {createStackFrame} = require('../../../lib/interpreter/kernel/stackframe');

describe('kernel exec', () => {
  describe('instructions', () => {

    describe('binop', () => {

      describe('i32.add', () => {

        it('should get the correct result', () => {
          const code = [
            t.instruction('get_local', [0]),
            t.instruction('get_local', [1]),
            t.instruction('i32.add'),
          ];

          const stackFrame = createStackFrame(code, [1, 1]);
          const res = executeStackFrame(stackFrame);

          assert.equal(res, 2);
        });

        it('should assert validations', () => {
          const code = [
            t.instruction('i32.add'),
          ];

          const stackFrame = createStackFrame(code, [1, 1]);
          const fn = () => executeStackFrame(stackFrame);

          assert.throws(fn, /Assertion error/);
        });

      });

      describe('i32.sub', () => {

        it('should get the correct result', () => {
          const code = [
            t.instruction('get_local', [0]),
            t.instruction('get_local', [1]),
            t.instruction('i32.sub'),
          ];

          const stackFrame = createStackFrame(code, [1, 1]);
          const res = executeStackFrame(stackFrame);

          assert.equal(res, 0);
        });

        it('should assert validations', () => {
          const code = [
            t.instruction('i32.sub'),
          ];

          const stackFrame = createStackFrame(code, [1, 1]);
          const fn = () => executeStackFrame(stackFrame);

          assert.throws(fn, /Assertion error/);
        });

      });

      describe('i32.mul', () => {

        it('should get the correct result', () => {
          const code = [
            t.instruction('get_local', [0]),
            t.instruction('get_local', [1]),
            t.instruction('i32.mul'),
          ];

          const stackFrame = createStackFrame(code, [1, 2]);
          const res = executeStackFrame(stackFrame);

          assert.equal(res, 2);
        });

        it('should assert validations', () => {
          const code = [
            t.instruction('i32.mul'),
          ];

          const stackFrame = createStackFrame(code, [1, 1]);
          const fn = () => executeStackFrame(stackFrame);

          assert.throws(fn, /Assertion error/);
        });

      });


    });
  });
});
