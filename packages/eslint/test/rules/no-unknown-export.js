const rule = require("../../lib/rules/no-unknown-export");
const RuleTester = require("../RuleTester");

const ruleTester = new RuleTester();
ruleTester.run("file-exists", rule, {
  valid: [
    "import('./packages/eslint/test/addTwo.wasm')",
    "import('./packages/eslint/test/addTwo.wasm').then(x => x.addTwo);",
    "import('./packages/eslint/test/addTwo.wasm').then(({addTwo}) => addTwo);",
  ],
  invalid: [
    {
      code: "import('./non-existing.wasm').then()",
      errors: [{ message: '"non-existing.wasm" is not a valid WASM file' }],
    },

    {
      code: "import('./packages/eslint/test/addTwo.wasm').then(x => x.foo())",
      errors: [{ message: '"foo" is not exported' }],
    },

    {
      code: "import('./packages/eslint/test/addTwo.wasm').then(({bar}) => bar)",
      errors: [{ message: '"bar" is not exported' }],
    },
  ],
});
