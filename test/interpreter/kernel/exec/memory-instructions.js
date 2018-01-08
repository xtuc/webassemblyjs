// @flow

const {assert} = require('chai');

const t = require('../../../../lib/compiler/AST');
const {executeStackFrame} = require('../../../../lib/interpreter/kernel/exec');
const {createStackFrame} = require('../../../../lib/interpreter/kernel/stackframe');

describe('kernel exec - memory instructions', () => {

  const operations = [

    {
      name: 'i32.const',

      args: [],

      code: [
        t.objectInstruction('const', 'i32', [t.numberLiteral(10)]),
      ],

      resEqual: 10,
    },

    {
      name: 'f32.const',

      args: [],

      code: [
        t.objectInstruction('const', 'f32', [t.numberLiteral(10.0)]),
      ],

      resEqual: 10.0,
    },

    {
      name: 'f64.const',

      args: [],

      code: [
        t.objectInstruction('const', 'f64', [t.numberLiteral(10.0)]),
      ],

      resEqual: 10.0,
    },

    {
      name: 'set_local',

      args: [],

      code: [
        t.instruction('set_local', [t.numberLiteral(0),
          t.objectInstruction('const', 'i32', [t.numberLiteral(10)]),
        ]),
        t.instruction('get_local', [t.numberLiteral(0)]),
      ],

      resEqual: 10,
    },

    {
      name: 'tee_local',

      args: [],

      code: [
        t.instruction('tee_local', [t.numberLiteral(0),
          t.objectInstruction('const', 'i32', [t.numberLiteral(2)]),
        ]),
      ],

      resEqual: 2,
    },

  ];

  operations.forEach((op) => {

    it(op.name + ' should result in a correct state', () => {
      const stackFrame = createStackFrame(op.code, op.args);
      const res = executeStackFrame(stackFrame);

      if (typeof res === 'undefined') {
        throw new Error('No result');
      }

      assert.equal(res.value, op.resEqual);
    });

  });
});
