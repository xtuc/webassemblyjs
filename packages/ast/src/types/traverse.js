// @flow
/* eslint no-unused-vars: off */

type TraverseCallback = (type: string, path: NodePath<Node>) => void;

type NodePathContext<T> = {
  node: T,
  parentPath: ?NodePath<Node>,
  parentKey: ?string
};

type NodePathMatcher = (NodePath<Node>) => ?boolean;
type NodeLocator = NodePathMatcher => ?Node;

type NodePathOperations = {
  findParent: NodeLocator,
  replaceWith: Node => void,
  remove: () => void
};

type NodePath<T> = NodePathContext<T> & NodePathOperations;
