export function buildPageItems(current: number, last: number): Array<number | '...'> {
  if (!Number.isFinite(current) || !Number.isFinite(last) || last <= 1) return [1];

  const clampedCurrent = Math.min(Math.max(1, current), last);
  const pages = new Set<number>();

  pages.add(1);
  pages.add(last);
  for (let p = clampedCurrent - 2; p <= clampedCurrent + 2; p++) {
    if (p >= 1 && p <= last) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | '...'> = [];

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    const prev = sorted[i - 1];
    if (prev != null && p - prev > 1) items.push('...');
    items.push(p);
  }

  return items;
}
