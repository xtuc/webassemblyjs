# Sign extension proposal

<https://github.com/WebAssembly/sign-extension-ops>

```c
#include "stdint.h"

int32_t i32_extend8_s(int32_t x) {
  return (x & 0x00000080) ? (x | 0xffffff80) : (x & 0x0000007f);
}

int32_t i32_extend16_s(int32_t x) {
  return (x & 0x00008000) ? (x | 0xffff8000) : (x & 0x00007fff);
}

int64_t i64_extend8_s(int64_t x) {
  return (x & 0x0000000000000080) ? (x | 0xffffffffffffff80) : (x & 0x000000000000007f);
}

int64_t i64_extend16_s(int64_t x) {
  return (x & 0x0000000000008000) ? (x | 0xffffffffffff8000) : (x & 0x0000000000007fff);
}

int64_t i64_extend32_s(int64_t x) {
  return (x & 0x0000000080000000) ? (x | 0xffffffff80000000) : (x & 0x000000007fffffff);
}
```
