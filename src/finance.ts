import { Position } from '../shared/types';
export function money(n: number | null, currency = 'USD') {
  if (n === null || !Number.isFinite(n)) return '—';
  if (!/^[A-Z]{3}$/.test(currency))
    return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}
export const percent = (n: number | null) =>
  n === null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
export const total = (positions: Position[]) =>
  positions.filter((p) => p.currency === 'USD').reduce((n, p) => n + (p.value ?? 0), 0);
export function ordered(positions: Position[], favorites: string[], filter: string, search = '') {
  return positions
    .filter(
      (p) =>
        (filter === 'All assets' || p.assetClass === filter) &&
        (p.symbol + ' ' + p.name).toLowerCase().includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(favorites.includes(b.id)) -
        Number(favorites.includes(a.id)) +
        (favorites.includes(a.id) === favorites.includes(b.id)
          ? (b.value ?? -Infinity) - (a.value ?? -Infinity)
          : 0),
    );
}
export function allocation(positions: Position[]) {
  const groups = new Map<string, { name: string; value: number; color: string }>();
  for (const p of positions)
    if (p.currency === 'USD' && p.value !== null && p.value > 0) {
      const a = groups.get(p.assetClass) || { name: p.assetClass, value: 0, color: p.color };
      a.value += p.value;
      groups.set(p.assetClass, a);
    }
  return [...groups.values()].sort((a, b) => b.value - a.value);
}
