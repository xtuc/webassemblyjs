// @flow

const {assert} = require('chai');

const t = require('../../../lib/compiler/AST');
const modulevalue = require('../../../lib/interpreter/runtime/values/module');
const funcvalue = require('../../../lib/interpreter/runtime/values/func');
const i32 = require('../../../lib/interpreter/runtime/values/i32');
const i64 = require('../../../lib/interpreter/runtime/values/i64');
const f32 = require('../../../lib/interpreter/runtime/values/f32');
const f64 = require('../../../lib/interpreter/runtime/values/f64');
const label = require('../../../lib/interpreter/runtime/values/label');

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

  it('i32 createValue should return the correct value', () => {
    const v = i32.createValue(1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1);
    assert.equal(v.type, 'i32');
  });

  it('i32 createValue should return an int from a float', () => {
    const v = i32.createValue(1.1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1);
    assert.equal(v.type, 'i32');
  });

  it('i64 createValue should return the correct value', () => {
    const v = i64.createValue(1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1);
    assert.equal(v.type, 'i64');
  });

  it('i64 createValue should return an int from a float', () => {
    const v = i64.createValue(1.1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1);
    assert.equal(v.type, 'i64');
  });

  it('f32 createValue should return a float', () => {
    const v = f32.createValue(1.0);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1.0);
    assert.equal(v.type, 'f32');
  });

  it('f32 createValue should return a float from a int', () => {
    const v = f32.createValue(1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1.0);
    assert.equal(v.type, 'f32');
  });

  it('f64 createValue should return a float', () => {
    const v = f64.createValue(1.0);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1.0);
    assert.equal(v.type, 'f64');
  });

  it('f64 createValue should return a float from a int', () => {
    const v = f64.createValue(1);

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'number');

    assert.equal(v.value, 1.0);
    assert.equal(v.type, 'f64');
  });

  it('label createValue should return the correct value', () => {
    const v = label.createValue('name');

    assert.typeOf(v, 'object');
    assert.typeOf(v.type, 'string');
    assert.typeOf(v.value, 'string');

    assert.equal(v.value, 'name');
    assert.equal(v.type, 'label');
  });
});
