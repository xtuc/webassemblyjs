type numberLiteral = {value: float};

/* not sure if nativeint represents  long closely enough */
type longNumberLiteral = {value: nativeint};

type u32Literal = numberLiteral;

type sectionName =
  | Custom
  | Type
  | Import
  | Function
  | Table
  | Memory
  | Global
  | Export
  | Start
  | Element
  | Code
  | Data;

type expression =
  | Identifier
  | NumericLiteral
  | ValtypeLiteral
  | Instruction
  | StringLiteral;

type instruction =
  | LoopInstruction
  | BlockInstruction
  | IfInstruction
  | CallInstruction
  | CallIndirectInstruction
  | GenericInstruction
  | ObjectInstruction;

type numericLiteral =
  | FloatLiteral
  | NumberLiteral
  | LongNumberLiteral;

type floatLiteral = {
  value: float,
  nan: bool,
  inf: bool
};

type literal =
  | NumberLiteral
  | FloatLiteral(floatLiteral);

type typeIdx = u32Literal;

type funcidx = u32Literal;

type tableidx = u32Literal;

type memidx = u32Literal;

type globalidx = u32Literal;

type localidx = u32Literal;

type labelidx = u32Literal;

type moduleType =
  | Module
  | BinaryModule
  | QuoteModule;

type index;

type valType =
  | I32
  | I64
  | F32
  | F64
  | U32
  | Label;

type funcParam = {
  id: option(string),
  valtype: valType
};

type funcType = {
  params: array(funcParam),
  result: array(valType)
};

type typeInstruction = {
  id: option(index),
  functype: funcType
};

type elem = {
  table: index,
  offset: array(instruction),
  funcs: array(index)
};
