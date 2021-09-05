// @flow

import { assert } from "mamacro";

function findParent(
  { parentPath }: NodePathContext<Node>,
  cb: NodePathMatcher
): ?Node {
  if (parentPath == null) {
    throw new Error("node is root");
  }

  let currentPath = parentPath;

  while (cb(currentPath) !== false) {
    // Hit the root node, stop
    // $FlowIgnore
    if (currentPath.parentPath == null) {
      return null;
    }

    // $FlowIgnore
    currentPath = currentPath.parentPath;
  }
  return currentPath.node;
}

function insertBefore(context: NodePathContext<Node>, newNode) {
  return insert(context, newNode);
}

function insertAfter(context: NodePathContext<Node>, newNode) {
  return insert(context, newNode, 1);
}

function insert(
  { node, inList, parentPath, parentKey }: NodePathContext<Node>,
  newNode: Node,
  indexOffset: number = 0
) {
  assert(inList, "insert can only be used for nodes that are within lists");
  assert(parentPath != null, "Can not remove root node");

  // $FlowIgnore
  const parentList = parentPath.node[parentKey];
  const indexInList = parentList.findIndex((n) => n === node);
  parentList.splice(indexInList + indexOffset, 0, newNode);
}

function remove({ node, parentKey, parentPath }: NodePathContext<Node>) {
  assert(parentPath != null, "Can not remove root node");

  // $FlowIgnore
  const parentNode: Node = parentPath.node;
  // $FlowIgnore
  const parentProperty = parentNode[parentKey];
  if (Array.isArray(parentProperty)) {
    // $FlowIgnore
    parentNode[parentKey] = parentProperty.filter((n) => n !== node);
  } else {
    // $FlowIgnore
    delete parentNode[parentKey];
  }

  node._deleted = true;
}

function stop(context: NodePathContext<Node>) {
  context.shouldStop = true;
}

function replaceWith(context: NodePathContext<Node>, newNode: Node) {
  // $FlowIgnore
  const parentNode = context.parentPath.node;
  // $FlowIgnore
  const parentProperty = parentNode[context.parentKey];
  if (Array.isArray(parentProperty)) {
    const indexInList = parentProperty.findIndex((n) => n === context.node);
    parentProperty.splice(indexInList, 1, newNode);
  } else {
    // $FlowIgnore
    parentNode[context.parentKey] = newNode;
  }
  context.node._deleted = true;
  context.node = newNode;
}

// bind the context to the first argument of node operations
function bindNodeOperations(
  operations: Object,
  context: NodePathContext<Node>
) {
  const keys = Object.keys(operations);
  const boundOperations = {};
  keys.forEach((key) => {
    boundOperations[key] = operations[key].bind(null, context);
  });
  return boundOperations;
}

function createPathOperations(
  context: NodePathContext<Node>
): NodePathOperations {
  // $FlowIgnore
  return bindNodeOperations(
    {
      findParent,
      replaceWith,
      remove,
      insertBefore,
      insertAfter,
      stop,
    },
    context
  );
}

export function createPath(context: NodePathContext<Node>): NodePath<Node> {
  const path = {
    ...context,
  };
  // $FlowIgnore
  Object.assign(path, createPathOperations(path));
  // $FlowIgnore
  return path;
}
