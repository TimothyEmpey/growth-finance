# Your Growth Finance workspace

The project is in this folder only. Open `Growth Finance.code-workspace` in VS Code.

## Explore now

In one terminal run `npm run api:dev`. In a second run `npm start`, then press **w** for web or scan the QR in Expo Go. The app opens in a clearly labeled demo workspace. Account creation switches to your own empty portfolio.

## Add your keys later

Run **`npm run setup`**. It asks for:

1. SnapTrade **commercial** Client ID and Consumer Key.
2. Optional Finnhub API key for news.
3. Backend URL (keep `http://localhost:8787` locally).
4. Optional separate Cloudflare Account ID, scoped API token, D1 database ID, and web domain.

Secret prompts are hidden. Empty optional answers retain existing keys. No deployment happens in setup. The Cloudflare password supplied in chat was not saved or used.

VS Code also has named tasks for Expo, Backend, and Configure services in **Terminal → Run Task**. The workspace may need your trust decision before VS Code allows terminal tasks; trust only this folder, not its parent.

## Isolation

The codebase, dependencies, database, and configuration are separate from other projects. No other project was edited. Ordinary VS Code and host terminal processes are not filesystem sandboxes. For stricter isolation, the included `.devcontainer/devcontainer.json` mounts only this project into a container. Docker and the VS Code Dev Containers extension are required; the container has **not** been started or verified. Do not add broader host mounts or a Docker socket.

## Verified

- TypeScript checks for the app and Worker.
- Production web build and iOS JavaScript/Hermes bundle.
- Seven unit tests, including encrypted secrets and forced read-only brokerage permissions.
- Local API tests for signup, cookies, favorites/journal user isolation, CORS, and logout.
- Browser checks of portfolio filtering, favorites, position details, and responsive navigation/analytics.

An actual iPhone/Simulator session and real SnapTrade/Finnhub connections remain untested. Cloudflare resources have not been created or deployed. Privacy/support content remains blank as requested.

The standard Wrangler file resolver stalled on this machine. `npm run api:dev` and `npm run build:api` use a verified project-only resolver and Cloudflare's local runtime. Remote deployment still needs validation after account setup; if Wrangler stalls again, use the included container or diagnose the host file-resolution issue first. The initial dependency audit reported 14 moderate transitive advisories in Expo's tooling/router chain, no high or critical findings; these are documented rather than applying incompatible forced downgrades.

See `README.md` for architecture, deployment commands, and first-version limitations. Live portfolio charts start accumulating daily value snapshots when you sync; they are not cash-flow-adjusted returns. USD totals explicitly exclude unsupported valuations and other currencies.
