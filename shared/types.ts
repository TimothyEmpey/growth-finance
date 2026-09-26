export type AssetClass = 'Stocks' | 'ETFs' | 'Crypto' | 'Bonds' | 'Cash' | 'Other';
export type Position = {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  units: number;
  price: number | null;
  value: number | null;
  cost: number | null;
  change: number | null;
  color: string;
  accounts: string[];
  asOf?: string;
};
export type Article = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url?: string;
  symbols: string[];
  category: string;
  summary: string;
};
export type Portfolio = {
  positions: Position[];
  accounts: { id: string; name: string; institution: string }[];
  history: { date: string; value: number }[];
  favorites: string[];
  syncedAt: string | null;
  warnings: string[];
};
