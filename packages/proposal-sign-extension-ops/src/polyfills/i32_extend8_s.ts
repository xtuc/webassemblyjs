/**
 * Polyfill for i32_extend8_s instruction
 */
export function i32_extend8_s(x: i32): i32 {
	return (x & 0x00000080) ? (x | 0xffffff80) : (x & 0x0000007f);
}
