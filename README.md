# Growth Finance

A standalone personal portfolio journal for web and iOS. Expo Router app + a Cloudflare Worker and dedicated D1 database. It opens with labeled illustrative data so you can explore before supplying credentials.

## Start here

Open `Growth Finance.code-workspace` in a new VS Code window. This workspace contains only this directory. It has no imports, symlinks, or dependencies on your other projects. A VS Code workspace is **not an OS security sandbox**; hard filesystem isolation requires a separate OS user or container. The mobile/web app itself does not request filesystem access.

```sh
npm install
npm run setup
npm run build:web
npm run db:local
npm run api:dev
# A second terminal:
npm start
```

Open the web app or scan Expo's QR code in Expo Go. For an iPhone, use a reachable backend address (Mac LAN IP or deployed HTTPS URL), not `localhost`. To allow LAN testing, start the backend with `DEV_API_HOST=0.0.0.0 npm run api:dev`. Local Expo web runs at port 8081; the API at 8787. `npm run web` starts the browser target. The local API uses Cloudflare Miniflare and a project-only resolver; restart it after backend changes. It initializes a new database automatically.

## Credentials later

`npm run setup` asks for keys using hidden prompts, retains existing keys when skipped, generates a stable AES-256 key, and asks for optional account and domain configuration. It writes only ignored project-local files. Never put secrets in variables starting with `EXPO_PUBLIC_`.

- **SnapTrade commercial account**: Client ID + Consumer Key. Commercial mode is required because this app creates a distinct provider identity for every application user. A SnapTrade Personal key is not interchangeable. The hosted portal lists the institutions available to your plan. All portal requests explicitly force `connectionType: read`.
- **Finnhub**: separate optional API key for company and general/crypto headlines. SnapTrade is a brokerage aggregation service, not the news provider. News coverage/usage rights depend on your provider plan.
- **Cloudflare**: a new account ID and an API token scoped to that account with Workers and D1 permissions. Password authentication is not used. Project commands refuse remote work until these explicit credentials are present; they don't rely on an existing global login.
- **Domain**: enter your future HTTPS origin during setup. Only enable the custom domain route once the domain exists in that Cloudflare account. A workers.dev origin works without a purchased domain.

Deployment is intentionally not performed during initial build. When ready:

```sh
npm run cloudflare -- d1 create growth-finance
npm run setup # enter returned database ID and deployed API/web origin
npm run cloudflare -- d1 migrations apply growth-finance --remote
npm run secrets:push
npm run deploy
```

Use a dedicated Cloudflare account token. The wrapper checks its account ID against configuration and clears legacy email/key auth. If deploying only for yourself, set `ALLOW_SIGNUP` to `false` after creating your account. Keep the encryption key backed up securely: rotating it without re-encrypting saved SnapTrade secrets prevents reconnection.

## Features

- Portfolio chart, favorites-first positions, search, asset filters, price/value/return metrics, position modal, journal notes and related news.
- Hot Topics with company/asset-class headlines, scrolling terminal ticker, and category filters.
- Breakdown with allocation donut, position weights, concentration and connected accounts.
- Account creation/sign-in, native secure token storage, HTTP-only browser session cookies, theme preferences, and read-only connection portal.
- Privacy policy and support are intentionally blank placeholders.

## Data and security

All authenticated database access is scoped to the session's user ID; client-supplied user IDs are never trusted. Passwords use salted PBKDF2-SHA256, sessions are stored as SHA-256 hashes, and SnapTrade user secrets use AES-GCM with user-bound authenticated data. Authentication, sync, portal and news routes have database-backed rate limits. Exact-origin CORS protects cookie-authenticated requests. Browser sessions stay in cookies; iOS sessions use SecureStore.

Tables: users, sessions, preferences, snaptrade_users, brokerage_accounts, holdings, cash_balances, portfolio_snapshots, favorites, journal_entries, news_cache, rate_limits. Provider cash equivalents are excluded from position totals to avoid counting them twice. Re-sync replaces only that user's holdings in an atomic batch after all provider calls succeed.

Live prices are brokerage-supplied and may be delayed. Portfolio charts show **value change**, not time-weighted investment performance; deposits and withdrawals affect them. Historical points accumulate when you sync on different days. Missing valuations and foreign currencies are visible and explicitly excluded from USD totals; snapshots are withheld when valuation is incomplete. Bonds, options, futures, and other complex instruments remain visible but need a dedicated valuation adapter before inclusion in totals. Equity, fund, and crypto values are supported. No FX conversion or synthetic historic returns are fabricated.

This is a working development foundation, not a public-launch-ready financial service. Before public launch: add verified-email and password-recovery workflows, account deletion/export, legal/support content, automated scheduled sync, provider webhook signature verification if webhooks are enabled, comprehensive production monitoring, and real provider integration tests. Exact decimal arithmetic/ledger accounting and cash-flow-adjusted returns are future enhancements; this journal uses numeric values for display analytics and never submits transactions. News currently limits requests to twelve unique stock symbols per refresh plus general/crypto themes.

## Checks

```sh
npm run typecheck
npm test
npm run build:web
```

Official references: [SnapTrade auth](https://docs.snaptrade.com/docs/authentication-methods), [read-only portal](https://docs.snaptrade.com/docs/implement-connection-portal), [positions](https://docs.snaptrade.com/reference/Account%20Information/AccountInformation_getAllAccountPositions), [request signatures](https://docs.snaptrade.com/docs/request-signatures), [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [Finnhub](https://finnhub.io/docs/api).
