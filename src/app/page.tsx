import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Download,
  Gauge,
  Grid3x3,
  Layers,
  ListFilter,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getOverview } from "@/lib/analytics";
import { formatMoney, formatNumber } from "@/lib/format";
import { AreaChart } from "@/components/charts";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: <BarChart3 size={17} />,
    title: "Revenue that reconciles",
    text: "MRR, new, expansion, contraction and churn are derived from invoices — every bar adds up to the total.",
  },
  {
    icon: <Grid3x3 size={17} />,
    title: "Cohort retention",
    text: "Twelve monthly cohorts in a heatmap, plus a weighted retention curve. See which signup months actually stick.",
  },
  {
    icon: <ListFilter size={17} />,
    title: "Activation funnel",
    text: "Signup → activated → project → team → paid, with step conversion, drop-off and average time to convert.",
  },
  {
    icon: <Users size={17} />,
    title: "Account-level health",
    text: "Search, filter and drill into any customer: invoices, events, plan, owner and lifetime value.",
  },
  {
    icon: <ShieldCheck size={17} />,
    title: "Roles with teeth",
    text: "Owner, admin and viewer. Permissions are checked on the server in every action, not just hidden in the UI.",
  },
  {
    icon: <Download size={17} />,
    title: "Export without tickets",
    text: "CSV of the filtered customer base, generated on request and scoped to your current view.",
  },
];

