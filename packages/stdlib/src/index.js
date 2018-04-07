// @flow

export function console_log(...args) {
  const text = args.map(x => String.fromCharCode(x)).join("");
  console.log(text);
}
