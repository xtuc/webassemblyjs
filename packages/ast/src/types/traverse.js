// @flow
/* eslint no-unused-vars: off */

type TraverseCallback = (type: string, path: NodePath<Node>) => void;

type NodePathContext<T> = {
  node: T,
  inList: boolean,
  shouldStop: boolean,
  parentPath: ?NodePath<Node>,
  parentKey: ?string
};

type NodePathMatcher = (NodePath<Node>) => ?boolean;
type NodeLocator = NodePathMatcher => ?Node;

type NodePathOperations = {
  findParent: NodeLocator,
  replaceWith: Node => void,
  remove: () => void,
  insertBefore: Node => void,
  insertAfter: Node => void,
  stop: () => void
};

type NodePath<T> = NodePathContext<T> & NodePathOperations;
