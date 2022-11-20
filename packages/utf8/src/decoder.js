function con(b) {
  if ((b & 0xc0) === 0x80) {
    return b & 0x3f;
  } else {
    throw new Error("invalid UTF-8 encoding");
  }
}

function code(min, n) {
  if (n < min || (0xd800 <= n && n < 0xe000) || n >= 0x10000) {
    throw new Error("invalid UTF-8 encoding");
  } else {
    return n;
  }
}

export function decode(bytes) {
  return _decode(bytes)
    .map((x) => String.fromCharCode(x))
    .join("");
}

function _decode(bytes) {
  let remainingBytes = bytes;
  const acc = [];

  while (remainingBytes.length > 0) {
    /**
     * 1 byte
     */
    {
      const [b1, ...bs] = remainingBytes;

      if (b1 < 0x80) {
        acc.push(code(0x0, b1));
        remainingBytes = bs;
        continue;
      }

      if (b1 < 0xc0) {
        throw new Error("invalid UTF-8 encoding");
      }
    }

    /**
     * 2 bytes
     */
    {
      const [b1, b2, ...bs] = remainingBytes;

      if (b1 < 0xe0) {
        acc.push(code(0x80, ((b1 & 0x1f) << 6) + con(b2)));
        remainingBytes = bs;
        continue;
      }
    }

    /**
     * 3 bytes
     */
    {
      const [b1, b2, b3, ...bs] = remainingBytes;

      if (b1 < 0xf0) {
        acc.push(code(0x800, ((b1 & 0x0f) << 12) + (con(b2) << 6) + con(b3)));
        remainingBytes = bs;
        continue;
      }
    }

    /**
     * 4 bytes
     */
    {
      const [b1, b2, b3, b4, ...bs] = remainingBytes;

      if (b1 < 0xf8) {
        acc.push(code(
          0x10000,
          ((((b1 & 0x07) << 18) + con(b2)) << 12) + (con(b3) << 6) + con(b4)
        ));
        remainingBytes = bs;
        continue;
      }
    }

    throw new Error("invalid UTF-8 encoding");
  }

  return acc;
}
