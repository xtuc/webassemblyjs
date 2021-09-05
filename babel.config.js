const useESM = process.env["ESM"] === "1";

let modules = "commonjs";

if (useESM) {
  modules = false;
}

const presets = [
  ['@babel/preset-env', { modules }],
  '@babel/preset-flow',
];

const plugins = [
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-object-rest-spread',
  'babel-plugin-mamacro',
];

module.exports = {
  presets,
  plugins,
}
