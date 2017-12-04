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
