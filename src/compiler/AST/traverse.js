// @flow

function cloneNode(o: Node): Node {
  let v, key;
  const output = Array.isArray(o) ? [] : {};
  for (key in o) {
    // $FlowIgnore
    v = o[key];
    // $FlowIgnore
    output[key] = (typeof v === 'object') ? cloneNode(v) : v;
  }
  // $FlowIgnore
  return output;
}

function createPath(node: Node): NodePath<Node> {

  return {
    node: cloneNode(node),
  };
}

export function walk(
  n: Node,
  cb: (type: string, path: NodePath<Node>) => void,
) {
  if (n.type === 'Program') {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.body.forEach((x) => walk(x, cb));
  }

  if (n.type === 'Module') {
    cb(n.type, createPath(n));

    if (typeof n.fields !== 'undefined') {
      // $FlowIgnore
      n.fields.forEach((x) => walk(x, cb));
    }
  }

  if (n.type === 'ModuleExport') {
    cb(n.type, createPath(n));
  }

  if (n.type === 'ModuleImport') {
    cb(n.type, createPath(n));
    cb(n.descr.type, createPath(n.descr));
  }

  if (n.type === 'Global') {
    cb(n.type, createPath(n));
  }

  if (n.type === 'Func') {
    cb(n.type, createPath(n));

    // $FlowIgnore
    n.body.forEach((x) => walk(x, cb));
  }
}

export function traverse(n: Node, visitor: Object) {

  walk(n, (type: string, path: NodePath<Node>) => {

    if (typeof visitor[type] === 'function') {
      visitor[type](path);
    }
  });
}
