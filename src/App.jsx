import { useState } from "react";
import { merchant, subscribers as seedSubscribers } from "./data/subscribers.js";
import WorkspaceTable from "./components/WorkspaceTable.jsx";
import ProfileDetail from "./components/ProfileDetail.jsx";

// v2 top-level state machine.
//
// Two views: the data-table workspace (default), and the three-zone profile detail (drill-in).
// View transitions are state-driven, no router. Click a row → set selectedId → switch to detail.
// Click "All subscribers" in detail → clear selectedId → return to workspace.
//
// All product calls live one level down in the components. App is just chrome + routing.

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [lastRefreshed] = useState(new Date(Date.now() - 12 * 60 * 1000).toISOString()); // 12 min ago

  const view = selectedId ? "detail" : "workspace";

  return (
    <div className="min-h-screen flex bg-[color:var(--color-canvas)]">
      {/* Left nav */}
      <LeftNav merchant={merchant} />

      {/* Main column — no top bar; Postscript puts merchant info in the sidebar
          and lets the page heading own the top of the canvas. */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 min-h-0">
          {view === "workspace" ? (
            <WorkspaceTable
              subscribers={seedSubscribers}
              onSelectSubscriber={setSelectedId}
              lastRefreshed={lastRefreshed}
            />
          ) : (
            <ProfileDetail
              subscribers={seedSubscribers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onBack={() => setSelectedId(null)}
            />
          )}
        </div>

        {/* Floating help button — matches the purple bubble in the live app */}
        <HelpBubble />
      </div>
    </div>
  );
}

// ---------- HelpBubble ----------
// Fixed bottom-right purple circle. In the live app it opens an in-product
// help/chat surface; here it's pure chrome so the page reads as Postscript.
function HelpBubble() {
  return (
    <button
      type="button"
      aria-label="Help"
      className="fixed bottom-5 right-5 w-11 h-11 rounded-full bg-[color:var(--color-brand)] text-white shadow-[0_4px_14px_rgba(93,58,216,0.35)] hover:bg-[color:var(--color-brand-hover)] transition-colors flex items-center justify-center"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
        <circle cx="12" cy="17" r=".6" fill="currentColor" />
      </svg>
    </button>
  );
}

// ---------- LeftNav ----------
// Mirrors the actual Postscript app nav: brand pill, Search, Dashboard,
// Messaging (expanded with sub-items), Subscribers (where Enrichment lives),
// Acquisition, Analytics, Apps, then a Help/Admin tail and footer links.
//
// "Enrichment" is the prototype's feature — it's parked as the active
// sub-item under Subscribers so the surrounding chrome reads as a real area
// of the product, not a bespoke top-level item.
function LeftNav({ merchant }) {
  return (
    <aside className="w-[224px] flex-none border-r border-[color:var(--color-line)] bg-white flex flex-col">
      {/* Brand pill — the chunky purple capsule from the live app */}
      <div className="px-5 pt-6 pb-5">
        <div className="inline-flex items-center h-10 px-5 rounded-full bg-[color:var(--color-brand)] text-white text-[17px] font-bold tracking-tight shadow-[0_2px_6px_rgba(93,58,216,0.25)]">
          Postscript
        </div>
      </div>

      <nav className="px-3 pb-3 flex-1 overflow-y-auto">
        <NavItem icon={<IconSearch />} label="Search" />
        <NavItem icon={<IconDashboard />} label="Dashboard" />

        <NavGroup
          icon={<IconMessaging />}
          label="Messaging"
          collapsed
          items={[
            { label: "Campaigns" },
            { label: "Automations" },
            { label: "Segments" },
            { label: "Responses" },
          ]}
        />

        <NavGroup
          icon={<IconSubscribers />}
          label="Subscribers"
          items={[
            { label: "All subscribers" },
            { label: "AI Enrichment", active: true },
          ]}
        />

        <NavItem icon={<IconAcquisition />} label="Acquisition" />
        <NavItem icon={<IconAnalytics />} label="Analytics" />
        <NavItem icon={<IconApps />} label="Apps" />

        <div className="mt-3">
          <NavItem
            icon={<IconSettings />}
            label="Postscript Help Center"
            sub={
              <div className="pl-10 -mt-1 mb-2">
                <div className="text-[12px] text-[color:var(--color-ink-muted)] truncate">{merchant.name}</div>
                <div className="text-[11px] text-[color:var(--color-ink-subtle)] tabular">
                  {merchant.subscribers.toLocaleString()} total subscribers
                </div>
              </div>
            }
          />
          <NavItem icon={<IconKey />} label="Postscript Admin" />
        </div>
      </nav>

      {/* Footer links */}
      <div className="px-5 py-3 border-t border-[color:var(--color-line)] text-[11px] text-[color:var(--color-ink-subtle)]">
        <span className="hover:text-[color:var(--color-ink-muted)] cursor-pointer">Referrals</span>
        <span className="mx-1.5">·</span>
        <span className="hover:text-[color:var(--color-ink-muted)] cursor-pointer">Compliance</span>
        <span className="mx-1.5">·</span>
        <span className="hover:text-[color:var(--color-ink-muted)] cursor-pointer">Terms</span>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, sub }) {
  return (
    <>
      <div
        className={`flex items-center gap-3 h-9 px-3 rounded-md text-[13px] cursor-pointer transition-colors mb-0.5 ${
          active
            ? "bg-[#111114] text-white font-medium"
            : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]"
        }`}
      >
        <span
          aria-hidden
          className={`w-4 h-4 flex items-center justify-center ${
            active ? "text-white" : "text-[color:var(--color-ink-muted)]"
          }`}
        >
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {sub}
    </>
  );
}

// A NavItem with nested sub-items. `collapsed` hides the children — used for
// sections the merchant isn't currently inside of (like Messaging when we're
// over in Subscribers/Enrichment).
function NavGroup({ icon, label, items, collapsed }) {
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-3 h-9 px-3 rounded-md text-[13px] cursor-pointer transition-colors text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)]">
        <span aria-hidden className="w-4 h-4 flex items-center justify-center text-[color:var(--color-ink-muted)]">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      {!collapsed && (
        <div className="ml-10 mt-0.5 mb-1 flex flex-col gap-0.5">
          {items.map((it) => (
            <SubNavItem key={it.label} label={it.label} active={it.active} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ label, active }) {
  if (active) {
    return (
      <div className="self-start">
        <span className="inline-flex items-center h-7 px-3 rounded-full bg-[color:var(--color-brand)] text-white text-[13px] font-medium">
          {label}
        </span>
      </div>
    );
  }
  return (
    <div className="h-7 flex items-center px-3 text-[13px] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] cursor-pointer">
      {label}
    </div>
  );
}

// ---------- Nav icons ----------
// Small inline SVGs at 16px, 1.5px stroke. Kept inline so the nav stays
// portable; if we ever ship more icons we can lift them to shared.jsx.
const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconSearch() {
  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </svg>
  );
}
function IconMessaging() {
  return (
    <svg {...svgProps}>
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1.2 3.6A8 8 0 0 1 21 12Z" />
    </svg>
  );
}
function IconSubscribers() {
  return (
    <svg {...svgProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M17 13.5a6.5 6.5 0 0 1 4.5 6.5" />
    </svg>
  );
}
function IconAcquisition() {
  return (
    <svg {...svgProps}>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <path d="M17 5h5M19.5 2.5v5" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg {...svgProps}>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </svg>
  );
}
function IconApps() {
  return (
    <svg {...svgProps}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg {...svgProps}>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 9.2-9.2" />
      <path d="m17 5 3 3" />
      <path d="m15 7 3 3" />
    </svg>
  );
}

