// @flow
/* eslint no-unused-vars: off */

type TraverseCallback = (type: string, path: NodePath<Node>) => void;

type NodePathContext<T> = {
  node: T,
  parentPath: ?NodePath<Node>,
  parentKey: ?string
};

type NodePathOperations = {
  findParent: (NodePath<Node>) => ?boolean,
  replaceWith: Node => void,
  remove: () => void
};

type NodePath<T> = NodePathContext<T> & NodePathOperations;
