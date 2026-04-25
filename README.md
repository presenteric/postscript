# Profile Enrichment — Prototype v2

Postscript take-home, April 2026. Scope option 2: AI-powered profile enrichment.

This is the v2 prototype. v1 (in `../prototype/`) was kept as the research artifact that drove the v2 product decisions. v2 is what I'd actually defend.

## Run locally

```bash
npm install
npm run dev
```

Vite opens the app at `http://localhost:5173`.

## What changed from v1

Six load-bearing decisions:

1. **Method × confidence collapse.** The threshold slider is gone. The method itself (append / infer / ask) IS the trust contract. Append from Shopify is structured data; infer is AI judgment; ask is subscriber-confirmed. Merchants don't think in 0.85 terms.
2. **Top-3 ranked options on every infer.** Each inference surfaces three ranked candidates with rationale. The new calibration metric is "top-of-three selection rate."
3. **Defer replaces reject** with re-evaluation logic. Deferred inferences resurface if confidence rises with new signal; age out at 90 days.
4. **"Switch to ask" affordance** on every infer card. The third path between approve and defer for low-confidence cases.
5. **Audit log as right-column toggle.** Right column has two views: Proposed enrichments (default) or Audit log. Trust questions live in the same context as decisions.
6. **Data table as the default workspace.** Drilling into a profile is the secondary mode. Bulk actions (Append all / Infer all / Ask all) as split buttons.

## What to look at

- **Default view (workspace data table)**: the merchant's first scan. Pending count is the primary triage column. Filters for status, method, Shopper engagement, profile depth.
- **Click any row** → three-zone drill-in: working-set list left, profile detail middle, dual-mode trust surface right.
- **Right column toggle**: Proposed enrichments ↔ Audit log. Same context, two questions.
- **Per-customer auto-apply**: toggle in profile header. Off by default; merchant flips on as trust grows.
- **Ask cards** show three send modes (Queue for next / In-the-moment with Shopper / Send now), with a Shopper-engagement indicator on the in-the-moment option that dims if the subscriber has no Shopper history.

## Seeded scenarios

- **Maya Alvarez** — fresh opt-in, thin profile. Top-3 inference for category affinity; sizing inference recommends switch-to-ask.
- **Jordan Price** — rich profile, high-confidence stack. Three inferences plus an append, all ready to approve.
- **Priya Shah** — gifting signals. Inference recommends switch-to-ask; ask card defaults to in-the-moment-with-Shopper because she's active there.
- **Devon Kim** — auto-apply on. Audit log shows the trust history; right column shows what's still pending despite the auto-apply rule.
- **Thomas Reilly** — stale profile. No Shopper history, so the ask card dims the in-the-moment option. Inference recommends switch-to-ask.
- **Sam Okafor** — clean append case. Two appends ready; one inference defers.

## Stack

Vite + React 19 + Tailwind v4. Design tokens in `src/index.css` derive from `../DESIGN.md`. No backend; all state is in-memory mock data under `src/data/subscribers.js`.

## Design system

Visual language is the lo-fi Postscript-native system from `../DESIGN.md`. Components in `src/components/shared.jsx` implement the primitives (Card, Button, Chip, ConfidenceBar, MethodBadge, SourceChip, ProfileDepthChip, Metric, Toggle, Avatar).
