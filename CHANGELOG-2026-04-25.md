# Prototype v2 — Changes from Today

**Date:** Saturday, April 25, 2026
**Project:** Postscript take-home, Profile Enrichment prototype v2
**Stack:** Vite + React 19 + Tailwind v4

A working log of everything that landed today, in roughly chronological order. Grouped by theme at the bottom for the TL;DR.

---

## Timeline

### 1. Local environment
- Booted the Vite dev server on `http://localhost:5173`. Confirmed the v2 prototype runs from `npm run dev`.

### 2. Side nav fidelity pass
- Updated the side nav so it mirrors the **actual Postscript app** structure rather than a generic admin nav.
- Collapsed the **Messaging** menu by default and reverted its color to the standard styling. (The highlighted state in the original reference screenshot was an artifact of selection, not the real visual treatment.)

### 3. Styling cleanup vs. Postscript reference screenshots
The design notes had drifted away from how the real Postscript app looks. Pulled it back:
- Overall styling cleanup against the provided screenshots.
- **Right-column action buttons** moved from purple to **black/charcoal** — the previous version was leaning too purple for a tool that should feel native to the rest of the app.
- **Secondary buttons** also moved to charcoal for consistency.
- Added an **"Auto-append from Shopify"** option in the middle column, sitting above the existing **"Auto-apply inferences"** option, so merchants control the two trust levels independently.
- Collapsed that whole settings card by default and discussed whether the auto-apply controls should be a **toggle vs. a checkbox** (toggles imply immediate effect / system state; checkboxes imply staged form input — toggle was the correct call here).

### 4. Three-column responsiveness
- Flagged that the **center column** of the three-zone drill-in was stacking awkwardly at narrower widths.
- Tightened the responsive behavior so the layout doesn't fall apart given the column count.

### 5. Segmented control + AI naming
- Replaced a clunky control with a proper **segmented control**.
- Renamed the section to **"AI Enrichments"** to (a) flag the AI value explicitly to merchants, and (b) fit the label on a single row.

### 6. Action labels + ask-card flow
- Renamed the bulk actions on the selected-row shelf to **"Ask Selected"** and **"Approve Selected"** (clearer intent than the previous labels).
- When **"Ask Instead"** is chosen on an infer card, the card now switches over to the **ask card** with its three send modes: **Queue for next / In-the-moment with Shopper / Send now**.
- Added an **"Infer"** affordance at the bottom of that new ask card so the merchant can pop back to the previous infer card without losing context.
- Tightened up column widths in the three-column layout.

### 7. Datatable rework (the big one)
A significant rework of the workspace data table's action model and information density:
- **Demoted "Ask all"** as the primary action — it shouldn't be the default verb a merchant reaches for.
- New primary action: **"AI Enrich all"** with an icon, applying smart defaults across **append / infer / ask** in one click. This is the trust-forward CTA.
- **Reordered secondary actions by trust level**, from least to most trusted: **defer → ask → infer → append**. The ordering itself communicates the trust gradient.
- **Expanded the Pending column** so it breaks out the count of **ask / infer / append** items, instead of a single opaque number.
- **Removed the Status column** — it wasn't earning its space; the breakout above carries more signal.
- Swapped the placeholder sparkle emoji for an **actual icon component** (the emoji broke the layout; the icon fixed it).
- **Removed arrow icons** from the primary buttons in both the selected-row shelf and the right column for a cleaner read.
- **Stacked the auto-apply tags** onto their own line.
- Renamed those tags from generic "auto-apply" to the more precise **"Auto Append"** and **"Auto Infer"** — the old name conflated two very different trust contracts.

### 8. Page rename
- Renamed the page in both the **header and the side nav** to **"AI Enrichment"** for consistency with the in-page label.

### 9. Toggle styling fix
- Fixed a toggle component that wasn't rendering correctly.

---

## Summary by theme

**Naming & framing**
- Page renamed to **AI Enrichment** (header + nav).
- Section renamed to **AI Enrichments**.
- Tags renamed to **Auto Append** and **Auto Infer** (more granular than "auto-apply").
- Bulk actions renamed to **Ask Selected** / **Approve Selected**.
- Primary CTA on the table is now **AI Enrich all**, not Ask all.

**Trust gradient surfaced in the UI**
- Secondary actions reordered **defer → ask → infer → append** to communicate trust.
- Pending column broken out by method (ask / infer / append) instead of a single number.
- Auto-append (Shopify) and auto-apply (inference) split into two separate controls.

**Visual restraint**
- Pulled action buttons (right column + secondary) from purple to **charcoal/black** to feel native to Postscript.
- Removed arrow icons from primary buttons for a cleaner read.
- Removed the Status column.
- Replaced the placeholder sparkle emoji with a proper icon (and fixed the layout regression that caused).

**Layout & responsiveness**
- Three-column layout tightened — column widths and center-column stacking behavior.
- Tags stacked onto their own line.
- Settings card collapsed by default.
- Segmented control replaced an earlier clunkier control.

**Flow improvements**
- "Ask Instead" on an infer card now properly transitions to the ask card with all three send modes.
- New ask card has an **Infer** affordance to navigate back without losing context.

**Side nav**
- Restructured to match the actual Postscript app.
- Messaging menu collapsed by default; default color restored.

---

## What's still on the open-questions list

(See `design-notes.md` for the long form. These didn't change today but are worth flagging to the team.)

1. **Multi-select inferences** — `categoryAffinity`, `valuesAlignment`, and `offerTypePreference` are being treated with a radio model in the InferCard. They need a cardinality flag at the attribute level and per-option approve/ask/skip on multi cards.
2. **Profile depth working language** — `rich / moderate / thin / new` is placeholder. Needs merchant-validated terminology before beta.
3. **Default for per-customer auto-apply** — currently opt-in. Risk on both sides; possible week-4 prompt with precision-to-date numbers.
4. **Cross-brand learning framing** — needs to be earnable, not just rhetorical. Test with the first 5 beta merchants.
5. **Provenance disclosure for auto-applied writes** — audit log shows it; profile attribute rows don't distinguish. Probably fine for beta.
6. **"Switch to ask" on multi-select infer cards** — what does it mean when only some values are uncertain? Worth a separate sketch.
7. **Cards not yet fully designed** — append-with-conflict (Shopify vs. prior inference), bulk "Ask all" overlay modal, workspace empty state.
