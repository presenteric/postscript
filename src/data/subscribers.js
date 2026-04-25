// Mock subscriber data — v2.
//
// Extends v1 with the product decisions made after treating v1 as research:
//   - method×confidence collapse: every proposal still has a method (append/infer/ask)
//     but the merchant-facing UI treats method as the trust contract, not the slider
//   - top-3 ranked options on every `infer` proposal (with rationale per option)
//   - per-customer auto-write toggles: `autoAppendShopify` (lower-risk, structured
//     data only) and `autoApplyInfer` (higher-risk AI judgment). Both default off;
//     merchants flip them on as trust grows. Append usually goes first.
//   - per-profile `auditLog` of past writes
//   - `profileDepth` replacing the old enrichment score (rich/moderate/thin/new)
//   - `deferred` is a real status with re-evaluation, not a synonym for reject
//   - `shopperEngagement` rolled up for the data-table view and the ask-card affordance

const d = (daysAgo) => {
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  return t.toISOString();
};

export const merchant = {
  name: "Wildroot Apparel",
  handle: "wildroot.myshopify.com",
  plan: "Postscript Growth",
  subscribers: 48213,
};

// ---------- subscribers ----------
export const subscribers = [
  {
    id: "sub_01",
    name: "Maya Alvarez",
    phone: "+1 (415) 555-0142",
    initials: "MA",
    optedInAt: d(4),
    lastActiveAt: d(1),
    profileDepth: "thin",
    shopperEngagement: { count: 1, windowDays: 30, label: "1 conv. · 30d" },
    autoApplyInfer: false,
    autoAppendShopify: false,
    scenarioLabel: "Fresh opt-in, cold profile",

    profile: {
      email: null,
      location: "San Francisco, CA",
      sizePreference: null,
      stylePreference: null,
      priceSensitivity: null,
      categoryAffinity: null,
      giftingVsSelf: null,
      bestSendWindow: null,
    },

    sources: {
      shopify: { orders: 0, ltv: 0, lastOrderAt: null, abandonedCarts: 1, browsed: ["Linen Trousers", "Wrap Dress", "Canvas Tote"] },
      shopper: { conversations: 1, lastAt: d(1), topics: ["sizing", "materials"] },
      zeroParty: { source: "Welcome popup", fields: ["phone"] },
      engagement: { clicks: 0, replies: 1, lastReplyAt: d(1) },
    },

    proposedEnrichments: [
      {
        id: "p_01_1",
        method: "ask",
        attribute: "email",
        proposedValue: null,
        sources: ["zeroParty"],
        draft: "Hey Maya! Want product picks straight to your inbox too? Reply with your email — or STOP to opt out.",
        sendModeDefault: "queueForNext",
        rationale: "No email on file. Capturing email at the welcome moment is highest-converting.",
        status: "pending",
      },
      {
        id: "p_01_2",
        method: "infer",
        attribute: "categoryAffinity",
        sources: ["shopify-pixel", "shopper"],
        rankedOptions: [
          { value: ["Bottoms", "Dresses"], confidence: 0.62, rationale: "Browsed 2 bottoms + 1 dress; Shopper conv. about bottoms." },
          { value: ["Bottoms"], confidence: 0.41, rationale: "Browse-weighted: most page time on bottoms specifically." },
          { value: ["Dresses", "Tops"], confidence: 0.18, rationale: "Lower-confidence; included for completeness." },
        ],
        status: "pending",
      },
      {
        id: "p_01_3",
        method: "infer",
        attribute: "sizePreference",
        sources: ["shopper"],
        rankedOptions: [
          { value: "Runs small — size up", confidence: 0.41, rationale: "One Shopper conv. flagged sizing on linen trousers." },
          { value: "True to size", confidence: 0.30, rationale: "No contradicting signal; default for thin profiles." },
          { value: "Size down", confidence: 0.12, rationale: "No supporting signal; included for completeness." },
        ],
        recommendation: "switchToAsk",
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(4), method: "append", attribute: "phone", value: "+1 (415) 555-0142", source: "zeroParty", approvedBy: "auto-apply (zero-party capture)", writtenToShopify: false },
      { at: d(4), method: "append", attribute: "location", value: "San Francisco, CA", source: "shopify", approvedBy: "auto-apply (Shopify pull)", writtenToShopify: false },
    ],
  },

  {
    id: "sub_02",
    name: "Jordan Price",
    phone: "+1 (312) 555-0917",
    initials: "JP",
    optedInAt: d(287),
    lastActiveAt: d(6),
    profileDepth: "rich",
    shopperEngagement: { count: 4, windowDays: 30, label: "4 conv. · 30d" },
    autoApplyInfer: false,
    autoAppendShopify: false,
    scenarioLabel: "High-confidence stack, ready to approve",

    profile: {
      email: "jordan.p@example.com",
      location: "Chicago, IL",
      sizePreference: "M tops, 32 bottoms",
      stylePreference: null,
      priceSensitivity: null,
      categoryAffinity: ["Outerwear"],
      giftingVsSelf: null,
      bestSendWindow: null,
    },

    sources: {
      shopify: { orders: 6, ltv: 842.5, lastOrderAt: d(34), abandonedCarts: 0, browsed: ["Waxed Chore Jacket", "Flannel Overshirt"] },
      shopper: { conversations: 4, lastAt: d(6), topics: ["price", "materials", "fit"] },
      zeroParty: { source: "Style quiz", fields: ["phone", "email", "style:workwear"] },
      engagement: { clicks: 14, replies: 7, lastReplyAt: d(6) },
    },

    proposedEnrichments: [
      {
        id: "p_02_1",
        method: "append",
        attribute: "categoryAffinity",
        proposedValue: ["Outerwear", "Shirts"],
        sources: ["shopify"],
        confidence: 0.94,
        rationale: "Expanding from Outerwear-only. Shirts now match on purchase recency. Pulled from order history.",
        status: "pending",
      },
      {
        id: "p_02_2",
        method: "infer",
        attribute: "stylePreference",
        sources: ["shopify", "shopper", "zeroParty"],
        rankedOptions: [
          { value: "Workwear / heritage", confidence: 0.91, rationale: "All 6 orders in workwear line; quiz answer aligns; Shopper topics match." },
          { value: "Heritage casual", confidence: 0.62, rationale: "Adjacent style; some flannel + chore jacket overlap." },
          { value: "Outdoor utility", confidence: 0.28, rationale: "Some signal from waxed canvas interest, but underweighted." },
        ],
        status: "pending",
      },
      {
        id: "p_02_3",
        method: "infer",
        attribute: "priceSensitivity",
        sources: ["shopper", "engagement"],
        rankedOptions: [
          { value: "Discount-motivated", confidence: 0.89, rationale: "2 Shopper convs. mentioned waiting for sale; 4 of 6 purchases used a discount code." },
          { value: "Value-conscious", confidence: 0.45, rationale: "Mid-tier purchases without discount on 2 occasions." },
          { value: "Premium", confidence: 0.08, rationale: "No premium-tier signals." },
        ],
        status: "pending",
      },
      {
        id: "p_02_4",
        method: "infer",
        attribute: "bestSendWindow",
        sources: ["engagement"],
        rankedOptions: [
          { value: "Evenings (6–9pm CT)", confidence: 0.84, rationale: "Replies cluster in this window over 3 months." },
          { value: "Weekday lunch (12–1pm CT)", confidence: 0.31, rationale: "Secondary cluster, lower volume." },
          { value: "Mornings (10am–12pm CT)", confidence: 0.10, rationale: "He explicitly said avoid before 10am." },
        ],
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(34), method: "append", attribute: "categoryAffinity", value: ["Outerwear"], source: "shopify", approvedBy: "Eric Mersmann", writtenToShopify: true },
      { at: d(34), method: "append", attribute: "sizePreference", value: "M tops, 32 bottoms", source: "shopify", approvedBy: "Eric Mersmann", writtenToShopify: true },
      { at: d(287), method: "append", attribute: "email", value: "jordan.p@example.com", source: "zeroParty", approvedBy: "auto-apply (style quiz)", writtenToShopify: false },
    ],
  },

  {
    id: "sub_03",
    name: "Priya Shah",
    phone: "+1 (646) 555-0233",
    initials: "PS",
    optedInAt: d(58),
    lastActiveAt: d(12),
    profileDepth: "moderate",
    shopperEngagement: { count: 2, windowDays: 30, label: "2 conv. · 30d" },
    autoApplyInfer: false,
    autoAppendShopify: false,
    scenarioLabel: "Gifting signals, low confidence — recommend ask",

    profile: {
      email: "priya.s@example.com",
      location: "Brooklyn, NY",
      sizePreference: "S",
      stylePreference: null,
      priceSensitivity: null,
      categoryAffinity: null,
      giftingVsSelf: null,
      bestSendWindow: null,
    },

    sources: {
      shopify: { orders: 1, ltv: 128, lastOrderAt: d(40), abandonedCarts: 2, browsed: ["Silk Scarf", "Gift Card $100", "Gift Box — Small"] },
      shopper: { conversations: 2, lastAt: d(12), topics: ["gifting", "shipping"] },
      zeroParty: { source: "Welcome popup", fields: ["phone", "email"] },
      engagement: { clicks: 2, replies: 1, lastReplyAt: d(12) },
    },

    proposedEnrichments: [
      {
        id: "p_03_1",
        method: "ask",
        attribute: "giftingVsSelf",
        proposedValue: null,
        sources: ["shopper"],
        draft: "Hey Priya! Curious — were the silk scarf + gift card a present, or a treat for yourself? Helps us recommend the right stuff. Reply gift or self.",
        sendModeDefault: "inMomentShopper",
        rationale: "Gifting signals are present but not yet a pattern. Asking via Shopper (next conv.) is lower-friction than guessing.",
        status: "pending",
      },
      {
        id: "p_03_2",
        method: "infer",
        attribute: "giftingVsSelf",
        sources: ["shopify", "shopper"],
        rankedOptions: [
          { value: "Gifting", confidence: 0.58, rationale: "Browsed gift card + gift box; asked about wrapping; deadline-driven shipping." },
          { value: "Mixed (both)", confidence: 0.32, rationale: "Single order isn't a pattern; could be either or both." },
          { value: "Self-purchase", confidence: 0.10, rationale: "No supporting signal." },
        ],
        recommendation: "switchToAsk",
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(40), method: "append", attribute: "sizePreference", value: "S", source: "shopify", approvedBy: "auto-apply (Shopify pull)", writtenToShopify: false },
      { at: d(58), method: "append", attribute: "email", value: "priya.s@example.com", source: "zeroParty", approvedBy: "auto-apply (welcome popup)", writtenToShopify: false },
    ],
  },

  {
    id: "sub_04",
    name: "Devon Kim",
    phone: "+1 (206) 555-0488",
    initials: "DK",
    optedInAt: d(152),
    lastActiveAt: d(2),
    profileDepth: "rich",
    shopperEngagement: { count: 9, windowDays: 30, label: "9 conv. · 30d" },
    autoApplyInfer: true,
    autoAppendShopify: true,
    scenarioLabel: "Returning buyer, auto-apply on",

    profile: {
      email: "devon.k@example.com",
      location: "Seattle, WA",
      sizePreference: "XS",
      stylePreference: "Minimalist",
      priceSensitivity: "Willing to pay for quality",
      categoryAffinity: ["Knitwear", "Dresses"],
      giftingVsSelf: "Self-purchase",
      bestSendWindow: "Weekends, midday",
    },

    sources: {
      shopify: { orders: 5, ltv: 1124, lastOrderAt: d(18), abandonedCarts: 0, browsed: ["Merino Cardigan", "Wool Dress"] },
      shopper: { conversations: 9, lastAt: d(2), topics: ["materials", "sustainability", "fit"] },
      zeroParty: { source: "Style quiz + post-purchase survey", fields: ["phone", "email", "style:minimalist"] },
      engagement: { clicks: 22, replies: 11, lastReplyAt: d(2) },
    },

    proposedEnrichments: [
      {
        id: "p_04_1",
        method: "infer",
        attribute: "valuesAlignment",
        sources: ["shopper"],
        rankedOptions: [
          { value: "Sustainability-conscious", confidence: 0.88, rationale: "3 of 9 Shopper convs. raised sourcing/sustainability." },
          { value: "Quality-focused", confidence: 0.61, rationale: "Adjacent values; quality language present in convs." },
          { value: "Minimalist (already known)", confidence: 0.40, rationale: "Existing attribute, not a new dimension." },
        ],
        status: "pending",
      },
      {
        id: "p_04_2",
        method: "infer",
        attribute: "offerTypePreference",
        sources: ["engagement", "shopper"],
        rankedOptions: [
          { value: "Early access > discount", confidence: 0.77, rationale: "2x click rate on 'first look' vs discount campaigns; Shopper said 'I just want to see the new stuff'." },
          { value: "Discount-motivated", confidence: 0.18, rationale: "Low signal." },
          { value: "Bundle/value", confidence: 0.12, rationale: "No supporting signal." },
        ],
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(2), method: "infer", attribute: "stylePreference", value: "Minimalist", source: "zeroParty + shopify", approvedBy: "auto-apply (rule: infer ≥ 0.85)", writtenToShopify: true, confidence: 0.91 },
      { at: d(18), method: "append", attribute: "categoryAffinity", value: ["Knitwear", "Dresses"], source: "shopify", approvedBy: "auto-apply (Shopify pull)", writtenToShopify: true },
      { at: d(40), method: "infer", attribute: "priceSensitivity", value: "Willing to pay for quality", source: "shopper + engagement", approvedBy: "Eric Mersmann", writtenToShopify: true, confidence: 0.86 },
      { at: d(60), method: "ask", attribute: "giftingVsSelf", value: "Self-purchase", source: "subscriber-confirmed (Shopper)", approvedBy: "subscriber reply", writtenToShopify: true },
      { at: d(85), method: "infer", attribute: "bestSendWindow", value: "Weekends, midday", source: "engagement", approvedBy: "Eric Mersmann", writtenToShopify: false, confidence: 0.79 },
    ],
  },

  {
    id: "sub_05",
    name: "Thomas Reilly",
    phone: "+1 (617) 555-0320",
    initials: "TR",
    optedInAt: d(401),
    lastActiveAt: d(112),
    profileDepth: "moderate",
    shopperEngagement: { count: 0, windowDays: 30, label: "no Shopper history" },
    autoApplyInfer: false,
    autoAppendShopify: false,
    scenarioLabel: "Stale profile, drifting toward unsub",

    profile: {
      email: "t.reilly@example.com",
      location: "Boston, MA",
      sizePreference: "L",
      stylePreference: "Classic",
      priceSensitivity: "Discount-motivated",
      categoryAffinity: ["Outerwear"],
      giftingVsSelf: null,
      bestSendWindow: null,
    },

    sources: {
      shopify: { orders: 3, ltv: 412, lastOrderAt: d(240), abandonedCarts: 0, browsed: [] },
      shopper: { conversations: 0, lastAt: null, topics: [] },
      zeroParty: { source: "Welcome popup", fields: ["phone", "email"] },
      engagement: { clicks: 0, replies: 0, lastReplyAt: d(240) },
    },

    proposedEnrichments: [
      {
        id: "p_05_1",
        method: "ask",
        attribute: "engagementState",
        proposedValue: null,
        sources: ["engagement"],
        draft: "Hey Thomas, it's been a minute. Still in the market for cold-weather basics? Reply yes or no — we'll keep it brief either way.",
        sendModeDefault: "queueForNext",
        rationale: "112 days since last open. Confirm-before-send rather than write new inferences on top of stale data.",
        status: "pending",
      },
      {
        id: "p_05_2",
        method: "infer",
        attribute: "engagementState",
        sources: ["engagement", "shopify"],
        rankedOptions: [
          { value: "At-risk of churn", confidence: 0.92, rationale: "112 days since last open, 240 days since last order." },
          { value: "Seasonal lapsed", confidence: 0.55, rationale: "Outerwear-only buyer; could be off-season pause." },
          { value: "Unsub-imminent", confidence: 0.28, rationale: "No reply or click signal in 8 months." },
        ],
        recommendation: "switchToAsk",
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(240), method: "append", attribute: "sizePreference", value: "L", source: "shopify", approvedBy: "auto-apply (Shopify pull)", writtenToShopify: false },
      { at: d(240), method: "infer", attribute: "stylePreference", value: "Classic", source: "shopify", approvedBy: "Eric Mersmann", writtenToShopify: true, confidence: 0.81 },
      { at: d(401), method: "append", attribute: "email", value: "t.reilly@example.com", source: "zeroParty", approvedBy: "auto-apply (welcome popup)", writtenToShopify: false },
    ],
  },

  {
    id: "sub_06",
    name: "Sam Okafor",
    phone: "+1 (213) 555-0764",
    initials: "SO",
    optedInAt: d(21),
    lastActiveAt: d(3),
    profileDepth: "thin",
    shopperEngagement: { count: 0, windowDays: 30, label: "no Shopper history" },
    autoApplyInfer: false,
    autoAppendShopify: false,
    scenarioLabel: "Shopify data ready to append",

    profile: {
      email: "sam.ok@example.com",
      location: "Los Angeles, CA",
      sizePreference: null,
      stylePreference: null,
      priceSensitivity: null,
      categoryAffinity: null,
      giftingVsSelf: null,
      bestSendWindow: null,
    },

    sources: {
      shopify: { orders: 2, ltv: 287, lastOrderAt: d(8), abandonedCarts: 1, browsed: ["Relaxed Tee (Bone)", "Denim Jacket", "Canvas Tote"] },
      shopper: { conversations: 0, lastAt: null, topics: [] },
      zeroParty: { source: "Welcome popup", fields: ["phone", "email"] },
      engagement: { clicks: 4, replies: 0, lastReplyAt: null },
    },

    proposedEnrichments: [
      {
        id: "p_06_1",
        method: "append",
        attribute: "sizePreference",
        proposedValue: "M",
        sources: ["shopify"],
        confidence: 0.95,
        rationale: "Both orders shipped as size M. Pulled from line-item variants.",
        status: "pending",
      },
      {
        id: "p_06_2",
        method: "append",
        attribute: "categoryAffinity",
        proposedValue: ["Tops", "Outerwear"],
        sources: ["shopify"],
        confidence: 0.90,
        rationale: "Orders + browse span tops + outerwear. No conflicting signal.",
        status: "pending",
      },
      {
        id: "p_06_3",
        method: "infer",
        attribute: "stylePreference",
        sources: ["shopify"],
        rankedOptions: [
          { value: "Casual neutral", confidence: 0.54, rationale: "Bone tee + denim jacket, 2 orders only." },
          { value: "Workwear", confidence: 0.32, rationale: "Denim jacket adjacency, but underspecified." },
          { value: "Streetwear", confidence: 0.14, rationale: "Weak signal." },
        ],
        recommendation: "defer",
        status: "pending",
      },
    ],

    auditLog: [
      { at: d(8), method: "append", attribute: "location", value: "Los Angeles, CA", source: "shopify", approvedBy: "auto-apply (Shopify pull)", writtenToShopify: false },
      { at: d(21), method: "append", attribute: "email", value: "sam.ok@example.com", source: "zeroParty", approvedBy: "auto-apply (welcome popup)", writtenToShopify: false },
    ],
  },
];

