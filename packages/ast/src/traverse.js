// @flow

type Cb = (type: string, path: NodePath<Node>) => void;

function createPath(node: Node): NodePath<Node> {
  return {
    node
  };
}

function walk(n: Node, cb: Cb) {
  if (n.type === "Program") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.body.forEach(x => walk(x, cb));
  }

  if (n.type === "Module") {
    cb(n.type, createPath(n));

    if (typeof n.fields !== "undefined") {
      // $FlowIgnore
      n.fields.forEach(x => walk(x, cb));
    }
  }

  if (n.type === "ModuleExport") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Start") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    walk(n.index, cb);
  }

  if (n.type === "Data") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Identifier") {
    cb(n.type, createPath(n));
  }

  if (n.type === "ModuleImport") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    cb(n.descr.type, createPath(n.descr));
  }

  if (n.type === "Global") {
    cb(n.type, createPath(n));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }

  if (n.type === "Table") {
    cb(n.type, createPath(n));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }

  if (n.type === "IfInstruction") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.test.forEach(x => walk(x, cb));
    // $FlowIgnore
    walk(n.testLabel, cb);
    // $FlowIgnore
    n.consequent.forEach(x => walk(x, cb));
    // $FlowIgnore
    n.alternate.forEach(x => walk(x, cb));
  }

  if (n.type === "Memory") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Elem") {
    cb(n.type, createPath(n));
  }

  if (n.type === "Instr") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.args.forEach(x => walk(x, cb));
  }

  if (n.type === "CallInstruction") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    walk(n.index, cb);
  }

  if (n.type === "LoopInstruction") {
    cb(n.type, createPath(n));

    if (n.label != null) {
      // $FlowIgnore
      walk(n.label, cb);
    }

    // $FlowIgnore
    n.instr.forEach(x => walk(x, cb));
  }

  if (n.type === "BlockInstruction") {
    cb(n.type, createPath(n));

    if (n.label != null) {
      // $FlowIgnore
      walk(n.label, cb);
    }

    // $FlowIgnore
    n.instr.forEach(x => walk(x, cb));
  }

  if (n.type === "IfInstruction") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    walk(n.testLabel, cb);

    // $FlowIgnore
    n.consequent.forEach(x => walk(x, cb));
    // $FlowIgnore
    n.alternate.forEach(x => walk(x, cb));
  }

  if (n.type === "Func") {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.body.forEach(x => walk(x, cb));

    if (n.name != null) {
      // $FlowIgnore
      walk(n.name, cb);
    }
  }
}

export function traverse(n: Node, visitors: Object) {
  walk(n, (type: string, path: NodePath<Node>) => {
    if (typeof visitors[type] === "function") {
      visitors[type](path);
    }
  });
}

export function traverseWithHooks(
  n: Node,
  visitors: Object,
  before: Cb,
  after: Cb
) {
  walk(n, (type: string, path: NodePath<Node>) => {
    if (typeof visitors[type] === "function") {
      before(type, path);
      visitors[type](path);
      after(type, path);
    }
  });
}
