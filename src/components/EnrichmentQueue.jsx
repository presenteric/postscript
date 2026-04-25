import { useMemo } from "react";
import { attributeMeta, methodMeta, sourceMeta } from "../data/subscribers.js";
import { Chip, ConfidenceBar } from "./shared.jsx";

// Right rail. The action surface.
//
// Three product decisions show up in this view:
//   1. The confidence threshold slider is visible and editable. The merchant
//      controls what "auto-applicable" means, not the AI.
//   2. Every proposed enrichment shows method (infer / append / ask),
//      source layers, confidence, and a human-readable rationale. No black
//      box.
//   3. "Ask in next SMS" renders the draft message the AI would send before
//      anything goes out. Nothing writes back until a reply comes in.

function formatVal(val, type) {
  if (val == null || val === "") return "—";
  if (type === "array") return val.join(", ");
  return String(val);
}

function askDraft(subscriberFirstName, attribute) {
  // Very intentional: these are templated but the demo makes it obvious
  // the merchant can edit before sending. The real system would use
  // Shopper's brand voice / Brand Center tone.
  const drafts = {
    email:            `Hey ${subscriberFirstName} — want us to send you a heads up by email too? Reply with your address and we'll add it.`,
    sizePreference:   `Quick Q so we can recommend better — what size do you usually wear?`,
    giftingVsSelf:    `Just checking — is this for you or a gift? Either way, we can help.`,
    profileFreshness: `It's been a minute. Still in-market for a new jacket, or want us to ease up on messages?`,
  };
  return drafts[attribute] ?? `Mind sharing your ${attributeMeta[attribute]?.label.toLowerCase() ?? attribute}? It helps us send better recs.`;
}

function EnrichmentCard({ enrichment, subscriber, onApprove, onReject }) {
  const meta = attributeMeta[enrichment.attribute] ?? { label: enrichment.attribute, type: "string" };
  const method = methodMeta[enrichment.method];
  const isAsk = enrichment.method === "ask";

  return (
    <article className={`rounded-lg border bg-white transition ${
      enrichment.status === "approved" ? "border-[color:var(--color-ok)]/50 opacity-70" :
      enrichment.status === "rejected" ? "border-[color:var(--color-line)] opacity-50 line-through" :
      "border-[color:var(--color-line)]"
    }`}>
      <header className="px-4 py-3 border-b border-[color:var(--color-line)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
              {meta.label}
            </span>
            <Chip tone={method.color} title={method.desc}>{method.label}</Chip>
          </div>
          <div className="text-sm mt-1 font-medium">
            {isAsk ? (
              <span className="italic text-[color:var(--color-muted)]">Capture via SMS (nothing written until reply)</span>
            ) : (
              <>Propose: <span className="text-[color:var(--color-ink)]">{formatVal(enrichment.proposedValue, meta.type)}</span></>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <ConfidenceBar value={enrichment.confidence} />
        </div>
      </header>
      <div className="px-4 py-3 text-sm space-y-2">
        <p className="text-[color:var(--color-ink)] leading-relaxed">{enrichment.rationale}</p>
        <div className="flex flex-wrap gap-1.5">
          {enrichment.source.map(s => (
            <Chip key={s} tone="default" title={sourceMeta[s]?.hint}>
              {sourceMeta[s]?.label ?? s}
            </Chip>
          ))}
        </div>
        {isAsk && (
          <div className="mt-2 rounded border border-dashed border-[color:var(--color-line-strong)] bg-[color:var(--color-chip)]/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-muted)] mb-1">
              Draft SMS · editable before send
            </div>
            <p className="text-sm italic">
              “{askDraft(subscriber.name.split(" ")[0], enrichment.attribute)}”
            </p>
          </div>
        )}
      </div>
      {enrichment.status === "suggested" && (
        <footer className="px-4 py-2.5 border-t border-[color:var(--color-line)] flex items-center justify-end gap-2">
          <button
            onClick={() => onReject(enrichment.id)}
            className="text-xs px-3 py-1.5 rounded-md text-[color:var(--color-muted)] hover:bg-[color:var(--color-chip)] transition"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(enrichment.id)}
            className="text-xs px-3 py-1.5 rounded-md bg-[color:var(--color-ink)] text-white hover:opacity-90 transition"
          >
            {isAsk ? "Queue for next send" : "Approve & write"}
          </button>
        </footer>
      )}
      {enrichment.status === "approved" && (
        <footer className="px-4 py-2 border-t border-[color:var(--color-line)] text-xs text-[color:var(--color-ok)]">
          ✓ {isAsk ? "Queued for next outbound" : "Approved — will write on save"}
        </footer>
      )}
      {enrichment.status === "rejected" && (
        <footer className="px-4 py-2 border-t border-[color:var(--color-line)] text-xs text-[color:var(--color-muted)]">
          Rejected — won't surface again for this attribute unless signal changes.
        </footer>
      )}
    </article>
  );
}

export default function EnrichmentQueue({
  subscriber, enrichments, threshold, onThresholdChange,
  onApprove, onReject, onApproveAllHighConfidence,
}) {
  const { eligibleForAuto, pending, approved, rejected } = useMemo(() => {
    const pending = enrichments.filter(e => e.status === "suggested");
    return {
      pending,
      approved: enrichments.filter(e => e.status === "approved"),
      rejected: enrichments.filter(e => e.status === "rejected"),
      eligibleForAuto: pending.filter(e => e.confidence != null && e.confidence >= threshold && e.method !== "ask"),
    };
  }, [enrichments, threshold]);

  return (
    <aside className="w-[420px] shrink-0 border-l border-[color:var(--color-line)] bg-[color:var(--color-canvas)] flex flex-col h-full">
      <header className="px-4 py-3 border-b border-[color:var(--color-line)] bg-white">
        <h2 className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
          Proposed enrichments
        </h2>
        <p className="text-sm mt-1">
          {pending.length} pending · {approved.length} approved · {rejected.length} rejected
        </p>
      </header>

      <div className="px-4 py-3 border-b border-[color:var(--color-line)] bg-white">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[color:var(--color-muted)] uppercase tracking-wide">
            Auto-apply threshold
          </label>
          <span className="text-sm font-medium tabular-nums">{Math.round(threshold * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.5" max="0.99" step="0.01"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          className="w-full accent-[color:var(--color-ink)]"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[color:var(--color-muted)]">
            {eligibleForAuto.length} item{eligibleForAuto.length === 1 ? "" : "s"} above threshold
          </span>
          <button
            onClick={onApproveAllHighConfidence}
            disabled={eligibleForAuto.length === 0}
            className="text-xs px-3 py-1.5 rounded-md bg-[color:var(--color-ink)] text-white disabled:opacity-30 hover:opacity-90 transition"
          >
            Approve all above threshold
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--color-muted)] leading-relaxed">
          Append-from-Shopify enrichments above the threshold can auto-apply without review. Inferred enrichments and ask-actions always require approval.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {enrichments.length === 0 && (
          <div className="text-sm text-[color:var(--color-muted)] italic">
            No proposed enrichments for this subscriber right now.
          </div>
        )}
        {enrichments.map(e => (
          <EnrichmentCard
            key={e.id}
            enrichment={e}
            subscriber={subscriber}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    </aside>
  );
}
