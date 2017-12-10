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

  describe('WebAssembly.instantiate', () => {

    it('should be a function', () => {
      assert.typeOf(WebAssembly.instantiate, 'Function');
    });

    it('should have an arity of 2', () => {
      assert.equal(WebAssembly.instantiate.length, 2);
    });

    it('should return a promise', () => {
      const res = WebAssembly.instantiate();

      assert.instanceOf(res, Promise);
    });
  });

});
