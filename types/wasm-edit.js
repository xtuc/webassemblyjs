// @flow

type AddOperation = {
  kind: "add",
  node: Node
};

type DeleteOperation = {
  kind: "delete",
  node: Node
};

type UpdateOperation = {
  kind: "update",
  node: Node,
  oldNode: Node
};

type Operation = AddOperation | DeleteOperation | UpdateOperation;
