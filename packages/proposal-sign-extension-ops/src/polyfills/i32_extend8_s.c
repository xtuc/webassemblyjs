#include <webassembly.h>
#include "stdint.h"

export int32_t i32_extend8_s(int32_t x) {
  return (x & 0x00000080) ? (x | 0xffffff80) : (x & 0x0000007f);
}

