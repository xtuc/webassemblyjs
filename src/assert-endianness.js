// @flow

const buff = new ArrayBuffer(16);

export function checkEndianness(): boolean {
  const viewInt16 = new Int16Array(buff);
  const viewInt8 = new Int8Array(buff);

  viewInt16[0] = 0x6373;

  return viewInt8[0] === 0x73 && viewInt8[1] === 0x63;
}
