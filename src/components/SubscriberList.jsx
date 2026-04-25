import { Chip } from "./shared.jsx";

// Left rail. Shows the full list with:
//   - enrichment score (the merchant's cue for "is this profile rich enough to target?")
//   - scenario chip (so the demo makes the interesting states visible)
//   - pending-enrichment count (the queue signal)

function scoreTone(score) {
  if (score >= 80) return "ok";
  if (score >= 50) return "accent";
  return "warn";
}

export default function SubscriberList({ subscribers, activeId, onSelect, filter, onFilterChange }) {
  const filters = [
    { id: "all",      label: "All",                count: subscribers.length },
    { id: "pending",  label: "Pending review",     count: subscribers.filter(s => s.proposedEnrichments.some(e => e.status === "suggested")).length },
    { id: "stale",    label: "Stale / at-risk",    count: subscribers.filter(s => s.scenario === "stale").length },
    { id: "thin",     label: "Thin profiles",      count: subscribers.filter(s => s.enrichmentScore < 50).length },
  ];
  const visible = subscribers.filter(s => {
    if (filter === "all") return true;
    if (filter === "pending") return s.proposedEnrichments.some(e => e.status === "suggested");
    if (filter === "stale") return s.scenario === "stale";
    if (filter === "thin") return s.enrichmentScore < 50;
    return true;
  });

  return (
    <aside className="w-80 shrink-0 border-r border-[color:var(--color-line)] bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[color:var(--color-line)]">
        <h2 className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">Subscribers</h2>
        <p className="text-sm text-[color:var(--color-ink)] mt-0.5">48,213 total · 6 shown with enrichment activity</p>
      </div>
      <div className="px-4 py-2 border-b border-[color:var(--color-line)] flex flex-wrap gap-1.5">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`text-xs px-2 py-1 rounded-full transition ${
              filter === f.id
                ? "bg-[color:var(--color-ink)] text-white"
                : "bg-[color:var(--color-chip)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-line)]"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70 tabular-nums">{f.count}</span>
          </button>
        ))}
      </div>
      <ul className="overflow-y-auto flex-1">
        {visible.map(s => {
          const pending = s.proposedEnrichments.filter(e => e.status === "suggested").length;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={`w-full text-left px-4 py-3 border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-chip)]/50 transition ${
                  activeId === s.id ? "bg-[color:var(--color-chip)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-[color:var(--color-muted)] truncate">{s.phone}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Chip tone={scoreTone(s.enrichmentScore)}>{s.enrichmentScore}</Chip>
                    {pending > 0 && (
                      <span className="text-[10px] text-[color:var(--color-muted)] tabular-nums">
                        {pending} pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <Chip tone="outline">{s.scenarioLabel}</Chip>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
