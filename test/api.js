// @flow

const WebAssembly = require('../lib');
const {assert} = require('chai');

describe('WebAssembly JavaScript API', () => {

  it('should export an Object', () => {
    assert.typeOf(WebAssembly, 'Object');
  });

  it('should export WebAssembly.RuntimeError', () => {
    assert.typeOf(WebAssembly.RuntimeError, 'function');
    assert.instanceOf(new WebAssembly.RuntimeError, Error);
  });

  it('should export WebAssembly.Module', () => {
    assert.typeOf(WebAssembly.Module, 'function');
    assert.typeOf(WebAssembly.Module.constructor, 'Function');
  });

  describe('WebAssembly.instantiate', () => {

    it('should be a function with 2 arguments', () => {
      assert.typeOf(WebAssembly.instantiate, 'Function');
      assert.equal(WebAssembly.instantiate.length, 2);
    });

    it('should return a promise', () => {
      const res = WebAssembly.instantiate();

      assert.instanceOf(res, Promise);
    });

  });

  describe('WebAssembly.Instance', () => {

    it('should have a constructor', () => {
      assert.typeOf(WebAssembly.Instance, 'function');
      assert.typeOf(WebAssembly.Instance.constructor, 'Function');
      assert.equal(WebAssembly.Instance.length, 2);
    });

  });

  describe('WebAssembly.compile', () => {

    it('should be a function', () => {
      assert.typeOf(WebAssembly.compile, 'function');
    });

    xit('should return a WebAssembly.Module instance', () => {
    });

  });

});
