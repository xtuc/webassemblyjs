// @flow
/* eslint no-unused-vars: off */

type Byte = Number;

type SectionName =
  | "custom"
  | "type"
  | "import"
  | "func"
  | "table"
  | "memory"
  | "global"
  | "export"
  | "start"
  | "element"
  | "code"
  | "data";

type U32Literal = NumberLiteral;
type Typeidx = U32Literal;
type Funcidx = U32Literal;
type Tableidx = U32Literal;
type Memidx = U32Literal;
type Globalidx = U32Literal;
type Localidx = U32Literal;
type Labelidx = U32Literal;

type Index =
  | Typeidx
  | Funcidx
  | Tableidx
  | Memidx
  | Globalidx
  | Localidx
  | Labelidx
  | Identifier; // WAST shorthand

type SignatureOrTypeRef = Index | Signature;

type Valtype = "i32" | "i64" | "f32" | "f64" | "u32" | "label";

type Mutability = "const" | "var";

type NodePath<T> = {
  node: T,
  parentPath: ?NodePath<Node>,
  findParent: (NodePath<Node>) => ?boolean,
  replaceWith: (Node) => void,
  remove: () => void,
};

type TableElementType = "anyfunc";

type LongNumber = {
  high: number,
  low: number,
};

type Position = {
  line: number,
  column: number,
};

type SourceLocation = {
  start: Position,
  end?: Position,
};

type FuncParam = {
  id: ?string,
  valtype: Valtype,
};

type BaseNode = {
  type: string,
  loc?: ?SourceLocation,

  // Internal property
  _deleted?: ?boolean,
};

type FuncMetadata = {
  bodySize: number,
};

type ExportDescrType = "Func" | "Table" | "Memory" | "Global";
