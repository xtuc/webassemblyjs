// @flow

type Cb = (type: string, path: NodePath<Node>) => void;

const debug = require("debug")("wasm:traverse");

function shift(node: Node, delta: number) {
  if (node.type === "SectionMetadata") {
    node.startOffset += delta;

    if (typeof node.size.loc === "object") {
      // $FlowIgnore
      node.size.loc.start.column += delta;
      // $FlowIgnore
      node.size.loc.end.column += delta;
    }

    if (typeof node.vectorOfSize.loc === "object") {
      // $FlowIgnore
      node.vectorOfSize.loc.start.column += delta;
      // $FlowIgnore
      node.vectorOfSize.loc.end.column += delta;
    }

    debug("shifted %s startOffset=%d", node.type, node.startOffset);
  } else {
    // // $FlowIgnore
    // node.loc.start.column += delta;
    // // $FlowIgnore
    // node.loc.end.column += delta;
    throw new Error("Can not shift node " + JSON.stringify(node.type));
  }
}

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
      fromNode.body = fromNode.body.filter(n => n !== node);
      break;

    default:
      throw new Error(
        "Unsupported operation: removing node of type: " + String(fromNode.type)
      );
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

    replaceWith,
    remove,
    shift: delta => shift(node, delta)
  };
}

function walk(n: Node, cb: Cb, parentPath: ?NodePath<Node>) {
  if (n._deleted === true) {
    return;
  }

  const path = createPath(n, parentPath);
  // $FlowIgnore
  cb(n.type, path);

  Object.keys(n).forEach((prop: string) => {
    const value = n[prop];
    if (!value) {
      return;
    }
    const valueAsArray = Array.isArray(value) ? value : [value];
    valueAsArray.forEach(v => {
      if (v.hasOwnProperty("type")) {
        walk(v, cb, path);
      }
    });
  });
}

export function traverse(n: Node, visitors: Object) {
  const parentPath = null;

  walk(
    n,
    (type: string, path: NodePath<Node>) => {
      if (typeof visitors["Node"] === "function") {
        visitors["Node"](path);
      }

      if (typeof visitors[type] === "function") {
        visitors[type](path);
      }
    },
    parentPath
  );
}

export function traverseWithHooks(
  n: Node,
  visitors: Object,
  before: Cb,
  after: Cb
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
    },
    parentPath
  );
}
