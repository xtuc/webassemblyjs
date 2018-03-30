const { RuleTester } = require("eslint");

RuleTester.setDefaultConfig({
  parser: "babel-eslint"
});

module.exports = RuleTester;
