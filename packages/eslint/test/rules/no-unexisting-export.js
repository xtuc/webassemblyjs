const rule = require("../../lib/rules/no-unexisting-export");
const RuleTester = require("../RuleTester");

const ruleTester = new RuleTester();
ruleTester.run("file-exists", rule, {
  valid: [
    "import('./packages/eslint/test/addTwo.wasm').then(x => x.addTwo(1, 2));"
  ],
  invalid: [
    {
      code: "import('./non-existing.wasm').then()",
      errors: [{ message: '"non-existing.wasm" is not a valid WASM file' }]
    },

    {
      code: "import('./packages/eslint/test/addTwo.wasm').then(x => x.foo())",
      errors: [{ message: '"foo" is not exported' }]
    }
  ]
});
