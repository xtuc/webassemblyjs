#include <webassembly.h>
#include "stdint.h"

export int32_t i32_extend16_s(int32_t x) {
  return (x & 0x00008000) ? (x | 0xffff8000) : (x & 0x00007fff);
}

