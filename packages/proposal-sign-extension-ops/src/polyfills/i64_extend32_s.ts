/**
 * Polyfill for i64_extend32_s instruction
 */
export function i64_extend32_s(x : i64) : i64 {
	return (x & <i64>0x0000000080000000) ? (x | <i64>0xffffffff80000000) : (x & <i64>0x000000007fffffff);
}
