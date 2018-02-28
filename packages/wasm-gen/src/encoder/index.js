// @flow

export function encodeVersion(v: number): Array<Byte> {
  return [v, 0x00, 0x00, 0x00];
}

export function encodeHeader(): Array<Byte> {
  return [0x00, 0x61, 0x73, 0x6d];
}

export function encodeVec(elements: Array<Byte>): Array<Byte> {
  const size = elements.length;
  return [size, ...elements];
}

export function encodeValtype(v: Valtype): Byte {
  if (v === "i32") return 0x7f;
  if (v === "i64") return 0x7e;
}

export function encodeMutability(v: Mutability): Byte {
  if (v === "const") return 0x00;
  if (v === "var") return 0x01;
}

export function encodeUTF8Vec(str: string): Array<Byte> {
  const charCodes = str.split("").map(x => x.charCodeAt(0));

  return encodeVec(charCodes);
}

export function encodeModuleImport(n: ModuleImport): Array<Byte> {
  const out = [];

  out.push(...encodeUTF8Vec(n.module));
  out.push(...encodeUTF8Vec(n.name));

  if (n.descr.type === "GlobalType") {
    out.push(0x03);
    out.push(encodeValtype(n.descr.valtype));
    out.push(encodeMutability(n.descr.mutability));
  } else {
    throw new Error(
      "Unsupport operation: encode module import of type: " + n.descr.type
    );
  }

  return out;
}
