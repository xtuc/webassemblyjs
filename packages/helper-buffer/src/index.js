// @flow

const debug = require("debug")("wasm");

function concatUint8Arrays(...arrays: Array<Uint8Array>) {
  const totalLength = arrays.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    if (arr instanceof Uint8Array === false) {
      throw new Error("arr must be of type Uint8Array");
    }

    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

export function overrideBytesInBuffer(
  buffer: Uint8Array,
  startLoc: number,
  endLoc: number,
  newBytes: Array<Byte>
): Uint8Array {
  const beforeBytes = buffer.slice(0, startLoc);
  const afterBytes = buffer.slice(endLoc, buffer.length);

  debug(
    "overrideBytesInBuffer start=%d end=%d newBytes=%s",
    startLoc,
    endLoc,
    // $FlowIgnore
    newBytes.map(dec => dec.toString("16")).join()
  );

  // replacement is empty, we can omit it
  if (newBytes.length === 0) {
    return concatUint8Arrays(beforeBytes, afterBytes);
  }

  const replacement = Uint8Array.from(newBytes);

  return concatUint8Arrays(beforeBytes, replacement, afterBytes);
}

export function makeBuffer(...splitedBytes: Array<Array<Byte>>) {
  const bytes = [].concat.apply([], splitedBytes);
  return new Uint8Array(bytes).buffer;
}

export function fromHexdump(str: string): Buffer {
  let lines = str.split("\n");

  // remove any leading left whitespace
  lines = lines.map(line => line.trim());

  const bytes = lines.reduce((acc, line) => {
    let cols = line.split(" ");

    // remove the offset, left column
    cols.shift();

    cols = cols.filter(x => x !== "");

    const bytes = cols.map(x => parseInt(x, 16));

    acc.push(...bytes);

    return acc;
  }, []);

  return Buffer.from(bytes);
}
