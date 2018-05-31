/**
 * Polyfill for i64_extend16_s instruction
 */
export function i64_extend16_s(x : i64) : i64 {
	return (x & <i64>0x0000000000008000) ? (x | <i64>0xffffffffffff8000) : (x & <i64>0x0000000000007fff);
}
