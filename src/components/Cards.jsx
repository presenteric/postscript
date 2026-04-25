import { useState } from "react";
import { Card, Chip, Button, ConfidenceBar, MethodBadge, SourceChip, relDate } from "./shared.jsx";
import { attributeMeta } from "../data/subscribers.js";

const formatValue = (v) => {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
};

const attrLabel = (key) => attributeMeta[key]?.label ?? key;

// ---------- AppendCard ----------
// Single-action card. Append from Shopify. Approve or defer.
export function AppendCard({ proposal, onApprove, onDefer }) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-2 mb-3">
        <MethodBadge method="append" />
        {proposal.sources.map((s) => <SourceChip key={s} source={s} />)}
      </div>
      <div className="mb-2">
        <div className="text-[13px] text-[color:var(--color-ink-muted)] mb-0.5">
          Set <span className="font-medium text-[color:var(--color-ink)]">{attrLabel(proposal.attribute)}</span> to
        </div>
        <div className="text-[15px] font-medium">{formatValue(proposal.proposedValue)}</div>
      </div>
      <p className="text-[13px] text-[color:var(--color-ink-muted)] mb-4 leading-snug">
        {proposal.rationale}
      </p>
      <div className="flex items-center justify-between gap-2">
        <ConfidenceBar value={proposal.confidence} />
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onDefer?.(proposal.id)}>Defer</Button>
          <Button variant="primary" onClick={() => onApprove?.(proposal.id)}>Approve</Button>
        </div>
      </div>
    </Card>
  );
}

