// @flow
/* eslint-disable */

interface Node {
  type: string;
}

interface Identifier {
  type: 'Identifier';
  name: string;
}

interface Intruction {
  // TODO(sven): ?
}

// TODO(sven): modulefields (https://webassembly.github.io/spec/text/modules.html#text-modulefield)
type ModuleFields = any

interface Module {
  type: 'Module';
  id: ?string;
  fields: ?ModuleFields;
}

interface Program {
  type: 'Program';
  body: [ Intruction | ModuleDeclaration ];
}

// TODO(sven): define types
type Type = any;
type Valtype = any;

type FuncParam = {
  id: ?string,
  valtype: Valtype,
};

interface Func {
  type: 'Func';
  id: ?string;
  params: Array<FuncParam>;
  result: ?Type;
  body: Array<Intruction>;
}
