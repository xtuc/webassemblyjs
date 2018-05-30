// @flow

import debugModule from "debug";
const debug = debugModule("webassemblyjs:ast:traverse");

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
  if (!inList) {
    throw new Error("insert can only be used for nodes that are within lists");
  }

  // $FlowIgnore: References?
  const parentList = parentPath.node[parentKey];
  const indexInList = parentList.findIndex(n => n === node);
  parentList.splice(indexInList + indexOffset, 0, newNode);
}

function remove({ node, parentKey, parentPath }: NodePathContext<Node>) {
  if (parentPath == null) {
    throw new Error("Can not remove root node");
  }

  const parentNode = parentPath.node;
  // $FlowIgnore: References?
  const parentProperty = parentNode[parentKey];
  if (Array.isArray(parentProperty)) {
    // $FlowIgnore: References?
    parentNode[parentKey] = parentProperty.filter(n => n !== node);
  } else {
    // $FlowIgnore: References?
    delete parentNode[parentKey];
  }

  node._deleted = true;

  debug("delete path %s", node.type);
}

function stop(context: NodePathContext<Node>) {
  context.shouldStop = true;
}

function replaceWith(
  { node, parentKey, parentPath }: NodePathContext<Node>,
  newNode: Node
) {
  // $FlowIgnore
  const parentNode = parentPath.node;
  // $FlowIgnore
  const parentProperty = parentNode[parentKey];
  if (Array.isArray(parentProperty)) {
    const indexInList = parentProperty.findIndex(n => n === node);
    parentProperty.splice(indexInList, 1, newNode);
  } else {
    // $FlowIgnore: References?
    parentNode[parentKey] = newNode;
  }
}

// bind the context to the first argument of node operations
function bindNodeOperations(
  operations: Object,
  context: NodePathContext<Node>
) {
  const keys = Object.keys(operations);
  const boundOperations = {};
  keys.forEach(key => {
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
      stop
    },
    context
  );
}

export function createPath(context: NodePathContext<Node>): NodePath<Node> {
  const path = {
    ...context
  };
  Object.assign(path, createPathOperations(path));
  return path;
}
