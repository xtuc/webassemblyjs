// @flow

const {assert} = require('chai');

const t = require('../../../../lib/compiler/AST');
const {executeStackFrame} = require('../../../../lib/interpreter/kernel/exec');
const {createStackFrame} = require('../../../../lib/interpreter/kernel/stackframe');

describe('kernel exec - numeric instructions', () => {

  const operations = [
    {
      name: 'i32.add',

      args: [
        {value: 1, type: 'i32'},
        {value: 1, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.instruction('i32.add'),
      ],

      resEqual: 2,
    },

    {
      name: 'i32.sub',

      args: [
        {value: 1, type: 'i32'},
        {value: 1, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.instruction('i32.sub'),
      ],

      resEqual: 0,
    },

    {
      name: 'i32.mul',

      args: [
        {value: 2, type: 'i32'},
        {value: 1, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.instruction('i32.mul'),
      ],

      resEqual: 2,
    },

    {
      name: 'i32.div_s',

      args: [
        {value: 2, type: 'i32'},
        {value: 10, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.instruction('i32.div_s'),
      ],

      resEqual: 5,
    },

    {
      name: 'i32.div_u',

      args: [
        {value: 2, type: 'i32'},
        {value: 10, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.instruction('i32.div_u'),
      ],

      resEqual: 5,
    },

  ];

  operations.forEach((op) => {

    describe(op.name, () => {
      it('should get the correct result', () => {

        const stackFrame = createStackFrame(op.code, op.args);
        const res = executeStackFrame(stackFrame).value;

        assert.equal(res, op.resEqual);
      });

      it('should assert validations - 1 missing arg', () => {
        const stackFrame = createStackFrame(op.code, op.args.slice(-1));
        const fn = () => executeStackFrame(stackFrame);

        assert.throws(fn, /Assertion error/);
      });
    });

  });


});
