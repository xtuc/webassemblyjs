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

function insert(
  { node, inList, parentPath, parentKey }: NodePathContext<Node>,
  newNode: Node,
  indexOffset: number = 0
) {
  if (!inList) {
    throw new Error(
      "insert can only be used for nodes that are within lists"
    );
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

// TODO(sven): do it the good way, changing the node from the parent
function replaceWith({ node }: NodePathContext<Node>, newNode: Node) {
  // Remove all the keys first
  // $FlowIgnore
  Object.keys(node).forEach(k => delete node[k]);

  // $FlowIgnore
  Object.assign(node, newNode);
}

function createPathOperations(
  context: NodePathContext<Node>
): NodePathOperations {
  return {
    findParent: (cb: NodePathMatcher) => findParent(context, cb),
    replaceWith: (newNode: Node) => replaceWith(context, newNode),
    remove: () => remove(context),
    insertBefore: (newNode: Node) => insert(context, newNode),
    insertAfter: (newNode: Node) => insert(context, newNode, 1)
  };
}

export function createPath(context: NodePathContext<Node>): NodePath<Node> {
  return {
    ...context,
    ...createPathOperations(context)
  };
}
