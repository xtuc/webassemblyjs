// @flow

export function cloneNode(n: Node): Node {
  return Object.assign({}, n);
}
