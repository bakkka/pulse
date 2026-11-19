"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/actions";
import { cn } from "@/components/ui";

export type NavLabels = {
  analytics: string;
  workspace: string;
  overview: string;
  revenue: string;
  retention: string;
  funnel: string;
  customers: string;
  team: string;
  settings: string;
  caseStudy: string;
  signOut: string;
};

type NavItem = { key: string; href: string; label: string };

function buildGroups(labels: NavLabels): { label: string; items: NavItem[] }[] {
  return [
    {
      label: labels.analytics,
      items: [
        { key: "overview", href: "/app", label: labels.overview },
        { key: "revenue", href: "/app/revenue", label: labels.revenue },
        { key: "retention", href: "/app/retention", label: labels.retention },
        { key: "funnel", href: "/app/funnel", label: labels.funnel },
      ],
    },
    {
      label: labels.workspace,
      items: [
        { key: "customers", href: "/app/customers", label: labels.customers },
        { key: "team", href: "/app/team", label: labels.team },
        { key: "settings", href: "/app/settings", label: labels.settings },
      ],
    },
  ];
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppNav({
  name,
  role,
  hue,
  labels,
}: {
  name: string;
  role: string;
  hue: number;
  labels: NavLabels;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-ink lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-indigo-400 text-white">
          <Activity size={17} strokeWidth={2.6} />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight text-white">Pulse</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Analytics</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-3">
        {buildGroups(labels).map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3">
        <Link
          href="/"
          className="mb-2 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
        >
          {labels.caseStudy}
          <ExternalLink size={12} />
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ backgroundColor: `hsl(${hue} 60% 55%)`, color: "#fff" }}
          >
            {name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12px] font-medium text-white">{name}</p>
            <p className="text-[10px] capitalize text-slate-500">{role}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              aria-label={labels.signOut}
              title={labels.signOut}
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ labels }: { labels: NavLabels }) {
  const pathname = usePathname();
  const items = buildGroups(labels).flatMap((group) => group.items);

  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition",
              active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
