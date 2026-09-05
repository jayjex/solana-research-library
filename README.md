# solana-research-library

MCP server over a curated **Solana/web3 earning-rail intelligence DB**: 25 platforms field-probed 2026-09-04 across x402 payment rails, bounties, agent-bounty venues, quests, write-to-earn, airdrop/testnet lanes, data platforms and affiliates.

Each entry carries a **verdict** (`LIVE-RAIL` / `USER-GATED` / `CONDITIONAL-PASS` / `WATCHLIST` / `DEAD`), the exact **payout rail** (chain + token + settlement mechanics), the **KYC gate**, and **evidence notes** from live checks, on-chain verification and terms audits. The 11 DEAD entries are kill-logged with reasons, so agents never re-research a dead lane.

The data ships inside the package. No network calls at runtime, so the tools respond instantly and never fail on an upstream outage.

## Tools

| Tool | What it does |
|---|---|
| `list_topics()` | Index of all 25 entries: platform, category, verdict, payout rail, KYC, chains |
| `get_topic(id_or_name)` | One entry's full evidence notes + source brief. Accepts id, exact name, or a unique fragment |
| `search_topics(query)` | Keyword search over names, categories, rails, KYC gates and notes, ranked by term frequency |
| `stats()` | Verdict mix, category mix, KYC-free share, crypto-rail share, live-rail shortlist |

Sample queries: `search_topics("USDC Solana")` → x402 endpoints + Grass. `search_topics("no KYC")` → the 13 KYC-free entries. `get_topic("bountybook")` → full escrow/oracle audit.

## What's inside

Verdict mix: 4 LIVE-RAIL · 6 USER-GATED · 2 CONDITIONAL-PASS · 2 WATCHLIST · 11 DEAD. Categories: payment-rails, agent-marketplaces, agent-bounties, bounties, quests, write-to-earn, airdrops-testnets, passive-points, data-platforms, affiliates, referrals. Covers Base, Solana, Polygon, Optimism, Hive, Lens, Lighter and more.

Sources: field briefs compiled 2026-09-04 — live platform checks, Base RPC receipt decoding (Frantic payouts), on-chain escrow stats (Bountybook), terms/ToS audits (AIcrowd, Apify), faucet/RPC probes (MegaETH).

## Hosted version

Running on [FiatDock](https://fiatdock.com) at $0.02/call: https://fiatdock.com/s/svc_47d8957d-9516-4575-aac0-b05b5eccec32 (Streamable HTTP, pay-per-call via x402).

## Local setup

```bash
git clone https://github.com/jayjex/solana-research-library
cd solana-research-library
npm install
npm run build
```

## MCP client config

stdio:

```json
{
  "mcpServers": {
    "solana-research-library": {
      "command": "node",
      "args": ["/absolute/path/to/solana-research-library/dist/index.js"]
    }
  }
}
```

Once the npm package is published, `npx -y solana-research-library` works too.

## Related

- [earn-bounty-scanner](https://github.com/jayjex/earn-bounty-scanner) — live Solana bounties from Superteam Earn (fetches superteam.fun APIs)
- [earn-dataset-mcp](https://github.com/jayjex/earn-dataset-mcp) — static snapshot of 28 Superteam Earn listings with full description text

## License

MIT
