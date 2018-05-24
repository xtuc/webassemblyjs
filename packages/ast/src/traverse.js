// @flow

type Cb = (type: string, path: NodePath<Node>) => void;

import debugModule from "debug";
import { unionTypesMap } from "./nodes";

const debug = debugModule("webassemblyjs:ast:traverse");

function removeNodeInBody(node: Node, fromNode: Node) {
  switch (fromNode.type) {
    case "ModuleMetadata":
      fromNode.sections = fromNode.sections.filter(n => n !== node);
      break;

    case "Module":
      fromNode.fields = fromNode.fields.filter(n => n !== node);
      break;

    case "Program":
    case "Func":
      // $FlowIgnore it says References?
      fromNode.body = fromNode.body.filter(n => n !== node);
      break;

    default:
      throw new Error(
        "Unsupported operation: removing node of type: " + String(fromNode.type)
      );
  }
}

function findParent(
  parentPath: NodePath<Node>,
  cb: (NodePath<Node>) => ?boolean
) {
  if (parentPath == null) {
    throw new Error("node is root");
  }

  let currentPath = parentPath;

  while (cb(currentPath) !== false) {
    // Hit the root node, stop
    // $FlowIgnore
    if (currentPath.parentPath == null) {
      break;
    }

    // $FlowIgnore
    currentPath = currentPath.parentPath;
  }
}

function createPath(node: Node, parentPath: ?NodePath<Node>): NodePath<Node> {
  function remove() {
    if (parentPath == null) {
      throw new Error("Can not remove root node");
    }

    const parentNode = parentPath.node;
    removeNodeInBody(node, parentNode);

    node._deleted = true;

    debug("delete path %s", node.type);
  }

  // TODO(sven): do it the good way, changing the node from the parent
  function replaceWith(newNode: Node) {
    // Remove all the keys first
    // $FlowIgnore
    Object.keys(node).forEach(k => delete node[k]);

    // $FlowIgnore
    Object.assign(node, newNode);
  }

  return {
    node,
    parentPath,

    // $FlowIgnore: References?
    findParent: cb => findParent(parentPath, cb),
    replaceWith,
    remove
  };
}

// recursively walks the AST starting at the given node. The callback is invoked for
// and object that has a 'type' property.
function walk(node: Node, callback: Cb, parentPath: ?NodePath<Node>) {
  if (node._deleted === true) {
    return;
  }

  const path = createPath(node, parentPath);
  // $FlowIgnore
  callback(node.type, path);

  Object.keys(node).forEach((prop: string) => {
    const value = node[prop];
    if (value === null || value === undefined) {
      return;
    }
    const valueAsArray = Array.isArray(value) ? value : [value];
    valueAsArray.forEach(v => {
      if (typeof v.type === "string") {
        walk(v, callback, path);
      }
    });
  });
}

const noop = () => {};

export function traverse(
  n: Node,
  visitors: Object,
  before: Cb = noop,
  after: Cb = noop
) {
  const parentPath = null;

  walk(
    n,
    (type: string, path: NodePath<Node>) => {
      if (typeof visitors[type] === "function") {
        before(type, path);
        visitors[type](path);
        after(type, path);
      }

      const unionTypes = unionTypesMap[type];
      unionTypes.forEach(unionType => {
        if (typeof visitors[unionType] === "function") {
          before(unionType, path);
          visitors[unionType](path);
          after(unionType, path);
        }
      });
    },
    parentPath
  );
}
