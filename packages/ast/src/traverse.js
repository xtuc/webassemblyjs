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

  switch (n.type) {
    case "Program": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      n.body.forEach(x => walk(x, cb, path));

      break;
    }

    case "SectionMetadata":
    case "FunctionNameMetadata":
    case "ModuleNameMetadata":
    case "LocalNameMetadata":
    case "Data":
    case "Memory":
    case "Elem":
    case "FuncImportDescr":
    case "GlobalType":
    case "NumberLiteral":
    case "ValtypeLiteral":
    case "FloatLiteral":
    case "StringLiteral":
    case "QuoteModule":
    case "LongNumberLiteral":
    case "BinaryModule":
    case "LeadingComment":
    case "BlockComment":
    case "Identifier": {
      cb(n.type, createPath(n, parentPath));
      break;
    }

    case "ModuleExport": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      walk(n.descr.id, cb, path);

      break;
    }

    case "ModuleMetadata": {
      const path = createPath(n, parentPath);
      cb(n.type, path);
      n.sections.forEach(x => walk(x, cb, path));

      if (typeof n.functionNames !== "undefined") {
        // $FlowIgnore
        n.functionNames.forEach(x => walk(x, cb, path));
      }

      if (typeof n.localNames !== "undefined") {
        // $FlowIgnore
        n.localNames.forEach(x => walk(x, cb, path));
      }
      break;
    }

    case "Module": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      if (typeof n.fields !== "undefined") {
        n.fields.forEach(x => walk(x, cb, path));
      }

      if (typeof n.metadata !== "undefined") {
        // $FlowIgnore
        walk(n.metadata, cb, path);
      }

      break;
    }

    case "Start":
    case "CallInstruction": {
      const path = createPath(n, parentPath);
      // $FlowIgnore
      cb(n.type, path);

      // $FlowIgnore
      walk(n.index, cb, path);

      break;
    }

    case "CallIndirectInstruction": {
      const path = createPath(n, parentPath);
      // $FlowIgnore
      cb(n.type, path);

      if (n.index != null) {
        // $FlowIgnore
        walk(n.index, cb, path);
      }

      break;
    }

    case "ModuleImport": {
      cb(n.type, createPath(n, parentPath));

      if (n.descr != null) {
        // $FlowIgnore
        walk(n.descr, cb, createPath(n, parentPath));
      }

      break;
    }

    case "Table":
    case "Global": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      if (n.name != null) {
        walk(n.name, cb, path);
      }

      if (n.init != null) {
        // $FlowIgnore
        n.init.forEach(x => walk(x, cb, path));
      }

      break;
    }

    case "TypeInstruction": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      if (n.id != null) {
        walk(n.id, cb, path);
      }

      break;
    }

    case "IfInstruction": {
      const path = createPath(n, parentPath);

      // $FlowIgnore
      cb(n.type, path);

      // $FlowIgnore
      n.test.forEach(x => walk(x, cb, path));
      // $FlowIgnore
      n.consequent.forEach(x => walk(x, cb, path));
      // $FlowIgnore
      n.alternate.forEach(x => walk(x, cb, path));

      // $FlowIgnore
      walk(n.testLabel, cb, path);

      break;
    }

    case "Instr": {
      const path = createPath(n, parentPath);
      // $FlowIgnore
      cb(n.type, path);

      // $FlowIgnore
      if (typeof n.args === "object") {
        n.args.forEach(x => walk(x, cb, path));
      }

      break;
    }

    case "BlockInstruction":
    case "LoopInstruction": {
      const path = createPath(n, parentPath);
      // $FlowIgnore
      cb(n.type, path);

      if (n.label != null) {
        // $FlowIgnore
        walk(n.label, cb, path);
      }

      // $FlowIgnore
      n.instr.forEach(x => walk(x, cb, path));

      break;
    }

    case "Func": {
      const path = createPath(n, parentPath);
      cb(n.type, path);

      n.body.forEach(x => walk(x, cb, path));

      if (n.name != null) {
        walk(n.name, cb, path);
      }

      break;
    }

    default:
      throw new Error(
        "Unknown node encounter of type: " + JSON.stringify(n.type)
      );
  }
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
