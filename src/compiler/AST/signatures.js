// @flow

type NewSignatureMap = [Array<Valtype>, Array<Valtype>];

function sign(input: Array<Valtype>, output: Array<Valtype>): NewSignatureMap {
  return [input, output];
}

const u32 = "u32";
const i32 = "i32";
const i64 = "i64";
const f32 = "f32";
const f64 = "f64";

const controlInstructions = {
  unreachable: sign([], []),
  nop: sign([], []),
  // block ?
  // loop ?
  // if ?
  // if else ?
  br: sign([u32], []),
  br_if: sign([u32], []),
  // br_table: [], (vector representation ?)
  return: sign([], []),
  call: sign([u32], []),
  call_indirect: sign([u32], [])
};

const parametricInstructions = {
  drop: sign([], []),
  select: sign([], [])
};

const variableInstructions = {
  get_local: sign([u32], []),
  set_local: sign([u32], []),
  tee_local: sign([u32], []),
  get_global: sign([u32], []),
  set_global: sign([u32], [])
};

const memoryInstructions = {
  "i32.load": sign([u32, u32], [i32]),
  "i64.load": sign([u32, u32], []),
  "f32.load": sign([u32, u32], []),
  "f64.load": sign([u32, u32], []),
  "i32.load8_s": sign([u32, u32], [i32]),
  "i32.load8_u": sign([u32, u32], [i32]),
  "i32.load16_s": sign([u32, u32], [i32]),
  "i32.load16_u": sign([u32, u32], [i32]),
  "i64.load8_s": sign([u32, u32], [i64]),
  "i64.load8_u": sign([u32, u32], [i64]),
  "i64.load16_s": sign([u32, u32], [i64]),
  "i64.load16_u": sign([u32, u32], [i64]),
  "i64.load32_s": sign([u32, u32], [i64]),
  "i64.load32_u": sign([u32, u32], [i64]),
  "i32.store": sign([u32, u32], []),
  "i64.store": sign([u32, u32], []),
  "f32.store": sign([u32, u32], []),
  "f64.store": sign([u32, u32], []),
  "i32.store8": sign([u32, u32], []),
  "i32.store16": sign([u32, u32], []),
  "i64.store8": sign([u32, u32], []),
  "i64.store16": sign([u32, u32], []),
  "i64.store32": sign([u32, u32], []),
  current_memory: sign([], []),
  grow_memory: sign([], [])
};

