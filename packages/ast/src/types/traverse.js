// @flow
/* eslint no-unused-vars: off */

type TraverseCallback = (type: string, path: NodePath<Node>) => void;

type NodePath<T> = {
  node: T,
  parentPath: ?NodePath<Node>,
  parentKey: ?string,
  findParent: (NodePath<Node>) => ?boolean,
  replaceWith: Node => void,
  remove: () => void
};
