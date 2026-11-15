import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TONES = {
  neutral: "border-line bg-slate-50 text-slate-600",
  brand: "border-brand/20 bg-brand-50 text-brand-700",
  good: "border-good/20 bg-good/10 text-[#05603A]",
  warn: "border-warn/25 bg-warn/10 text-[#B54708]",
  bad: "border-bad/20 bg-bad/10 text-[#B42318]",
  muted: "border-line bg-white text-slate-400",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  hue = 230,
  className,
}: {
  name: string;
  hue?: number;
  className?: string;
}) {
  const label = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 70% 94%)`,
        color: `hsl(${hue} 55% 32%)`,
      }}
      aria-hidden="true"
    >
      {label || "?"}
    </span>
  );
}

export function Kpi({
  label,
  value,
  hint,
  change,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: { text: string; tone: Tone };
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-slate-500">{label}</p>
        {change ? <Badge tone={change.tone}>{change.text}</Badge> : null}
      </div>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        {hint ? <p className="text-[12px] text-slate-400">{hint}</p> : <span />}
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  hint,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card flex flex-col", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
            {hint ? <p className="mt-0.5 text-[12px] text-slate-400">{hint}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-14 text-center">
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {text ? <p className="max-w-sm text-xs text-slate-400">{text}</p> : null}
    </div>
  );
}

export function Notice({ tone = "good", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <div className={cn("mb-5 rounded-xl border px-4 py-3 text-sm", TONES[tone])} role="status">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    active: { tone: "good", label: "Active" },
    trialing: { tone: "brand", label: "Trialing" },
    churned: { tone: "muted", label: "Churned" },
    lead: { tone: "warn", label: "Lead" },
  };
  const entry = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={entry.tone}>{label ?? entry.label}</Badge>;
}

export function PlanBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}14`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export function Tabs({
  items,
  current,
}: {
  items: { href: string; label: string; count?: number }[];
  current: string;
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const active = item.href === current;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition",
              active
                ? "border-brand text-ink"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