const numericInstructions = {
  "i32.const": sign([i32], [i32]),
  "i64.const": sign([i64], [i64]),
  "f32.const": sign([f32], [f32]),
  "f64.const": sign([f64], [f64]),

  "i32.eqz": sign([], []),
  "i32.eq": sign([], []),
  "i32.ne": sign([], []),
  "i32.lt_s": sign([], []),
  "i32.lt_u": sign([], []),
  "i32.gt_s": sign([], []),
  "i32.gt_u": sign([], []),
  "i32.le_s": sign([], []),
  "i32.le_u": sign([], []),
  "i32.ge_s": sign([], []),
  "i32.ge_u": sign([], []),

  "i64.eqz": sign([], []),
  "i64.eq": sign([], []),
  "i64.ne": sign([], []),
  "i64.lt_s": sign([], []),
  "i64.lt_u": sign([], []),
  "i64.gt_s": sign([], []),
  "i64.gt_u": sign([], []),
  "i64.le_s": sign([], []),
  "i64.le_u": sign([], []),
  "i64.ge_s": sign([], []),
  "i64.ge_u": sign([], []),

  "f32.eq": sign([], []),
  "f32.ne": sign([], []),
  "f32.lt": sign([], []),
  "f32.gt": sign([f32, f32], [i32]),
  "f32.le": sign([], []),
  "f32.ge": sign([], []),

  "f64.eq": sign([], []),
  "f64.ne": sign([], []),
  "f64.lt": sign([], []),
  "f64.gt": sign([], []),
  "f64.le": sign([], []),
  "f64.ge": sign([], []),

  "i32.clz": sign([], []),
  "i32.ctz": sign([], []),
  "i32.popcnt": sign([], []),
  "i32.add": sign([], [i32]),
  "i32.sub": sign([], []),
  "i32.mul": sign([], []),
  "i32.div_s": sign([], [i32]),
  "i32.div_u": sign([], [i32]),
  "i32.rem_s": sign([], [i32]),
  "i32.rem_u": sign([], [i32]),
  "i32.and": sign([], []),
  "i32.or": sign([], []),
  "i32.xor": sign([], []),
  "i32.shl": sign([], []),
  "i32.shr_s": sign([], []),
  "i32.shr_u": sign([], []),
  "i32.rotl": sign([], []),
  "i32.rotr": sign([], []),

  "i64.clz": sign([], []),
  "i64.ctz": sign([], []),
  "i64.popcnt": sign([], []),
  "i64.add": sign([], [i64]),
  "i64.sub": sign([], []),
  "i64.mul": sign([], []),
  "i64.div_s": sign([], []),
  "i64.div_u": sign([], []),
  "i64.rem_s": sign([], []),
  "i64.rem_u": sign([], []),
  "i64.and": sign([], []),
  "i64.or": sign([], []),
  "i64.xor": sign([], []),
  "i64.shl": sign([], []),
  "i64.shr_s": sign([], []),
  "i64.shr_u": sign([], []),
  "i64.rotl": sign([], []),
  "i64.rotr": sign([], []),

  "f32.abs": sign([f32], [f32]),
  "f32.neg": sign([f32], [f32]),
  "f32.ceil": sign([], []),
  "f32.floor": sign([], []),
  "f32.trunc": sign([], []),
  "f32.nearest": sign([], []),
  "f32.sqrt": sign([], []),
  "f32.add": sign([], []),
  "f32.sub": sign([], []),
  "f32.mul": sign([], []),
  "f32.div": sign([], [f32]),
  "f32.min": sign([], []),
  "f32.max": sign([], []),
  "f32.copysign": sign([], []),

  "f64.abs": sign([], []),
  "f64.neg": sign([], []),
  "f64.ceil": sign([], []),
  "f64.floor": sign([], []),
  "f64.trunc": sign([], []),
  "f64.nearest": sign([], []),
  "f64.sqrt": sign([], []),
  "f64.add": sign([], []),
  "f64.sub": sign([], []),
  "f64.mul": sign([], []),
  "f64.div": sign([], [f64]),
  "f64.min": sign([], []),
  "f64.max": sign([], []),
  "f64.copysign": sign([], []),

  "i32.wrap/i64": sign([], []),
  "i32.trunc_s/f32": sign([], []),
  "i32.trunc_u/f32": sign([], []),
  "i32.trunc_s/f64": sign([], []),
  "i32.trunc_u/f64": sign([], []),
  "i64.extend_s/i32": sign([], []),
  "i64.extend_u/i32": sign([], []),
  "i64.trunc_s/f32": sign([], []),
  "i64.trunc_u/f32": sign([], []),
  "i64.trunc_s/f64": sign([], []),
  "i64.trunc_u/f64": sign([], []),
  "f32.convert_s/i32": sign([], []),
  "f32.convert_u/i32": sign([], []),
  "f32.convert_s/i64": sign([], []),
  "f32.convert_u/i64": sign([], []),
  "f32.demote/f64": sign([], []),
  "f64.convert_s/i32": sign([], []),
  "f64.convert_u/i32": sign([], []),
  "f64.convert_s/i64": sign([], []),
  "f64.convert_u/i64": sign([], []),
  "f64.promote/f32": sign([], []),
  "i32.reinterpret/f32": sign([f32], [i32]),
  "i64.reinterpret/f64": sign([f64], [i64]),
  "f32.reinterpret/i32": sign([i32], [f32]),
  "f64.reinterpret/i64": sign([i64], [f64])
};

export const signatures = Object.assign(
  {},
  controlInstructions,
  parametricInstructions,
  variableInstructions,
  memoryInstructions,
  numericInstructions
);
