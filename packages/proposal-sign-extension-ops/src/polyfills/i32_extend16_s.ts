/**
 * Polyfill for i32_extend16_s instruction
 */
export function i32_extend16_s(x: i32): i32 {
	return (x & 0x00008000) ? (x | 0xffff8000) : (x & 0x00007fff);
}
