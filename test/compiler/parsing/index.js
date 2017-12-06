// @flow

const glob = require('glob');
const diff = require('jest-diff');
const {NO_DIFF_MESSAGE} = require('jest-diff/build/constants');
const {writeFileSync, readFileSync} = require('fs');
const path = require('path');

const {parse} = require('../../../lib');

const testSuites = glob.sync('test/compiler/parsing/fixtures/**/actual.watf');

describe('compiler', () => {

  testSuites.forEach((suite) => {

    it(suite, () => new Promise((resolve) => {
      function check(ast) {
        const expectedFile = path.join(path.dirname(suite), 'expected.json');
        const code = JSON.stringify(ast, null, 2);

        let expected;
        try {
          expected = readFileSync(expectedFile, 'utf8');
        } catch (e) {
          expected = code;

          writeFileSync(expectedFile, code);

          console.log('Write expected file', expectedFile);
        }

        const out = diff(code.trim(), expected.trim());

        if (out !== null && out !== NO_DIFF_MESSAGE) {
          throw new Error('\n' + out);
        }

        // When one line the error is not caught
        if (code.trim() !== expected.trim()) {
          throw new Error('Assertion error');
        }

        resolve();
      }

      const code = readFileSync(suite, 'utf8');

      parse(code, check);
    }));
  });
});

