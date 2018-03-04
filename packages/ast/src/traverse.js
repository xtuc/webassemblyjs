// @flow

type Cb = (type: string, path: NodePath<Node>) => void;

function removeNodeInBody(node: Node, fromNode: Node) {
  switch (fromNode.type) {
    case "Module":
      // $FlowIgnore: type ensures that
      fromNode.fields = fromNode.fields.filter(n => n !== node);
      break;

    case "Program":
    case "Func":
      // $FlowIgnore: type ensures that
      fromNode.body = fromNode.body.filter(n => n !== node);
      break;

    default:
      throw new Error(
        "Unsupported operation: removing node of type: " + fromNode.type
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
  }

  // TODO(sven): do it the good way, changing the node from the parent
  function replaceWith(newNode: Node) {
    Object.assign(node, newNode);
  }

  return {
    node,
    parentPath,

    replaceWith,
    remove
  };
}

function walk(n: Node, cb: Cb, parentPath: ?NodePath<Node>) {
  if (n._deleted === true) {
    return;
  }

  if (n.type === "Program") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    n.body.forEach(x => walk(x, cb, path));
  }

  if (
    n.type === "SectionMetadata" ||
    n.type === "ModuleExport" ||
    n.type === "Data" ||
    n.type === "Memory" ||
    n.type === "Elem" ||
    n.type === "Identifier"
  ) {
    cb(n.type, createPath(n, parentPath));
  }

  if (n.type === "Module") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    if (typeof n.fields !== "undefined") {
      // $FlowIgnore
      n.fields.forEach(x => walk(x, cb, path));
    }

    if (typeof n.metadata !== "undefined") {
      // $FlowIgnore
      n.metadata.sections.forEach(x => walk(x, cb, path));
    }
  }

  if (n.type === "Start" || n.type === "CallInstruction") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    walk(n.index, cb, path);
  }

  if (n.type === "ModuleImport") {
    cb(n.type, createPath(n, parentPath));

    // $FlowIgnore
    cb(n.descr.type, createPath(n.descr, parentPath));
  }

  if (n.type === "Table" || n.type === "Global") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb, path);
    }
  }

  if (n.type === "IfInstruction") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    n.test.forEach(x => walk(x, cb, path));
    // $FlowIgnore
    walk(n.testLabel, cb, path);
    // $FlowIgnore
    n.consequent.forEach(x => walk(x, cb, path));
    // $FlowIgnore
    n.alternate.forEach(x => walk(x, cb, path));
  }

  if (n.type === "Instr") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    n.args.forEach(x => walk(x, cb, path));
  }

  if (n.type === "BlockInstruction" || n.type === "LoopInstruction") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    if (n.label != null) {
      // $FlowIgnore
      walk(n.label, cb, path);
    }

    // $FlowIgnore
    n.instr.forEach(x => walk(x, cb, path));
  }

  if (n.type === "IfInstruction") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    walk(n.testLabel, cb, path);

    // $FlowIgnore
    n.consequent.forEach(x => walk(x, cb, path));
    // $FlowIgnore
    n.alternate.forEach(x => walk(x, cb, path));
  }

  if (n.type === "Func") {
    const path = createPath(n, parentPath);
    cb(n.type, path);

    // $FlowIgnore
    n.body.forEach(x => walk(x, cb, path));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb, path);
    }
  }
}

export function traverse(n: Node, visitors: Object) {
  const parentPath = null;

  walk(
    n,
    (type: string, path: NodePath<Node>) => {
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
