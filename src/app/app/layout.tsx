import Link from "next/link";
import { Activity, ExternalLink } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { getWorkspace } from "@/lib/analytics";
import { getDict, getLocale } from "@/lib/i18n";
import { AppNav, MobileNav } from "@/components/app-nav";
import { Avatar, Badge } from "@/components/ui";
import { LocaleSwitch } from "@/components/locale-switch";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  const locale = await getLocale();
  const d = getDict(locale);
  const { workspace } = await getWorkspace();

  const labels = {
    analytics: d.nav.analytics,
    workspace: d.nav.workspace,
    overview: d.nav.overview,
    revenue: d.nav.revenue,
    retention: d.nav.retention,
    funnel: d.nav.funnel,
    customers: d.nav.customers,
    team: d.nav.team,
    settings: d.nav.settings,
    caseStudy: d.nav.caseStudy,
    signOut: d.common.signOut,
  };

  return (
    <div className="min-h-screen">
      <AppNav
        name={member.name}
        role={d.roles[member.role as keyof typeof d.roles] ?? member.role}
        hue={member.hue}
        labels={labels}
      />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Link href="/app" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-indigo-400 text-white">
                <Activity size={14} strokeWidth={2.6} />
              </span>
              <span className="text-sm font-semibold text-ink">Pulse</span>
            </Link>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium text-ink-700">{workspace?.name ?? "Acme Cloud"}</span>
              <Badge tone="brand">{d.common.demoWorkspace}</Badge>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 text-[11px] font-medium text-slate-500 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
                </span>
                {d.common.live}
              </span>

              <LocaleSwitch locale={locale} />

              <Link href="/" className="btn btn-ghost btn-sm">
                <ExternalLink size={13} />
                <span className="hidden sm:inline">{d.common.website}</span>
              </Link>

              <div className="flex items-center gap-2 rounded-lg border border-line py-1 pl-1 pr-2">
                <Avatar name={member.name} hue={member.hue} className="h-6 w-6 text-[10px]" />
                <span className="hidden text-[12px] font-medium text-ink-700 sm:block">{member.name}</span>
              </div>
            </div>
          </div>

          <div className="px-4 pb-2 lg:hidden">
            <MobileNav labels={labels} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:py-7">{children}</main>
      </div>
    </div>
  );
}