// ---------- InferCard ----------
// Top-3 ranked options. Approve the selected one, ask the subscriber instead,
// or defer. `selected` can be lifted up by the parent so a flip into AskCard
// (and back) preserves which option the merchant had picked.
export function InferCard({
  proposal,
  onApprove,
  onDefer,
  onSwitchToAsk,
  selected: selectedProp,
  onSelectedChange,
}) {
  const [internalSelected, setInternalSelected] = useState(0);
  const selected = selectedProp ?? internalSelected;
  const setSelected = (i) => {
    if (onSelectedChange) onSelectedChange(i);
    else setInternalSelected(i);
  };
  return (
    <Card padding="sm">
      <div className="flex items-center gap-2 mb-3">
        <MethodBadge method="infer" />
        {proposal.sources.map((s) => <SourceChip key={s} source={s} />)}
      </div>

      <div className="text-[13px] text-[color:var(--color-ink-muted)] mb-3">
        Predict <span className="font-medium text-[color:var(--color-ink)]">{attrLabel(proposal.attribute)}</span>
      </div>

      <div className="space-y-2 mb-4">
        {proposal.rankedOptions.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`w-full text-left p-3 rounded-md border transition-colors ${
              selected === i
                ? "bg-[color:var(--color-surface-muted)] border-[color:var(--color-line-strong)]"
                : "bg-white border-[color:var(--color-line)] hover:bg-[color:var(--color-surface-muted)]"
            }`}
          >
            <div className="flex items-start gap-3 mb-1.5">
              <input
                type="radio"
                checked={selected === i}
                readOnly
                className="mt-1 accent-[color:var(--color-brand)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[14px] font-medium">{formatValue(opt.value)}</span>
                  <ConfidenceBar value={opt.confidence} />
                </div>
                <p className="text-[12px] text-[color:var(--color-ink-muted)] leading-snug">
                  {opt.rationale}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {proposal.recommendation === "switchToAsk" && (
        <div className="text-[12px] text-[color:var(--color-warn)] bg-[color:var(--color-warn-bg)] px-3 py-2 rounded-md mb-3">
          Recommended: switch to ask. Top option is below the high-trust threshold.
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onDefer?.(proposal.id)}>Defer</Button>
        <Button variant="secondary" onClick={() => onSwitchToAsk?.(proposal.id, selected)}>Ask Selected</Button>
        <Button variant="primary" onClick={() => onApprove?.(proposal.id, selected)}>Approve Selected</Button>
      </div>
    </Card>
  );
}

// ---------- AskCard ----------
// Editable draft + three send modes. Engagement indicator on in-the-moment.
// Optional `onSwitchToInfer` reveals a back-link to flip back to the InferCard
// it was launched from (only present when the AskCard was opened from an infer
// proposal). `draft` / `mode` can be lifted up by the parent so toggling
// between Ask and Infer doesn't reset the merchant's edits.
export function AskCard({
  proposal,
  subscriber,
  onQueue,
  onDefer,
  onSwitchToInfer,
  draft: draftProp,
  onDraftChange,
  mode: modeProp,
  onModeChange,
}) {
  const [internalMode, setInternalMode] = useState(proposal.sendModeDefault ?? "queueForNext");
  const [internalDraft, setInternalDraft] = useState(proposal.draft);
  const mode = modeProp ?? internalMode;
  const draft = draftProp ?? internalDraft;
  const setMode = (m) => {
    if (onModeChange) onModeChange(m);
    else setInternalMode(m);
  };
  const setDraft = (v) => {
    if (onDraftChange) onDraftChange(v);
    else setInternalDraft(v);
  };

  const shopperActive = subscriber?.shopperEngagement?.count > 0;
  const shopperLabel = subscriber?.shopperEngagement?.label ?? "no Shopper history";

  const modes = [
    {
      id: "queueForNext",
      title: "Queue for next outbound",
      pill: "recommended",
      desc: "Rides on her next scheduled SMS. No extra message volume. Typical wait: 3–5 days.",
      enabled: true,
    },
    {
      id: "inMomentShopper",
      title: "In-the-moment with Shopper",
      pill: shopperActive ? shopperLabel : null,
      desc: shopperActive
        ? "Shopper asks during her next conversation. Highest engagement, no SMS volume."
        : "Will queue and wait for first Shopper engagement.",
      enabled: true,
      dimmed: !shopperActive,
    },
    {
      id: "sendNow",
      title: "Send now",
      pill: null,
      desc: "New outbound, sent within 5 minutes. Adds 1 message to your send volume.",
      enabled: true,
    },
  ];

  const ctaLabel =
    mode === "sendNow" ? "Send now" :
    mode === "inMomentShopper" ? "Send via Shopper" :
                                  "Queue ask";

  return (
    <Card padding="sm">
      <div className="flex items-center gap-2 mb-3">
        <MethodBadge method="ask" />
        <Chip tone="default">📱 Subscriber-confirmed</Chip>
      </div>

      <div className="text-[13px] text-[color:var(--color-ink-muted)] mb-3">
        Ask about <span className="font-medium text-[color:var(--color-ink)]">{attrLabel(proposal.attribute)}</span>
      </div>

      <textarea
        className="w-full p-3 mb-4 text-[13px] border border-[color:var(--color-line)] rounded-md bg-[color:var(--color-surface-muted)] focus:outline-none focus:border-[color:var(--color-ink)] resize-none leading-snug"
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      <div className="text-[11px] uppercase tracking-[0.04em] font-medium text-[color:var(--color-ink-muted)] mb-2">Send mode</div>
      <div className="space-y-2 mb-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!m.enabled}
            onClick={() => setMode(m.id)}
            className={`w-full text-left p-3 rounded-md border transition-colors ${
              mode === m.id
                ? "bg-[color:var(--color-surface-muted)] border-[color:var(--color-line-strong)]"
                : "bg-white border-[color:var(--color-line)] hover:bg-[color:var(--color-surface-muted)]"
            } ${m.dimmed ? "opacity-60" : ""}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={mode === m.id}
                readOnly
                className="mt-1 accent-[color:var(--color-brand)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-medium">{m.title}</span>
                  {m.pill && (
                    <Chip tone={m.id === "inMomentShopper" && shopperActive ? "ok" : "default"}>{m.pill}</Chip>
                  )}
                </div>
                <p className="text-[12px] text-[color:var(--color-ink-muted)] leading-snug">{m.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        {onSwitchToInfer ? (
          <Button variant="ghost" onClick={() => onSwitchToInfer?.(proposal.id)}>
            <span aria-hidden>←</span> Infer
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onDefer?.(proposal.id)}>Defer</Button>
          <Button variant="primary" onClick={() => onQueue?.(proposal.id, mode, draft)}>{ctaLabel}</Button>
        </div>
      </div>
    </Card>
  );
}

// ---------- InferProposalCard ----------
// Wrapper for `infer` proposals that lets the merchant flip into an Ask flow
// (and back) on the same card. Keeps the selected option, draft text, and send
// mode in local state so toggling preserves edits. The synthesized ask draft
// is seeded from the subscriber's name + the attribute being asked about — the
// merchant is expected to refine it before sending.
function buildAskDraftFromInfer(proposal, subscriber) {
  const firstName = subscriber?.name?.split(" ")[0] ?? "there";
  const label = (attributeMeta[proposal.attribute]?.label ?? proposal.attribute).toLowerCase();
  const top = proposal.rankedOptions?.[0]?.value;
  const optionsHint = Array.isArray(top) ? top.join(" / ") : top;
  if (optionsHint) {
    return `Hey ${firstName}! Quick one — would you say your ${label} is ${optionsHint}, or something else? Reply to let us know. (STOP to opt out.)`;
  }
  return `Hey ${firstName}! Quick one — what's your ${label}? Reply to let us know. (STOP to opt out.)`;
}

function InferProposalCard({ proposal, subscriber, onApprove, onDefer, onQueue }) {
  const [view, setView] = useState("infer"); // "infer" | "ask"
  const [selected, setSelected] = useState(0);
  const [askDraft, setAskDraft] = useState(() => buildAskDraftFromInfer(proposal, subscriber));
  const [askMode, setAskMode] = useState("queueForNext");

  if (view === "infer") {
    return (
      <InferCard
        proposal={proposal}
        selected={selected}
        onSelectedChange={setSelected}
        onApprove={onApprove}
        onDefer={onDefer}
        onSwitchToAsk={() => setView("ask")}
      />
    );
  }

  // Synthesized ask proposal: same id + attribute, with a pre-filled draft.
  const askProposal = {
    ...proposal,
    method: "ask",
    draft: askDraft,
    sendModeDefault: askMode,
  };

  return (
    <AskCard
      proposal={askProposal}
      subscriber={subscriber}
      draft={askDraft}
      onDraftChange={setAskDraft}
      mode={askMode}
      onModeChange={setAskMode}
      onQueue={onQueue}
      onDefer={onDefer}
      onSwitchToInfer={() => setView("infer")}
    />
  );
}

// ---------- AuditLogEntry ----------
export function AuditLogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[color:var(--color-ink-muted)] metric">{relDate(entry.at)}</span>
          <span className="text-[11px] text-[color:var(--color-ink-subtle)]">·</span>
          <MethodBadge method={entry.method} />
          {entry.writtenToShopify && (
            <Chip tone="info">🛍️ Shopify</Chip>
          )}
        </div>
      </div>
      <div className="text-[13px] mb-1">
        Set <span className="font-medium">{attrLabel(entry.attribute)}</span> to{" "}
        <span className="font-medium">{formatValue(entry.value)}</span>
      </div>
      <div className="text-[12px] text-[color:var(--color-ink-muted)] mb-2">
        Source: {entry.source}{entry.confidence != null && ` · confidence ${Math.round(entry.confidence * 100)}%`}
      </div>
      <div className="text-[12px] text-[color:var(--color-ink-muted)]">
        {entry.approvedBy.startsWith("auto-apply") || entry.approvedBy.startsWith("subscriber")
          ? entry.approvedBy
          : `Approved by ${entry.approvedBy}`}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-[12px] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
      >
        {expanded ? "▴ Hide" : "▾ View"} source trace
      </button>
      {expanded && (
        <div className="mt-2 p-3 bg-[color:var(--color-surface-muted)] rounded-md text-[12px] text-[color:var(--color-ink-muted)] leading-snug">
          <p className="mb-1.5">
            <span className="font-medium text-[color:var(--color-ink)]">{entry.source}</span>
          </p>
          <p>(Source trace would link back to original conversation, order, popup, etc.)</p>
        </div>
      )}
    </Card>
  );
}

// ---------- ProposalRouter ----------
// Switches on method and renders the right card. Infer proposals route through
// InferProposalCard so the merchant can flip into an Ask flow without losing
// their selected option or draft edits.
export function ProposalCard({ proposal, subscriber, ...handlers }) {
  if (proposal.method === "append") return <AppendCard proposal={proposal} {...handlers} />;
  if (proposal.method === "infer")  return <InferProposalCard proposal={proposal} subscriber={subscriber} {...handlers} />;
  if (proposal.method === "ask")    return <AskCard    proposal={proposal} subscriber={subscriber} {...handlers} />;
  return null;
}
