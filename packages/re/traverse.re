type numberLiteral = {value: float}
and floatLiteral = {value: float}
and program = {body: list(node)}
and identifier = {value: string}
and func = {
  body: list(node),
  name: option(identifier)
}
and node =
  | Identifier(identifier)
  | Deleted
  | Program(program)
  | Func(func)
and rootNode = {node: ref(node)}
and path = {
  node: ref(node),
  parentPath: nodePath
}
and nodePath =
  | Root(rootNode)
  | Path(path)
and visitorFn = node => option(node);

let removeNodeInBody = (n: node, parentNode: node) : node =>
  switch parentNode {
  | Program({body}) => Program({body: List.filter(bn => bn == n, body)})
  | _ => parentNode
  };

let replaceNodeInBody = (n: node, newNode: node, parentNode: node) : node =>
  switch parentNode {
  | Program({body}) =>
    let b =
      List.fold_left(
        (acc, bodyNode) =>
          if (bodyNode == n) {
            [newNode, ...acc];
          } else {
            [bodyNode, ...acc];
          },
        [],
        body
      );
    Program({body: b});
  | _ => n
  };

module NodePath = {
  exception NoParent;
  let getNode = nodePath =>
    switch nodePath {
    | Root({node}) => node^
    | Path({node}) => node^
    };
  let assignNode = (nodePath, newNode) =>
    switch nodePath {
    | Root(np) => np.node := newNode
    | Path(np) => np.node := newNode
    };
  let updateNodeInBody = (nodePath: nodePath, newNode: node) : nodePath => {
    /* node (target to remove), parentNode (containing target) */
    let node = getNode(nodePath);
    let parentNode =
      switch nodePath {
      | Root(_) => raise(NoParent)
      | Path({parentPath}) => getNode(parentPath)
      };
    replaceNodeInBody(node, newNode, parentNode) |> assignNode(nodePath);
    nodePath;
  };
  let removeNodeInBody = (nodePath: nodePath) =>
    updateNodeInBody(nodePath, Deleted);
  let makePath = (node: node, parentPath: nodePath) =>
    Path({node: ref(node), parentPath});
  let makeRootPath = (node: node) => Root({node: ref(node)});
};

type traverseCb = nodePath => unit;

let rec walk = (node: node, cb: traverseCb, parentPath: nodePath) : unit => {
  let walkBody = (body, path) =>
    List.iter(bodyNode => walk(bodyNode, cb, path), body);
  NodePath.(
    switch node {
    | Deleted => ()
    | Program({body}) =>
      let path = makePath(node, parentPath);
      cb(path);
      walkBody(body, path);
    | Func({body, name}) =>
      let path = makePath(node, parentPath);
      cb(path);
      walkBody(body, path);
      switch name {
      | Some(n) => walk(Identifier(n), cb, path)
      | None => ()
      };
    | Identifier(_) =>
      let path = makePath(node, parentPath);
      cb(path);
    }
  );
};

let traverse = (node: node, visitor: nodePath => unit) : unit =>
  walk(node, visitor, NodePath.makeRootPath(node));

let startNode =
  Program({
    body: [
      Func
        /* meh */
        ({body: [], name: Some({value: "foo"})})
    ]
  });

let cb = nodePath => {
  open NodePath;
  let node = getNode(nodePath);
  let parentNode =
    switch nodePath {
    | Path({parentPath}) => Some(getNode(parentPath))
    | _ => None
    };
  switch node {
  | Identifier({value}) =>
    switch parentNode {
    | Some(v) =>
      switch v {
      | Func(_) => Js.log("Hey Func")
      | _ => ()
      }
    | None => ()
    };
    Js.log(value);
  | _ => ()
  };
};

let _ = traverse(startNode, cb);
