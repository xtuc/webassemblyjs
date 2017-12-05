// @flow

const {assert} = require('chai');

const t = require('../../../lib/compiler/AST');
const modulevalue = require('../../../lib/interpreter/runtime/values/module');
const funcvalue = require('../../../lib/interpreter/runtime/values/func');

describe('module create interface', () => {

  describe('module exports', () => {

    it('should handle no export', () => {
      const node = t.module();
      const instance = modulevalue.createInstance(node);

      assert.typeOf(instance.exports, 'array');
      assert.lengthOf(instance.exports, 0);
    });

    it('should handle a func export', () => {
      const exportName = 'foo';

      const node = t.module(null, [
        t.func(exportName, [], null, []),
        t.moduleExport(exportName, 'Func', exportName)
      ]);

      const instance = modulevalue.createInstance(node);

      assert.typeOf(instance.exports, 'array');
      assert.lengthOf(instance.exports, 1);

      assert.equal(instance.exports[0].name, exportName);
      assert.equal(instance.exports[0].value.type, 'Func');

      assert.notEqual(instance.exports[0].value.addr.index, 0);
    });

  });

  describe('function instance', () => {

    it('return an instance', () => {
      const node = t.func('test', [], null, []);
      const fromModule = t.module();

      const instance = funcvalue.createInstance(node, fromModule);

      assert.typeOf(instance.type, 'array');
      assert.lengthOf(instance.type, 2);
      assert.typeOf(instance.type[0], 'array');
      assert.typeOf(instance.type[1], 'array');

      assert.typeOf(instance.code, 'array');

      assert.typeOf(instance.module, 'object');
    });

    it('return an instance with arg and result types', () => {
      const args = [
        {id: 'a', valtype: 'i32'},
        {id: 'b', valtype: 'i32'},
      ];

      const result = 'i32';

      const node = t.func('test', args, result, []);
      const fromModule = t.module();

      const instance = funcvalue.createInstance(node, fromModule);

      assert.deepEqual(instance.type[0], ['i32', 'i32']);
      assert.deepEqual(instance.type[1], ['i32']);
    });
  });
});
