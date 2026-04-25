import { attributeMeta } from "../data/subscribers.js";
import { Chip, KV, ScorePill, Section } from "./shared.jsx";

// Middle panel. Shows the current state of the unified profile plus the
// four data layers that feed it. The "after" column is computed from the
// list of approved enrichments — this is the product decision: the profile
// never silently changes, the merchant sees exactly what's about to land.

function formatValue(val, type) {
  if (val == null || val === "") return null;
  if (type === "array") return val.join(", ");
  return val;
}

function SourceBlock({ title, subtitle, children, accent }) {
  return (
    <div className="rounded-md border border-[color:var(--color-line)] bg-white">
      <div className="px-3 py-2 border-b border-[color:var(--color-line)] flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink)]">{title}</div>
          <div className="text-[11px] text-[color:var(--color-muted)] mt-0.5">{subtitle}</div>
        </div>
        {accent}
      </div>
      <div className="px-3 py-2 text-sm">{children}</div>
    </div>
  );
}

function relDate(iso) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

export default function ProfilePanel({ subscriber, approvedEnrichments }) {
  // Compute the "after" profile by overlaying approved enrichments onto the
  // current profile object.
  const after = { ...subscriber.profile };
  approvedEnrichments.forEach(e => {
    if (e.method === "ask") return; // ask actions don't write until reply
    if (attributeMeta[e.attribute]) after[e.attribute] = e.proposedValue;
  });

  const profileEntries = Object.entries(attributeMeta)
    .filter(([key]) => key in subscriber.profile || key in after)
    .map(([key, meta]) => {
      const before = subscriber.profile[key];
      const now = after[key];
      const changed = before !== now && (before == null || JSON.stringify(before) !== JSON.stringify(now));
      return { key, meta, before, now, changed };
    });

  return (
    <section className="flex-1 min-w-0 overflow-y-auto">
      <header className="px-6 py-5 border-b border-[color:var(--color-line)] bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{subscriber.name}</h1>
              <Chip tone="outline">{subscriber.scenarioLabel}</Chip>
            </div>
            <div className="text-sm text-[color:var(--color-muted)] mt-1">
              {subscriber.phone} · opted in {relDate(subscriber.optedInAt)} · last active {relDate(subscriber.lastActiveAt)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[color:var(--color-muted)] uppercase tracking-wide mb-1">Enrichment score</div>
            <ScorePill value={subscriber.enrichmentScore} />
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">

        {/* Unified profile — before / after */}
        <Section
          title="Unified profile"
          right={
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[color:var(--color-muted)]">Before</span>
              <span className="text-[color:var(--color-muted)]">→</span>
              <span className="text-[color:var(--color-ok)] font-semibold">
                After approving {approvedEnrichments.filter(e => e.method !== "ask").length}
              </span>
            </div>
          }
        >
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 text-sm">
            <div className="text-xs text-[color:var(--color-muted)] uppercase tracking-wide pb-2">Attribute</div>
            <div className="text-xs text-[color:var(--color-muted)] uppercase tracking-wide pb-2">Before</div>
            <div className="text-xs text-[color:var(--color-muted)] uppercase tracking-wide pb-2">After</div>
            {profileEntries.map(({ key, meta, before, now, changed }) => (
              <div key={key} className="contents">
                <div className="text-[color:var(--color-muted)] py-1.5 text-sm">{meta.label}</div>
                <div className={`py-1.5 text-sm ${before == null ? "italic text-[color:var(--color-muted)]" : ""}`}>
                  {formatValue(before, meta.type) ?? "missing"}
                </div>
                <div className={`py-1.5 text-sm ${changed ? "text-[color:var(--color-ok)] font-medium" : ""}`}>
                  {formatValue(now, meta.type) ?? (<span className="italic text-[color:var(--color-muted)]">missing</span>)}
                  {changed && <span className="ml-1.5 text-xs uppercase tracking-wide">updated</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Four data layers */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)] mb-3">Source signals</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            <SourceBlock
              title="Shopify"
              subtitle="What they bought and browsed"
              accent={<Chip tone="outline">{subscriber.shopify.totalOrders} orders</Chip>}
            >
              <KV label="Lifetime value" value={`$${subscriber.shopify.lifetimeValue.toFixed(0)}`} />
              <KV label="Last order" value={relDate(subscriber.shopify.lastOrderAt)} />
              <KV label="Abandoned carts" value={subscriber.shopify.abandonedCarts} />
              <KV
                label="Recently browsed"
                value={subscriber.shopify.lastBrowsed.length ? subscriber.shopify.lastBrowsed.join(", ") : "—"}
                muted={!subscriber.shopify.lastBrowsed.length}
              />
            </SourceBlock>

            <SourceBlock
              title="Shopper"
              subtitle="What they think and feel"
              accent={<Chip tone="outline">{subscriber.shopper.conversationCount} convos</Chip>}
            >
              {subscriber.shopper.highlights.length === 0 ? (
                <div className="italic text-[color:var(--color-muted)] text-sm">No Shopper conversations yet.</div>
              ) : (
                <ul className="space-y-1.5">
                  {subscriber.shopper.highlights.map((h, i) => (
                    <li key={i} className="text-sm">
                      <Chip tone="default">{h.topic}</Chip>
                      <span className="ml-2 text-[color:var(--color-ink)]">{h.note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SourceBlock>

            <SourceBlock
              title="Zero-party"
              subtitle="What they told us"
              accent={<Chip tone="outline">{subscriber.zeroParty.source}</Chip>}
            >
              {Object.entries(subscriber.zeroParty.fields).map(([k, v]) => (
                <KV key={k} label={k} value={typeof v === "boolean" ? (v ? "yes" : "no") : v} />
              ))}
            </SourceBlock>

            <SourceBlock
              title="SMS engagement"
              subtitle="How and when they want to be reached"
              accent={
                <Chip tone="outline">
                  {subscriber.engagement.smsClicks} clicks · {subscriber.engagement.smsReplies} replies
                </Chip>
              }
            >
              <KV label="Last reply" value={relDate(subscriber.engagement.lastReplyAt)} />
              <KV label="Quiet hours" value={subscriber.engagement.quietHours ?? "—"} muted={!subscriber.engagement.quietHours} />
            </SourceBlock>

          </div>
        </div>
      </div>
    </section>
  );
}
