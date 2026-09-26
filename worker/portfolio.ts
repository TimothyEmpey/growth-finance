import { Portfolio, Position, AssetClass } from '../shared/types';
export async function readPortfolio(db: D1Database, userId: string): Promise<Portfolio> {
  const accounts = (
    await db
      .prepare('SELECT id,name,institution,synced_at FROM brokerage_accounts WHERE user_id=?')
      .bind(userId)
      .all<{ id: string; name: string; institution: string; synced_at: string }>()
  ).results;
  const rows = (
    await db
      .prepare('SELECT * FROM holdings WHERE user_id=?')
      .bind(userId)
      .all<Record<string, any>>()
  ).results;
  const balances = (
    await db
      .prepare('SELECT * FROM cash_balances WHERE user_id=?')
      .bind(userId)
      .all<Record<string, any>>()
  ).results;
  const favorites = (
    await db
      .prepare('SELECT instrument_id FROM favorites WHERE user_id=?')
      .bind(userId)
      .all<{ instrument_id: string }>()
  ).results.map((x) => x.instrument_id);
  const history = (
    await db
      .prepare(
        "SELECT day AS date,value FROM portfolio_snapshots WHERE user_id=? AND currency='USD' ORDER BY day",
      )
      .bind(userId)
      .all<{ date: string; value: string }>()
  ).results.map((h) => ({ ...h, value: Number(h.value) }));
  const positions = new Map<string, Position>();
  const warnings = new Set<string>();
  const colors: Record<string, string> = {
    Stocks: '#b5e853',
    ETFs: '#f78e9d',
    Crypto: '#ffb45e',
    Bonds: '#66c9b3',
    Cash: '#97a59a',
    Other: '#b4a0f5',
  };
  for (const r of rows) {
    if (r.cash_equivalent) continue; // Already included in cash balances by SnapTrade.
    const id = r.instrument_id;
    const units = r.units === null ? null : Number(r.units);
    const price = r.price === null ? null : Number(r.price);
    const multiplier =
      r.multiplier === null || !Number.isFinite(Number(r.multiplier)) ? null : Number(r.multiplier);
    const value =
      units !== null && price !== null && multiplier !== null ? units * price * multiplier : null;
    const cost =
      r.cost_basis !== null && units !== null && multiplier !== null
        ? Number(r.cost_basis) * units * multiplier
        : null;
    if (value === null)
      warnings.add('Some holdings cannot be valued yet and are excluded from totals.');
    if (r.currency !== 'USD')
      warnings.add(
        'USD totals exclude non-USD holdings. Foreign-currency values remain visible per position.',
      );
    const a = accounts.find((a) => a.id === r.account_id)?.institution || 'Brokerage';
    const existing = positions.get(id);
    if (existing) {
      existing.units += units ?? 0;
      existing.value = existing.value === null || value === null ? null : existing.value + value;
      existing.cost = existing.cost === null || cost === null ? null : existing.cost + cost;
      if (!existing.accounts.includes(a)) existing.accounts.push(a);
    } else
      positions.set(id, {
        id,
        symbol: r.symbol,
        name: r.name,
        assetClass: r.asset_class as AssetClass,
        currency: r.currency,
        units: units ?? 0,
        price,
        value,
        cost,
        change: null,
        color: colors[r.asset_class] || colors.Other,
        accounts: [a],
        asOf: r.as_of,
      });
  }
  for (const b of balances) {
    const id = `cash-${b.currency}`;
    const amount = Number(b.amount);
    const a = accounts.find((a) => a.id === b.account_id)?.institution || 'Brokerage';
    const p = positions.get(id);
    if (p) {
      p.units += amount;
      p.value! += amount;
      p.cost! += amount;
      if (!p.accounts.includes(a)) p.accounts.push(a);
    } else
      positions.set(id, {
        id,
        symbol: b.currency,
        name: 'Cash & equivalents',
        assetClass: 'Cash',
        currency: b.currency,
        units: amount,
        price: 1,
        value: amount,
        cost: amount,
        change: null,
        color: colors.Cash,
        accounts: [a],
      });
    if (b.currency !== 'USD')
      warnings.add(
        'USD totals exclude non-USD holdings. Foreign-currency values remain visible per position.',
      );
  }
  return {
    positions: [...positions.values()],
    accounts,
    history,
    favorites,
    syncedAt: accounts.map((a) => a.synced_at).sort()[0] || null,
    warnings: [...warnings],
  };
}
