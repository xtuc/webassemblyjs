// @flow

export function cloneNode(n: Node): Node {
  // $FlowIgnore
  const newObj: Node = {};

  for (const k in n) {
    newObj[k] = n[k];
  }

  return newObj;
}
