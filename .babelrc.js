const presets = [
  '@babel/preset-env',
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
