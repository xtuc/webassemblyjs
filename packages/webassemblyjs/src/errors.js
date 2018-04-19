// @flow

export class RuntimeError extends Error {
  _appstack: Array<StackFrame>;
}

export class CompileError extends Error {}
export class LinkError extends Error {}
