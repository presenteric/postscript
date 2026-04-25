import { useState, useMemo } from "react";
import { Avatar, Button, Chip, ProfileDepthChip, relDate } from "./shared.jsx";

// Screen 1: default workspace, data-table view of enrichable profiles.
// Filters above the table, bulk action bar slides in when ≥1 row checked,
// click a row → drill into Screen 2 (profile detail).

export default function WorkspaceTable({ subscribers, onSelectSubscriber, lastRefreshed }) {
  const [filters, setFilters] = useState({ status: "all", method: "all", shopper: "all", depth: "all", q: "" });
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      if (filters.depth !== "all" && s.profileDepth !== filters.depth) return false;
      if (filters.shopper === "active" && (s.shopperEngagement?.count ?? 0) === 0) return false;
      if (filters.shopper === "none" && (s.shopperEngagement?.count ?? 0) > 0) return false;
      if (filters.status === "pending" && (s.proposedEnrichments?.length ?? 0) === 0) return false;
      if (filters.status === "auto-apply" && !s.autoApplyInfer) return false;
      if (filters.method !== "all") {
        const hasMethod = (s.proposedEnrichments ?? []).some((p) => p.method === filters.method);
        if (!hasMethod) return false;
      }
      if (filters.q && !s.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [subscribers, filters]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };
  const clearSelected = () => setSelected(new Set());

  return (
    <div className="px-10 pt-8 pb-10 max-w-[1440px] mx-auto">
      {/* Page header — Postscript-scale: huge bold title, eyebrow context above. */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[color:var(--color-ink-muted)] mb-2">
            Subscribers
          </div>
          <h1 className="text-[36px] leading-[1.1] font-bold tracking-tight text-[color:var(--color-ink)] mb-2">
            AI Enrichment
          </h1>
          <p className="text-[13px] text-[color:var(--color-ink-muted)]">
            Last refreshed {relDate(lastRefreshed)} · {subscribers.length} subscribers with activity
          </p>
        </div>
        <Button variant="secondary">↻ Refresh</Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterDropdown
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          options={[
            { value: "all", label: "All statuses" },
            { value: "pending", label: "Has pending" },
            { value: "auto-apply", label: "Auto-apply on" },
          ]}
        />
        <FilterDropdown
          value={filters.method}
          onChange={(v) => setFilters({ ...filters, method: v })}
          options={[
            { value: "all", label: "All methods" },
            { value: "append", label: "Append" },
            { value: "infer", label: "Infer" },
            { value: "ask", label: "Ask" },
          ]}
        />
        <FilterDropdown
          value={filters.shopper}
          onChange={(v) => setFilters({ ...filters, shopper: v })}
          options={[
            { value: "all", label: "All Shopper engagement" },
            { value: "active", label: "Shopper-active" },
            { value: "none", label: "No Shopper history" },
          ]}
        />
        <FilterDropdown
          value={filters.depth}
          onChange={(v) => setFilters({ ...filters, depth: v })}
          options={[
            { value: "all", label: "All profile depth" },
            { value: "rich", label: "Rich" },
            { value: "moderate", label: "Moderate" },
            { value: "thin", label: "Thin" },
            { value: "new", label: "New" },
          ]}
        />
        <div className="ml-auto relative w-72">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[color:var(--color-ink-subtle)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search subscribers"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="w-full h-9 pl-9 pr-3 text-[13px] border border-[color:var(--color-line)] rounded-lg bg-white focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-bg)]"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 px-4 py-3 bg-white border border-[color:var(--color-brand)] rounded-xl shadow-[0_1px_2px_rgba(20,20,40,0.03)]">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold metric text-[color:var(--color-brand)]">
              {selected.size} selected
            </span>
            <button onClick={clearSelected} className="text-[13px] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary">Defer all</Button>
            <Button variant="secondary">Ask all</Button>
            <Button variant="secondary">Infer all</Button>
            <Button variant="secondary">Append all</Button>
            <Button variant="primary">
              <span className="inline-flex items-center gap-1.5">
                <svg
                  aria-hidden
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="-ml-0.5"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
                AI Enrich all
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Data table — sits in a white card with subtle borders, alt rows for scan rhythm */}
      <div className="bg-white border border-[color:var(--color-line)] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,20,40,0.03)]">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[12px] font-semibold text-[color:var(--color-ink)] bg-[color:var(--color-surface-muted)]">
              <th className="pl-5 pr-2 py-3.5 border-b border-[color:var(--color-line)] w-10">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={selectAll}
                  className="accent-[color:var(--color-brand)]"
                />
              </th>
              <th className="px-3 py-3.5 border-b border-[color:var(--color-line)]">Subscriber</th>
              <th className="px-3 py-3.5 border-b border-[color:var(--color-line)]">Profile depth</th>
              <th className="px-3 py-3.5 border-b border-[color:var(--color-line)]">Pending</th>
              <th className="px-3 py-3.5 border-b border-[color:var(--color-line)]">Shopper engagement</th>
              <th className="px-3 py-3.5 pr-5 border-b border-[color:var(--color-line)]">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const proposals = s.proposedEnrichments ?? [];
              const pending = proposals.length;
              const counts = {
                ask: proposals.filter((p) => p.method === "ask").length,
                infer: proposals.filter((p) => p.method === "infer").length,
                append: proposals.filter((p) => p.method === "append").length,
              };
              const isAlt = i % 2 === 1;
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelectSubscriber(s.id)}
                  className={`border-b border-[color:var(--color-line)] last:border-b-0 cursor-pointer transition-colors ${
                    isAlt ? "bg-[color:var(--color-row-alt)]" : "bg-white"
                  } hover:bg-[color:var(--color-brand-bg)]`}
                >
                  <td className="pl-5 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="accent-[color:var(--color-brand)]"
                    />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.initials} size="sm" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[color:var(--color-brand)]">{s.name}</div>
                        <div className="text-[11px] text-[color:var(--color-ink-subtle)] metric">{s.phone}</div>
                        {(s.autoAppendShopify || s.autoApplyInfer || s.autoWritebackShopify) && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {s.autoAppendShopify && <Chip tone="default">auto append</Chip>}
                            {s.autoApplyInfer && <Chip tone="brand">auto infer</Chip>}
                            {s.autoWritebackShopify && <Chip tone="info">auto write</Chip>}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <ProfileDepthChip depth={s.profileDepth} />
                  </td>
                  <td className="px-3 py-4">
                    {pending > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] metric font-semibold text-[color:var(--color-ink)] leading-none">
                          {pending}
                        </span>
                        <span className="text-[11px] text-[color:var(--color-ink-muted)] metric">
                          {[
                            counts.ask && `${counts.ask} ask`,
                            counts.infer && `${counts.infer} infer`,
                            counts.append && `${counts.append} append`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] metric text-[color:var(--color-ink-subtle)]">0</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-[12px] text-[color:var(--color-ink-muted)] metric">
                    {s.shopperEngagement?.label ?? "—"}
                  </td>
                  <td className="px-3 py-4 pr-5 text-[12px] text-[color:var(--color-ink-muted)] metric">
                    {relDate(s.lastActiveAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-[36px] mb-2">📬</div>
            <p className="text-[14px] font-medium mb-1">No subscribers match those filters</p>
            <p className="text-[12px] text-[color:var(--color-ink-muted)]">Try clearing a filter or adjusting search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 text-[13px] border border-[color:var(--color-line)] rounded-lg bg-white text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-bg)] cursor-pointer appearance-none"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[color:var(--color-ink-muted)]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
  );
}
