// @flow
import debugModule from "debug";
import { unionTypesMap, nodeAndUnionTypes } from "./nodes";

const debug = debugModule("webassemblyjs:ast:traverse");

function findParent(
  { parentPath }: NodePathContext<Node>,
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

function createPathOperations(context: NodePathContext<Node>) {
  return {
    // $FlowIgnore: References?
    findParent: (cb: NodePath<Node>) => findParent(context, cb),
    replaceWith: (newNode: Node) => replaceWith(context, newNode),
    remove: () => remove(context)
  };
}

function createPath(context: NodePathContext<Node>): NodePath<Node> {
  return {
    ...context,
    ...createPathOperations(context)
  };
}

// recursively walks the AST starting at the given node. The callback is invoked for
// and object that has a 'type' property.
function walk(
  node: Node,
  callback: TraverseCallback,
  parentKey: ?string,
  parentPath: ?NodePath<Node>
) {
  if (node._deleted === true) {
    return;
  }

  const path = createPath({ node, parentKey, parentPath });
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
        walk(v, callback, prop, path);
      }
    });
  });
}

const noop = () => {};

export function traverse(
  n: Node,
  visitors: Object,
  before: TraverseCallback = noop,
  after: TraverseCallback = noop
) {
  Object.keys(visitors).forEach(visitor => {
    if (!nodeAndUnionTypes.includes(visitor)) {
      throw new Error(`Unexpected visitor ${visitor}`);
    }
  });

  walk(
    n,
    (type: string, path: NodePath<Node>) => {
      if (typeof visitors[type] === "function") {
        before(type, path);
        visitors[type](path);
        after(type, path);
      }

      const unionTypes = unionTypesMap[type];
      if (!unionTypes) {
        throw new Error(`Unexpected node type ${type}`);
      }
      unionTypes.forEach(unionType => {
        if (typeof visitors[unionType] === "function") {
          before(unionType, path);
          visitors[unionType](path);
          after(unionType, path);
        }
      });
    },
    null,
    null
  );
}
