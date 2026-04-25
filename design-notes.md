# Design notes — open questions for follow-up

Working doc. Things surfaced during build that need a real design pass before they ship. Not exhaustive.

---

## 1. Multi-select inferences (cardinality)

**Problem.** The InferCard treats the top-3 ranked options as mutually exclusive (radio model). Some attributes ARE single-select; others aren't. The current data is already inconsistent about this:

- **Single-select** (radio is correct): `priceSensitivity` (discount-motivated OR premium), `sizePreference`, `giftingVsSelf`, `bestSendWindow`
- **Multi-select** (radio forces a wrong frame): `categoryAffinity` (could be Bottoms AND Dresses AND Tops), `valuesAlignment` (sustainability AND quality-focused are not in tension), `offerTypePreference`
- **Borderline**: `stylePreference`. A merchant could plausibly tag a customer as primarily Workwear AND secondarily Heritage. If we treat it as single, we lose nuance. If we treat it as multi, segmentation gets messier.

The current data is also inconsistent about *what gets ranked* on multi-select attributes. Maya's `categoryAffinity` ranks whole *combinations* (`["Bottoms","Dresses"]` vs `["Bottoms"]` vs `["Dresses","Tops"]`). Devon's `valuesAlignment` ranks individual *values*. Two different patterns hiding in one component.

**Proposed schema.** Cardinality flag at the attribute level, plus a corresponding shape on the proposal:

```js
// attributeMeta
priceSensitivity:  { label: "Price sensitivity",  selection: "single" },
giftingVsSelf:     { label: "Gifting vs. self",   selection: "single" },
sizePreference:    { label: "Size preference",    selection: "single" },
bestSendWindow:    { label: "Best send window",   selection: "single" },
categoryAffinity:  { label: "Category affinity",  selection: "multi"  },
valuesAlignment:   { label: "Values alignment",   selection: "multi"  },
stylePreference:   { label: "Style preference",   selection: "?"      }, // open
```

For `multi` proposals, `rankedOptions` ranks individual values with independent confidences (not combinations). Merchant approves a subset.

**InferCard rendering.**

```jsx
const isMulti = attributeMeta[proposal.attribute]?.selection === "multi";
const [chosen, setChosen] = useState(isMulti ? new Set([0]) : 0);
// row UI: <input type={isMulti ? "checkbox" : "radio"} ... />
// CTA label: isMulti
//   ? `Approve selected (${chosen.size})`
//   : "Approve top"
```

**Three follow-on implications.**

- **Calibration metric splits.** "Top-of-three selection rate" is right for single. For multi, better metric is per-option precision: when AI proposed value X with confidence ≥ threshold, what fraction of the time did the merchant approve X. Track both, separately.
- **"Switch to ask" gets more granular on multi.** Merchant might approve the high-confidence options and switch-to-ask on the lower-confidence ones in the same proposal. Card needs per-option approve/ask/skip rather than a single bottom-row decision.
- **Multi means combinations the AI didn't surface.** If the merchant wants `["Bottoms","Tops","Outerwear"]` and the AI offered three different combos that don't include that exact set, they pick the closest and edit. There should be a `+ add value` affordance on multi cards. Useful merchant-correction signal for the model.

**`stylePreference` — pick one.** Argue both, then commit. My weak instinct: multi, with the data layer also storing a "primary" flag so single-select segmentation queries still work ("primary style = Workwear" vs "Workwear in style array"). Worth a 10-min conversation with GTM and ML.

---

## 2. Profile depth working language

`rich / moderate / thin / new` is placeholder. No major customer-data platform (Klaviyo, Braze, Mailchimp, Iterable) has a settled term for this. We're inventing.

GTM should test with real merchants: do they say "rich profile," "deep customer data," "fleshed-out customer," "we know a lot about this one"? The verb merchants use ("know" vs "have") matters.

Decide before the workspace data table ships to beta. Owner: GTM.

---

## 3. Default for per-customer auto-apply on inferences

Currently: opt-in by default for both `autoAppendShopify` and `autoApplyInfer`. Conservative.

Risk of opt-in: merchants never enable it, the system feels like extra work, time-saved metric stays flat.

Risk of opt-out (or trusted-attribute-type opt-out): merchants don't realize what's auto-applying until something goes wrong, then trust crashes.

Possible middle path: opt-in by default, but at week 4 of a merchant's beta we surface an "enable auto-apply" prompt with their precision-to-date numbers. They've earned the trust by then; we're showing them the math.

---

## 4. Cross-brand learning framing (V2 scope)

The "what we learn from one merchant helps every merchant" register is right but unproven. Test with the first 5 beta merchants before any V2 cross-brand surface ships.

Also: data segregation has to actually be clean. Aggregate patterns ("what 'price-sensitive' means in apparel") only. No customer-identifying data ever crosses. The framing is earnable, not just rhetorical.

---

## 5. Provenance disclosure for auto-applied writes

When a merchant didn't personally review a write, how prominently do we surface "this was auto-applied per your rule"?

Currently: audit log shows it, profile attribute rows don't distinguish. Probably fine for beta. Worth revisiting if merchants surprise themselves with auto-applied attributes in segmentation.

---

## 6. The "switch to ask" on multi-select infer cards

If we go to per-option actions on multi cards (see #1), what does "switch to ask" mean? Plausibly: merchant checks the high-confidence values to approve, then for the uncertain ones, checks "switch to ask" instead, generating a multi-question ask draft (or a single question that covers multiple values: "Quick check — are you mostly buying outerwear, or also picking up tops? Reply with what fits.").

The ask card UI gets more interesting if it can carry multi-value confirmations. Worth a separate sketch.

---

## 7. Cards I haven't fully designed yet

- **Append card with conflict.** What happens when Shopify pull contradicts a previously-approved inference? (Shopify says size M, merchant approved infer of size L two months ago.) Some kind of "supersede" pattern, with the audit log showing both writes.
- **Bulk action overlay for "Ask all" on the data table.** Right now it's a primary button; the actual flow should open a modal that lets the merchant pick a default send mode for the batch.
- **Empty state for the workspace.** Specced in design-spec.md but not built.
