// @flow

export function cloneNode(n: Node): Node {
  // $FlowIgnore
  return Object.assign({}, n);
}
