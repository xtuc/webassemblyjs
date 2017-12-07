// @flow

const {assert} = require('chai');

const t = require('../../../../lib/compiler/AST');
const {executeStackFrame} = require('../../../../lib/interpreter/kernel/exec');
const {createStackFrame} = require('../../../../lib/interpreter/kernel/stackframe');

describe('kernel exec - numeric instructions', () => {

  const operations = [

    /**
     * Integer 32 bits
     */

    {
      name: 'i32.add',

      args: [
        {value: 1, type: 'i32'},
        {value: 1, type: 'i32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('add', 'i32'),
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
        t.objectInstruction('sub', 'i32'),
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
        t.objectInstruction('mul', 'i32'),
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
        t.objectInstruction('div_s', 'i32'),
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
        t.objectInstruction('div_u', 'i32'),
      ],

      resEqual: 5,
    },


    /**
     * Integer 64 bits
     */

    {
      name: 'i64.add',

      args: [
        {value: 1, type: 'i64'},
        {value: 1, type: 'i64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('add', 'i64'),
      ],

      resEqual: 2,
    },

    {
      name: 'i64.sub',

      args: [
        {value: 1, type: 'i64'},
        {value: 1, type: 'i64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('sub', 'i64'),
      ],

      resEqual: 0,
    },

    {
      name: 'i64.mul',

      args: [
        {value: 2, type: 'i64'},
        {value: 1, type: 'i64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('mul', 'i64'),
      ],

      resEqual: 2,
    },

    {
      name: 'i64.div_s',

      args: [
        {value: 2, type: 'i64'},
        {value: 10, type: 'i64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('div_s', 'i64'),
      ],

      resEqual: 5,
    },

    {
      name: 'i64.div_u',

      args: [
        {value: 2, type: 'i64'},
        {value: 10, type: 'i64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('div_u', 'i64'),
      ],

      resEqual: 5,
    },

    /**
     * Float 32 bits
     */

    {
      name: 'f32.add',

      args: [
        {value: 1.0, type: 'f32'},
        {value: 1.0, type: 'f32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('add', 'f32'),
      ],

      resEqual: 2,
    },

    {
      name: 'f32.sub',

      args: [
        {value: 1.0, type: 'f32'},
        {value: 1.0, type: 'f32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('sub', 'f32'),
      ],

      resEqual: 0,
    },

    {
      name: 'f32.mul',

      args: [
        {value: 2.0, type: 'f32'},
        {value: 1.0, type: 'f32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('mul', 'f32'),
      ],

      resEqual: 2,
    },

    {
      name: 'f32.div',

      args: [
        {value: 2.0, type: 'f32'},
        {value: 10.0, type: 'f32'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('div', 'f32'),
      ],

      resEqual: 5.0,
    },


    /**
     * Float 64 bits
     */

    {
      name: 'f64.add',

      args: [
        {value: 1.0, type: 'f64'},
        {value: 1.0, type: 'f64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('add', 'f64'),
      ],

      resEqual: 2.0,
    },

    {
      name: 'f64.sub',

      args: [
        {value: 1.0, type: 'f64'},
        {value: 1.0, type: 'f64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('sub', 'f64'),
      ],

      resEqual: 0,
    },

    {
      name: 'f64.mul',

      args: [
        {value: 2.0, type: 'f64'},
        {value: 1.0, type: 'f64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('mul', 'f64'),
      ],

      resEqual: 2.0,
    },

    {
      name: 'f64.div',

      args: [
        {value: 2.0, type: 'f64'},
        {value: 10.0, type: 'f64'},
      ],

      code: [
        t.instruction('get_local', [0]),
        t.instruction('get_local', [1]),
        t.objectInstruction('div', 'f64'),
      ],

      resEqual: 5.0,
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