export default async function LandingPage() {
  const data = await getOverview();
  const revenueTotal = data.revenueSeries.reduce((sum, point) => sum + point.value, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-indigo-400 text-white">
              <Activity size={16} strokeWidth={2.6} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">Pulse</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-6 text-[13px] font-medium text-slate-500 md:flex">
            <a href="#product" className="transition hover:text-ink">Product</a>
            <a href="#under-the-hood" className="transition hover:text-ink">How it works</a>
            <a href="#metrics" className="transition hover:text-ink">Data</a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/app" className="btn btn-primary btn-sm">
              Open demo
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-70" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
            <div className="animate-fade-up">
              <Badge tone="brand" className="px-3 py-1">
                <Layers size={12} />
                Portfolio case · SaaS analytics
              </Badge>

              <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[50px]">
                Product analytics
                <br />
                your team{" "}
                <span className="bg-gradient-to-r from-brand to-violet-500 bg-clip-text text-transparent">
                  actually opens
                </span>
                .
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-500">
                Pulse turns invoices and product events into four numbers that matter: MRR,
                retention, activation and churn. Every chart is computed from the database — no
                hardcoded "demo data" screenshots.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/app" className="btn btn-primary px-5 py-3">
                  Open the live demo
                  <ArrowRight size={16} />
                </Link>
                <a href="#under-the-hood" className="btn btn-ghost px-5 py-3">
                  How it&apos;s built
                </a>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Demo accounts for owner, admin and viewer · password{" "}
                <span className="font-mono text-slate-500">pulse</span>
              </p>

              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  [formatMoney(data.mrr), "MRR"],
                  [formatNumber(data.activeCustomers), "active customers"],
                  [`${data.nrr.toFixed(0)}%`, "net revenue retention"],
                  [formatNumber(data.totalAccounts), "accounts"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dd className="text-xl font-semibold tracking-tight text-ink">{value}</dd>
                    <dt className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* product preview */}
            <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <div className="flex items-center gap-2 border-b border-line bg-slate-50/80 px-4 py-2.5">
                  <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F97066]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FDB022]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#32D583]" />
                  </span>
                  <span className="ml-2 rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[10px] text-slate-400">
                    app.pulse.dev/overview
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-good">
                    <span className="h-1.5 w-1.5 rounded-full bg-good" />
                    live
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-ink">Overview</p>
                      <p className="text-[10px] text-slate-400">Acme Cloud · last 12 months</p>
                    </div>
                    <Badge tone="brand">{data.mrrDelta >= 0 ? "+" : ""}{data.mrrDelta.toFixed(1)}%</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["MRR", formatMoney(data.mrr)],
                      ["Customers", formatNumber(data.activeCustomers)],
                      ["NRR", `${data.nrr.toFixed(0)}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-line-soft bg-slate-50/60 p-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-0.5 text-[13px] font-semibold text-ink">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <AreaChart data={data.revenueSeries} height={150} showY={false} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
                    <span className="text-[10px] text-slate-400">Paid invoices · {formatMoney(revenueTotal, { compact: true })}</span>
                    <div className="flex items-center gap-2">
                      {data.planMix.map((plan) => (
                        <span key={plan.code} className="flex items-center gap-1 text-[9px] text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: plan.color }} />
                          {plan.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[10px] text-slate-400 shadow-card">
                <Gauge size={12} className="text-brand" />
                Real numbers from the seeded database
              </div>
            </div>
          </div>
        </section>

        {/* features */}
        <section id="product" className="border-t border-line py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Product</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Six screens that answer six different questions
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Built for the Monday metrics meeting: what changed, why, and which account is behind it.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className="card p-5 transition hover:border-brand/30 hover:shadow-pop">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    {feature.icon}
                  </span>
                  <h3 className="mt-3.5 text-[14px] font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* under the hood */}
        <section id="under-the-hood" className="border-t border-line bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Under the hood</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Metrics are computed, not painted
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                The interesting part of analytics is the model, not the gradient. Here is the shape of it.
              </p>
            </div>

            <div className="mt-9 grid gap-4 lg:grid-cols-3">
              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-slate-400" />
                  <h3 className="text-[13px] font-semibold text-ink">Data model</h3>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                  Customers, plans, invoices and product events. MRR history is reconstructed by
                  walking each account&apos;s invoices, so upgrades and downgrades show up as
                  expansion and contraction.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
{`Customer → Invoice[]  // revenue
Customer → Event[]    // cohorts, funnel`}
                </pre>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-slate-400" />
                  <h3 className="text-[13px] font-semibold text-ink">Metrics layer</h3>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                  One module answers every screen: MRR at a date, active customers, movement between
                  two dates, cohort retention, funnel steps. Dates are passed in, never hidden in a
                  chart component.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
{`mrrAt(date) // latest invoice per live account
movementBetween(from, to) // new, expansion, churn`}
                </pre>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-slate-400" />
                  <h3 className="text-[13px] font-semibold text-ink">UI layer</h3>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
                  Server components for data, small client components for hover interactions.
                  Charts are hand-built SVG: no chart library, no bundle surprise, full control over
                  edge cases like empty months.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
{`Server Component → data
Client Chart → hover, tooltip`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* metrics */}
        <section id="metrics" className="border-t border-line py-14">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              [formatNumber(data.totalAccounts), "seeded accounts"],
              ["3,560", "invoices"],
              ["13,751", "product events"],
              ["12", "monthly cohorts"],
            ].map(([value, label]) => (
              <div key={label} className="card p-5">
                <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
                <p className="mt-1 text-[12px] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-br from-brand-50 via-white to-white p-8 sm:p-12">
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    Poke at the demo, then read the code
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    Three roles, twelve months of data, real invoices. The repository includes the
                    schema, the metrics module and this case study.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/app" className="btn btn-primary px-5 py-3">
                    Open the demo
                    <ArrowRight size={16} />
                  </Link>
                  <a href="#product" className="btn btn-ghost px-5 py-3">
                    Back to top
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-[11px] text-slate-400 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand to-indigo-400 text-white">
              <Activity size={12} strokeWidth={2.8} />
            </span>
            <span className="font-medium text-slate-600">Pulse</span>
            <span className="text-slate-300">·</span>
            <span>Portfolio case. Demo data, simulated billing.</span>
          </div>
          <span>Built with Next.js · Prisma · custom SVG charts</span>
        </div>
      </footer>
    </div>
  );
}
