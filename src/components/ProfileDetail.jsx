import { useState } from "react";
import { Avatar, Button, Chip, ConfidenceBar, ProfileDepthChip, SectionEyebrow, SourceChip, Toggle, relDate } from "./shared.jsx";
import { ProposalCard, AuditLogEntry } from "./Cards.jsx";
import { attributeMeta, sourceMeta } from "../data/subscribers.js";

// Screen 2: three-zone profile detail.
// Left: working-set list. Middle: profile + source attribution. Right: dual-mode (proposed | audit).

export default function ProfileDetail({ subscribers, selectedId, onSelect, onBack }) {
  const [rightView, setRightView] = useState("proposed"); // "proposed" | "audit"
  const subscriber = subscribers.find((s) => s.id === selectedId);
  if (!subscriber) return null;

  return (
    <div className="grid grid-cols-[240px_minmax(0,1fr)_432px] h-screen">
      {/* Left rail */}
      <aside className="border-r border-[color:var(--color-line)] bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-[color:var(--color-line)] sticky top-0 bg-white">
          <button
            onClick={onBack}
            className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[color:var(--color-brand)] hover:text-[color:var(--color-brand-hover)] mb-2 inline-flex items-center gap-1"
          >
            ← Back to enrichment
          </button>
          <div className="text-[11px] uppercase tracking-[0.04em] font-medium text-[color:var(--color-ink-muted)]">
            Working set ({subscribers.length})
          </div>
        </div>
        <div>
          {subscribers.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-4 py-3 border-b border-[color:var(--color-line)] flex items-center gap-3 transition-colors ${
                s.id === selectedId
                  ? "bg-[color:var(--color-brand-bg)] border-l-4 border-l-[color:var(--color-brand)] pl-3"
                  : "hover:bg-[color:var(--color-surface-muted)]"
              }`}
            >
              <Avatar initials={s.initials} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{s.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {(s.proposedEnrichments?.length ?? 0) > 0 && (
                    <span className="text-[11px] metric text-[color:var(--color-ink-muted)]">
                      {s.proposedEnrichments.length} pending
                    </span>
                  )}
                  <ProfileDepthChip depth={s.profileDepth} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Middle: profile detail. Inner cap at 720px keeps attribute rows from
          stretching into absurd label↔value whitespace gaps on wide displays
          while still giving the header + 2-col SignalCards room to breathe. */}
      <main className="overflow-y-auto px-8 pt-8 pb-10 min-w-0">
        <div className="max-w-[720px] mx-auto">
          <ProfileHeader subscriber={subscriber} />
          <ProfileAttributes subscriber={subscriber} />
          <SourceSignals subscriber={subscriber} />
        </div>
      </main>

      {/* Right: dual-mode trust surface */}
      <aside className="border-l border-[color:var(--color-line)] bg-[color:var(--color-canvas)] overflow-y-auto">
        <RightColumnTabs
          subscriber={subscriber}
          view={rightView}
          onChangeView={setRightView}
        />
      </aside>
    </div>
  );
}

// ---------- ProfileHeader ----------
// Three trust toggles, collapsed by default. Order matters and follows a trust
// ladder: auto-append (low-risk, structured Shopify data) → auto-apply
// inferences (higher-risk AI judgment) → sync writes to Shopify (highest-risk:
// touches data other systems read). Append + infer share an axis (review vs
// auto), and a thin divider separates them from the writeback toggle, which
// governs a different axis (whether approved writes flow back to Shopify).
// Merchants typically flip append on first. Collapsed header surfaces the
// current state via a chip so you can scan it without expanding.
function ProfileHeader({ subscriber }) {
  const [autoAppend, setAutoAppend] = useState(subscriber.autoAppendShopify ?? false);
  const [autoApply, setAutoApply] = useState(subscriber.autoApplyInfer);
  const [autoWriteback, setAutoWriteback] = useState(subscriber.autoWritebackShopify ?? false);
  const [expanded, setExpanded] = useState(false);

  const onCount = (autoAppend ? 1 : 0) + (autoApply ? 1 : 0) + (autoWriteback ? 1 : 0);
  const summaryLabel =
    onCount === 0 ? "Manual review" :
    onCount === 1 ? "1 rule active" :
    onCount === 2 ? "2 rules active" :
                    "All rules active";
  const summaryTone = onCount === 0 ? "default" : "brand";

  return (
    <div className="mb-7 pb-6 border-b border-[color:var(--color-line)]">
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[color:var(--color-ink-muted)] mb-2">
        Subscriber profile
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar initials={subscriber.initials} size="lg" />
          <div className="min-w-0">
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight mb-1.5 truncate">{subscriber.name}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[color:var(--color-ink-muted)]">
              <span className="metric whitespace-nowrap">{subscriber.phone}</span>
              <span aria-hidden className="text-[color:var(--color-ink-subtle)]">·</span>
              <span className="whitespace-nowrap">{subscriber.profile.email ?? "no email on file"}</span>
              <span aria-hidden className="text-[color:var(--color-ink-subtle)]">·</span>
              <span className="whitespace-nowrap">opted in {relDate(subscriber.optedInAt)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ProfileDepthChip depth={subscriber.profileDepth} />
              <Chip tone="default">{subscriber.shopperEngagement?.label ?? "no Shopper history"}</Chip>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[300px] bg-white border border-[color:var(--color-line)] rounded-xl shadow-[0_1px_2px_rgba(20,20,40,0.03)] overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-[color:var(--color-surface-muted)] transition-colors"
            aria-expanded={expanded}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[12px] font-semibold text-[color:var(--color-ink)]">Auto-write rules</span>
              <Chip tone={summaryTone}>{summaryLabel}</Chip>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-[color:var(--color-ink-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {expanded && (
            <div className="px-4 pt-1 pb-4 space-y-4 border-t border-[color:var(--color-line)]">
              <div />
              <Toggle
                checked={autoAppend}
                onChange={setAutoAppend}
                label="Auto-append from Shopify"
                hint="Structured Shopify data (orders, addresses, totals) writes without review."
              />
              <div className="border-t border-[color:var(--color-line)]" />
              <Toggle
                checked={autoApply}
                onChange={setAutoApply}
                label="Auto-apply inferences"
                hint="Top-ranked inferences ≥ 0.85 confidence apply without review."
              />
              <div className="border-t border-[color:var(--color-line)]" />
              <Toggle
                checked={autoWriteback}
                onChange={setAutoWriteback}
                label="Sync writes to Shopify"
                hint="Approved writes also flow back to your Shopify customer object."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- ProfileAttributes ----------
function ProfileAttributes({ subscriber }) {
  const profile = subscriber.profile;
  const attrs = Object.keys(profile);

  // Group: identity / preferences / engagement
  const groups = {
    Identity: ["email", "location"],
    Preferences: ["sizePreference", "stylePreference", "priceSensitivity", "categoryAffinity", "giftingVsSelf"],
    Engagement: ["bestSendWindow"],
  };

  return (
    <div className="space-y-6 mb-6">
      {Object.entries(groups).map(([groupName, keys]) => {
        const groupAttrs = keys.filter((k) => attrs.includes(k));
        if (groupAttrs.length === 0) return null;
        return (
          <div key={groupName}>
            <SectionEyebrow>{groupName}</SectionEyebrow>
            <div className="bg-white border border-[color:var(--color-line)] rounded-xl shadow-[0_1px_2px_rgba(20,20,40,0.03)] divide-y divide-[color:var(--color-line)] overflow-hidden">
              {groupAttrs.map((k) => (
                <AttributeRow
                  key={k}
                  label={attributeMeta[k]?.label ?? k}
                  value={profile[k]}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AttributeRow({ label, value }) {
  const display =
    value == null ? "—" :
    Array.isArray(value) ? value.join(", ") :
    String(value);
  const isEmpty = value == null;
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-[13px] font-medium text-[color:var(--color-ink-muted)]">{label}</span>
      <span className={`text-[13px] text-right ${isEmpty ? "text-[color:var(--color-ink-subtle)]" : "text-[color:var(--color-ink)]"}`}>
        {display}
      </span>
    </div>
  );
}

// ---------- SourceSignals ----------
function SourceSignals({ subscriber }) {
  const [expanded, setExpanded] = useState(false);
  const { sources } = subscriber;
  return (
    <div>
      <SectionEyebrow
        right={
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
          >
            {expanded ? "▴ Hide" : "▾ View"} signals
          </button>
        }
      >
        Source signals
      </SectionEyebrow>
      {expanded && (
        <div className="grid grid-cols-2 gap-3">
          <SignalCard
            icon="🛍️"
            label="Shopify"
            lines={[
              `${sources.shopify.orders} orders · $${sources.shopify.ltv.toLocaleString()} LTV`,
              sources.shopify.lastOrderAt ? `last order ${relDate(sources.shopify.lastOrderAt)}` : "no orders yet",
              sources.shopify.browsed?.length ? `recently browsed: ${sources.shopify.browsed.slice(0, 2).join(", ")}` : null,
            ].filter(Boolean)}
          />
          <SignalCard
            icon="💬"
            label="Shopper"
            lines={[
              `${sources.shopper.conversations} conversations`,
              sources.shopper.lastAt ? `last conv. ${relDate(sources.shopper.lastAt)}` : "no Shopper history",
              sources.shopper.topics?.length ? `topics: ${sources.shopper.topics.join(", ")}` : null,
            ].filter(Boolean)}
          />
          <SignalCard
            icon="📝"
            label="Zero-party"
            lines={[
              sources.zeroParty.source,
              `fields captured: ${sources.zeroParty.fields.join(", ")}`,
            ]}
          />
          <SignalCard
            icon="📱"
            label="SMS engagement"
            lines={[
              `${sources.engagement.clicks} clicks · ${sources.engagement.replies} replies`,
              sources.engagement.lastReplyAt ? `last reply ${relDate(sources.engagement.lastReplyAt)}` : "no replies yet",
            ]}
          />
        </div>
      )}
    </div>
  );
}

function SignalCard({ icon, label, lines }) {
  return (
    <div className="bg-white border border-[color:var(--color-line)] rounded-xl shadow-[0_1px_2px_rgba(20,20,40,0.03)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span aria-hidden className="text-[16px]">{icon}</span>
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="text-[12px] text-[color:var(--color-ink-muted)] leading-snug">{line}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------- RightColumnTabs ----------
function RightColumnTabs({ subscriber, view, onChangeView }) {
  const proposedCount = subscriber.proposedEnrichments?.length ?? 0;
  const auditCount = subscriber.auditLog?.length ?? 0;

  return (
    <div className="px-5 py-5">
      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Right panel view"
        className="flex items-center mb-4 p-1 bg-[color:var(--color-surface-muted)] border border-[color:var(--color-line)] rounded-lg"
      >
        <SegmentButton
          active={view === "proposed"}
          onClick={() => onChangeView("proposed")}
          count={proposedCount}
          icon={<SparkleIcon />}
          accent
          label="AI Enrichments"
        />
        <SegmentButton
          active={view === "audit"}
          onClick={() => onChangeView("audit")}
          count={auditCount}
          label="Audit log"
        />
      </div>

      {/* Body */}
      {view === "proposed" ? (
        <ProposedEnrichments subscriber={subscriber} />
      ) : (
        <AuditLogList subscriber={subscriber} />
      )}
    </div>
  );
}

function SegmentButton({ label, active, onClick, count, icon, accent }) {
  // accent=true highlights the AI track in brand color when active.
  const labelTone = active && accent ? "text-[color:var(--color-brand)]" : active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-muted)]";
  const iconTone = active && accent ? "text-[color:var(--color-brand)]" : "text-[color:var(--color-ink-subtle)]";
  const countTone = active && accent
    ? "bg-[color:var(--color-brand-bg-strong)] text-[color:var(--color-brand)]"
    : active
      ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-ink-muted)]"
      : "bg-white/70 text-[color:var(--color-ink-muted)]";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative flex-1 inline-flex items-center justify-center gap-1.5 h-7 px-2.5 text-[12px] font-medium rounded-md transition-all duration-150 ${
        active
          ? "bg-white shadow-[0_1px_2px_rgba(20,20,40,0.08),0_0_0_1px_rgba(20,20,40,0.04)]"
          : "hover:text-[color:var(--color-ink)]"
      } ${labelTone}`}
    >
      {icon && <span aria-hidden className={`inline-flex ${iconTone}`}>{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
      {typeof count === "number" && (
        <span
          className={`metric inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full leading-none ${countTone}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 0.75L7.05 4.05L10.35 5.1L7.05 6.15L6 9.45L4.95 6.15L1.65 5.1L4.95 4.05L6 0.75Z"
        fill="currentColor"
      />
      <path
        d="M10 8L10.45 9.35L11.8 9.8L10.45 10.25L10 11.6L9.55 10.25L8.2 9.8L9.55 9.35L10 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ProposedEnrichments({ subscriber }) {
  const proposals = subscriber.proposedEnrichments ?? [];

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-[32px] mb-2">🟢</div>
        <p className="text-[14px] font-medium mb-1">All caught up</p>
        <p className="text-[12px] text-[color:var(--color-ink-muted)] max-w-[280px] mx-auto leading-snug">
          Nothing pending on this profile. The system will surface new proposals as signal comes in.
        </p>
      </div>
    );
  }

  // Sort: append → infer → ask
  const order = { append: 0, infer: 1, ask: 2 };
  const sorted = [...proposals].sort((a, b) => (order[a.method] ?? 99) - (order[b.method] ?? 99));

  return (
    <div className="space-y-3">
      {sorted.map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          subscriber={subscriber}
          onApprove={() => {}}
          onDefer={() => {}}
          onSwitchToAsk={() => {}}
          onQueue={() => {}}
        />
      ))}
    </div>
  );
}

function AuditLogList({ subscriber }) {
  const log = subscriber.auditLog ?? [];

  if (log.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[12px] text-[color:var(--color-ink-muted)]">
          No writes recorded yet for this profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {log.map((entry, i) => (
        <AuditLogEntry key={i} entry={entry} />
      ))}
    </div>
  );
}
