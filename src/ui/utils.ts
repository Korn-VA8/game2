/**
 * Shared UI utilities for Spin Merge
 * Extracted to avoid duplication across UI screens.
 */

/** Format large numbers compactly: 1000→1.0k, 15000→15k, 1500000→1.5M */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000) return Math.floor(n / 1_000) + 'k';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return `${n}`;
}
