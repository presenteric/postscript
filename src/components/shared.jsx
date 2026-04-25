// Postscript-style primitives. v2.
// One file because the surface is small enough that bouncing between files
// is more friction than it's worth.

import { sourceMeta, methodMeta, profileDepthMeta } from "../data/subscribers.js";

// ---------- Chip ----------
// tone: default | ok | warn | error | info | brand | strong
export function Chip({ children, tone = "default", className = "", title }) {
  const tones = {
    default: "bg-[color:var(--color-surface-muted)] text-[color:var(--color-ink-muted)] border border-[color:var(--color-line)]",
    strong:  "bg-[color:var(--color-surface)] text-[color:var(--color-ink)] border border-[color:var(--color-line-strong)]",
    ok:      "bg-[color:var(--color-ok-bg)] text-[color:var(--color-ok)]",
    warn:    "bg-[color:var(--color-warn-bg)] text-[color:var(--color-warn)]",
    error:   "bg-[color:var(--color-error-bg)] text-[color:var(--color-error)]",
    info:    "bg-[color:var(--color-info-bg)] text-[color:var(--color-info)]",
    brand:   "bg-[color:var(--color-brand-bg)] text-[color:var(--color-brand)]",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ---------- Button ----------
// variant: primary | secondary | brand | destructive | ghost
//
// Postscript's primary action style (newer surfaces — "Enable Popups",
// "View Planner") is a solid charcoal capsule. The brand purple capsule
// ("Create Segment") is reserved for the one top-of-page hero CTA per view.
// Secondary is an outlined purple capsule ("Clone", "Download").
export function Button({ children, variant = "primary", arrow, onClick, disabled, className = "", type = "button" }) {
  const base = "inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const variants = {
    primary: "bg-[#111114] text-white hover:bg-[#2a2a30]",
    brand: "bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-hover)]",
    secondary: "bg-white text-[color:var(--color-ink)] border border-[color:var(--color-line-strong)] hover:bg-[color:var(--color-surface-muted)] hover:border-[color:var(--color-ink-muted)]",
    destructive: "bg-[color:var(--color-error-bg)] text-[color:var(--color-error)] hover:opacity-90",
    ghost: "bg-transparent text-[color:var(--color-ink-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-ink)]",
  };
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {arrow && <span aria-hidden>→</span>}
    </button>
  );
}

// ---------- ConfidenceBar ----------
// 6-segment tick visualization, tier-colored.
export function ConfidenceBar({ value, showLabel = true }) {
  if (value == null) {
    return <span className="text-[11px] text-[color:var(--color-ink-muted)] metric">n/a</span>;
  }
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.85 ? "var(--color-ok)" :
    value >= 0.6  ? "var(--color-warn)" :
                    "var(--color-ink-subtle)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-[60px] h-1.5 rounded-full bg-[color:var(--color-line)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
      {showLabel && (
        <span className="text-[11px] text-[color:var(--color-ink-muted)] metric w-9 text-right">
          {pct}%
        </span>
      )}
    </div>
  );
}

// ---------- MethodBadge ----------
export function MethodBadge({ method }) {
  const meta = methodMeta[method];
  if (!meta) return null;
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

// ---------- SourceChip ----------
export function SourceChip({ source }) {
  const meta = sourceMeta[source] ?? { label: source, icon: "•" };
  return (
    <Chip tone="default">
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.label}</span>
    </Chip>
  );
}

// ---------- ProfileDepthChip ----------
export function ProfileDepthChip({ depth }) {
  const meta = profileDepthMeta[depth];
  if (!meta) return null;
  return <Chip tone={meta.tone}>{meta.label}</Chip>;
}

// ---------- Card ----------
export function Card({ children, className = "", padding = "default" }) {
  const pad = padding === "lg" ? "p-6" : padding === "sm" ? "p-4" : "p-5";
  return (
    <section className={`bg-white border border-[color:var(--color-line)] rounded-xl shadow-[0_1px_2px_rgba(20,20,40,0.03)] ${pad} ${className}`}>
      {children}
    </section>
  );
}

// ---------- Metric ----------
export function Metric({ value, label, delta, deltaTone = "ok", size = "default" }) {
  const sizeClass = size === "lg" ? "text-[40px]" : "text-[32px]";
  const deltaTones = {
    ok:    "bg-[color:var(--color-ok-bg)] text-[color:var(--color-ok)]",
    warn:  "bg-[color:var(--color-warn-bg)] text-[color:var(--color-warn)]",
    error: "bg-[color:var(--color-error-bg)] text-[color:var(--color-error)]",
  };
  return (
    <div className="flex flex-col gap-1">
      <span className={`metric font-bold leading-tight ${sizeClass}`}>{value}</span>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[color:var(--color-ink-muted)]">{label}</span>
        {delta && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${deltaTones[deltaTone]}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- SectionEyebrow ----------
export function SectionEyebrow({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[11px] uppercase tracking-[0.04em] font-medium text-[color:var(--color-ink-muted)]">
        {children}
      </h3>
      {right}
    </div>
  );
}

// ---------- Avatar ----------
export function Avatar({ initials, size = "md" }) {
  const sizes = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-[13px]",
    lg: "w-10 h-10 text-[14px]",
  };
  return (
    <div className={`${sizes[size]} rounded-full bg-[color:var(--color-surface-muted)] border border-[color:var(--color-line)] flex items-center justify-center font-medium text-[color:var(--color-ink-muted)] flex-none`}>
      {initials}
    </div>
  );
}

// ---------- Toggle ----------
export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-[34px] h-5 rounded-full transition-colors flex-none mt-0.5 ${checked ? "bg-[color:var(--color-brand)]" : "bg-[color:var(--color-line-strong)]"}`}
      >
        <span
          className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-[0_1px_2px_rgba(20,20,40,0.25)] transition-all ${checked ? "left-4" : "left-[2px]"}`}
        />
      </button>
      <span>
        <span className="block text-[13px] font-medium text-[color:var(--color-ink)]">{label}</span>
        {hint && <span className="block text-[12px] text-[color:var(--color-ink-muted)] mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

// ---------- Relative date helper ----------
export function relDate(iso) {
  if (!iso) return "—";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}
