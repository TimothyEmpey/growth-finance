PRAGMA foreign_keys = ON;
CREATE TABLE users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 salt TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE preferences (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 theme TEXT NOT NULL DEFAULT 'system' CHECK(theme IN ('system','dark','light')),
 base_currency TEXT NOT NULL DEFAULT 'USD'
);
CREATE TABLE snaptrade_users (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 provider_user_id TEXT NOT NULL UNIQUE, encrypted_secret TEXT NOT NULL
);
CREATE TABLE brokerage_accounts (
 id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 name TEXT NOT NULL, institution TEXT NOT NULL, currency TEXT NOT NULL,
 synced_at TEXT NOT NULL, PRIMARY KEY(user_id,id)
);
CREATE TABLE holdings (
 user_id TEXT NOT NULL, account_id TEXT NOT NULL, instrument_id TEXT NOT NULL,
 symbol TEXT NOT NULL, name TEXT NOT NULL, asset_class TEXT NOT NULL,
 currency TEXT NOT NULL, units TEXT, price TEXT, cost_basis TEXT, multiplier TEXT NOT NULL DEFAULT '1',
 cash_equivalent INTEGER NOT NULL DEFAULT 0, as_of TEXT,
 PRIMARY KEY(user_id,account_id,instrument_id),
 FOREIGN KEY(user_id,account_id) REFERENCES brokerage_accounts(user_id,id) ON DELETE CASCADE
);
CREATE TABLE cash_balances (
 user_id TEXT NOT NULL, account_id TEXT NOT NULL, currency TEXT NOT NULL, amount TEXT NOT NULL,
 PRIMARY KEY(user_id,account_id,currency),
 FOREIGN KEY(user_id,account_id) REFERENCES brokerage_accounts(user_id,id) ON DELETE CASCADE
);
CREATE TABLE portfolio_snapshots (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, day TEXT NOT NULL,
 currency TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(user_id,day,currency)
);
CREATE TABLE favorites (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, instrument_id TEXT NOT NULL,
 PRIMARY KEY(user_id,instrument_id)
);
CREATE TABLE journal_entries (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 instrument_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX journal_owner ON journal_entries(user_id,instrument_id);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL);
CREATE TABLE news_cache (symbol TEXT PRIMARY KEY, payload TEXT NOT NULL, expires_at INTEGER NOT NULL);