// ---------- meta tables ----------
export const attributeMeta = {
  email:               { label: "Email" },
  location:            { label: "Location" },
  sizePreference:      { label: "Size preference" },
  stylePreference:     { label: "Style preference" },
  priceSensitivity:    { label: "Price sensitivity" },
  categoryAffinity:    { label: "Category affinity" },
  giftingVsSelf:       { label: "Gifting vs. self" },
  bestSendWindow:      { label: "Best send window" },
  valuesAlignment:     { label: "Values alignment" },
  offerTypePreference: { label: "Offer-type preference" },
  engagementState:     { label: "Engagement state" },
  phone:               { label: "Phone" },
};

export const sourceMeta = {
  shopify:         { label: "Shopify",      icon: "🛍️" },
  "shopify-pixel": { label: "Shopify Pixel",icon: "🛍️" },
  shopper:         { label: "Shopper",      icon: "💬" },
  zeroParty:       { label: "Zero-party",   icon: "📝" },
  engagement:      { label: "SMS",          icon: "📱" },
  "subscriber-confirmed (Shopper)": { label: "Subscriber-confirmed", icon: "✓" },
  "shopper + engagement":           { label: "Shopper + SMS",        icon: "💬" },
  "zeroParty + shopify":            { label: "Quiz + Shopify",       icon: "🛍️" },
};

export const methodMeta = {
  append: { label: "Append", tone: "info",  desc: "Pulled from Shopify (structured data)." },
  infer:  { label: "Infer",  tone: "warn",  desc: "AI judgment from observed signals." },
  ask:    { label: "Ask",    tone: "brand", desc: "Subscriber-confirmed via SMS or Shopper." },
};

export const profileDepthMeta = {
  rich:     { label: "rich",     tone: "ok"      },
  moderate: { label: "moderate", tone: "info"    },
  thin:     { label: "thin",     tone: "warn"    },
  new:      { label: "new",      tone: "default" },
};
