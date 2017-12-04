const {assert} = require('chai');

const t = require('../../../lib/compiler/AST');
const {createInstance} = require('../../../lib/interpreter/runtime/values/module');

describe('module create interface', () => {

  describe('module exports', () => {

    it('should handle no export', () => {
      const node = t.module();
      const module = createInstance(node);

      assert.typeOf(module.exports, 'array');
      assert.lengthOf(module.exports, 0);
    });

    it('should handle a func export', () => {
      const exportName = 'foo';

      const node = t.module(null, [
        t.moduleExport(exportName, 'Func', exportName)
      ]);

      const module = createInstance(node);

      assert.typeOf(module.exports, 'array');
      assert.lengthOf(module.exports, 1);

      assert.equal(module.exports[0].name, exportName);

      // TODO(sven): check for externalval ^
    });

  });
});
