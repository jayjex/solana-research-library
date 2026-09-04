#!/usr/bin/env node
/**
 * solana-research-library — MCP server over a curated Solana/web3 earning-rail intelligence DB.
 *
 * 25 structured entries covering every platform probed in our 2026-09-04 field research:
 * payment rails (x402, FiatDock), bounties (Superteam-class), agent-bounty venues, quests,
 * write-to-earn, airdrop/testnet lanes, data platforms and affiliates — each with verdict
 * (LIVE-RAIL / USER-GATED / DEAD), payout rail, KYC gate and evidence notes.
 *
 * Pure local data. No network calls at runtime, so the tools respond instantly and never
 * fail on an upstream outage.
 *
 * Tools:
 *  - list_topics()             — every entry: platform, category, verdict, payout rail, KYC
 *  - get_topic(id_or_name)     — one entry, full notes + source
 *  - search_topics(query)      — keyword search over platform + notes + rail + KYC
 *  - stats()                   — counts by verdict/category, KYC-free + crypto-rail share
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TOPICS, COMPILED_AT } from "./data.js";
const BY_KEY = new Map();
for (const t of TOPICS) {
    BY_KEY.set(t.id.toLowerCase(), t);
    BY_KEY.set(t.platform.toLowerCase(), t);
}
function findTopic(idOrName) {
    const key = idOrName.trim().toLowerCase();
    const direct = BY_KEY.get(key);
    if (direct)
        return direct;
    for (const t of TOPICS)
        if (t.platform.toLowerCase() === key)
            return t;
    const partial = TOPICS.filter((t) => t.id.includes(key) || t.platform.toLowerCase().includes(key));
    if (partial.length === 1)
        return partial[0];
    return undefined;
}
function summarize(t) {
    return {
        id: t.id,
        platform: t.platform,
        category: t.category,
        verdict: t.verdict,
        payoutRail: t.payoutRail,
        kyc: t.kyc,
        chains: t.chains,
    };
}
function search(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0)
        return [];
    const scored = [];
    for (const t of TOPICS) {
        const hay = (t.platform + "\n" + t.category + "\n" + t.payoutRail + "\n" + t.kyc + "\n" + t.chains.join(" ") + "\n" + t.notes).toLowerCase();
        let s = 0;
        for (const term of terms) {
            const inName = t.platform.toLowerCase().includes(term) || t.id.includes(term);
            const count = hay.split(term).length - 1;
            if (!inName && count === 0) {
                s = -1;
                break;
            }
            if (inName)
                s += 3;
            s += Math.min(count, 10);
        }
        if (s > 0)
            scored.push({ t, s });
    }
    return scored.sort((a, b) => b.s - a.s).map((x) => x.t);
}
const server = new McpServer({ name: "solana-research-library", version: "1.0.0" }, { instructions: "Query a curated Solana/web3 earning-rail intelligence DB: 25 platforms probed 2026-09-04 across x402 payment rails, bounties, agent-bounty venues, quests, write-to-earn, testnets, data platforms and affiliates. " +
        "Every entry carries a verdict (LIVE-RAIL / USER-GATED / CONDITIONAL-PASS / WATCHLIST / DEAD), the exact payout rail, KYC gate and evidence notes from on-chain checks and live audits. " +
        "Use search_topics for keyword queries, get_topic for one platform's full writeup, list_topics for the index, stats for dataset shape." });
server.tool("list_topics", "List all 25 entries in the earning-rail intelligence DB (compiled 2026-09-04): platform, category, verdict, payout rail, KYC, chains.", {}, async () => ({
    content: [{
            type: "text",
            text: JSON.stringify({
                dataset: "solana-web3-earning-rail-intelligence",
                compiledAt: COMPILED_AT,
                count: TOPICS.length,
                topics: TOPICS.map(summarize),
            }, null, 2),
        }],
}));
server.tool("get_topic", "Get one entry by id, exact platform name, or unique fragment — returns the FULL evidence notes and the source brief it came from.", { idOrName: z.string().describe("Entry id, platform name, or unique fragment, e.g. 'x402', 'grass', 'apify-store'") }, async ({ idOrName }) => {
    const t = findTopic(idOrName);
    if (!t) {
        const matches = TOPICS.filter((x) => (x.platform + " " + x.id).toLowerCase().includes(idOrName.trim().toLowerCase())).map((x) => x.platform);
        return { content: [{ type: "text", text: JSON.stringify({
                        error: `No entry matches '${idOrName}'.`,
                        hint: "Use list_topics() for the index, or try an id fragment.",
                        similarPlatforms: matches.slice(0, 5),
                    }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({ ...summarize(t), notes: t.notes, source: t.source }, null, 2) }] };
});
server.tool("search_topics", "Keyword search across platform names, categories, payout rails, KYC gates and full notes. All terms must match; ranked by term frequency (name hits weigh more).", { query: z.string().describe("Keywords, e.g. 'USDC Solana', 'no KYC', 'dead fiat'") }, async ({ query }) => {
    const results = search(query);
    return { content: [{ type: "text", text: JSON.stringify({
                    query,
                    matches: results.length,
                    topics: results.map((t) => ({ ...summarize(t), snippet: t.notes.slice(0, 300) })),
                }, null, 2) }] };
});
server.tool("stats", "Dataset shape: entry count, compile date, verdict mix, category mix, KYC-free share, crypto-rail share, live-rail shortlist.", {}, async () => {
    const verdicts = {};
    const categories = {};
    for (const t of TOPICS) {
        verdicts[t.verdict] = (verdicts[t.verdict] || 0) + 1;
        categories[t.category] = (categories[t.category] || 0) + 1;
    }
    const kycFree = TOPICS.filter((t) => /^none/.test(t.kyc)).length;
    const cryptoRail = TOPICS.filter((t) => /USDC|crypto|token|HIVE|HBD|GRASS|STEEM|LIT|USDC|BULB|SPL|GHO|tip|points/i.test(t.payoutRail) && !/fiat only|PayPal|bank/i.test(t.payoutRail)).length;
    const live = TOPICS.filter((t) => t.verdict === "LIVE-RAIL").map((t) => t.platform);
    return { content: [{ type: "text", text: JSON.stringify({
                    dataset: "solana-web3-earning-rail-intelligence",
                    compiledAt: COMPILED_AT,
                    entries: TOPICS.length,
                    verdictMix: verdicts,
                    categoryMix: categories,
                    kycFreeEntries: kycFree,
                    cryptoRailEntries: cryptoRail,
                    liveRails: live,
                    note: "Every platform was field-probed 2026-09-04 (live checks, on-chain verification, terms audits). DEAD entries are kill-logged so you never re-research them.",
                }, null, 2) }] };
});
const transport = new StdioServerTransport();
await server.connect(transport);
