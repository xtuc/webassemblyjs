/**
 * Polyfill for i64_extend8_s instruction
 */
export function i64_extend8_s(x : i64) : i64 {
	return (x & <i64>0x0000000000000080) ? (x | <i64>0xffffffffffffff80) : (x & <i64>0x000000000000007f);
}
