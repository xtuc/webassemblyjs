// @flow

const {assert} = require('chai');

const {
  initializeMemory,
  malloc,
  set,
  get,
} = require('../../../lib/interpreter/kernel/memory');

describe('kernel - memory management', () => {

  describe('memory allocation', () => {

    it('should start from NULL and increment', () => {
      const size = 8;

      initializeMemory(512);
      const p = malloc(size);

      assert.equal(p.index, size);

      const p2 = malloc(size);
      assert.equal(p2.index, size * 2);
    });

  });

  describe('set/get', () => {

    it('should get an empty value', () => {
      initializeMemory(512);
      const p = malloc(8);

      const value = get(p);

      assert.equal(value, undefined);
    });

    it('should get and set a value', () => {
      initializeMemory(32);

      const data = 1;
      const p = malloc(1);

      set(p, data);

      const value = get(p);

      assert.equal(value, data);
    });

  });
});
