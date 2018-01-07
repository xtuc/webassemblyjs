// @flow

const {readFileSync} = require('fs');
const glob = require('glob');

const WebAssembly = require('../lib');

describe('spec', () => {

  describe('watf', () => {
    const testSuites = glob.sync('spec/test/core/**/*.wast');

    testSuites.forEach((suite) => {

      describe(suite, () => {
        const module = readFileSync(suite, 'utf8');

        it('should run the test file', () => {
          WebAssembly.instantiateFromSource(module);
        });
      });
    });

  });
});
