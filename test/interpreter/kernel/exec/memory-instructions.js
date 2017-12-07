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
        t.instruction('i32.const', [10]),
      ],

      resEqual: 10,
    },

    {
      name: 'set_local',

      args: [],

      code: [
        t.instruction('set_local', [0,
          t.instruction('i32.const', [10])
        ]),
        t.instruction('get_local', [0]),
      ],

      resEqual: 10,
    },

  ];

  operations.forEach((op) => {

    it(op.name + ' should result in a correct state', () => {
      const stackFrame = createStackFrame(op.code, op.args);
      const res = executeStackFrame(stackFrame).value;

      assert.equal(res, op.resEqual);
    });

  });
});
