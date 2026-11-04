import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, KeyRound } from "lucide-react";
import { signIn } from "@/app/actions";
import { getCurrentMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatNumber } from "@/lib/format";
import { Field, Notice } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { as: "owner", email: "owner@pulse.app", role: "Owner", detail: "full access" },
  { as: "admin", email: "admin@pulse.app", role: "Admin", detail: "edit data" },
  { as: "viewer", email: "viewer@pulse.app", role: "Viewer", detail: "read only" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; as?: string }>;
}) {
  const member = await getCurrentMember();
  if (member) redirect("/app");

  const params = await searchParams;
  const preset = DEMO_ACCOUNTS.find((account) => account.as === params.as);
  const email = preset?.email ?? "owner@pulse.app";

  const [mrrAggregate, activeCount] = await Promise.all([
    prisma.customer.aggregate({ where: { status: "active" }, _sum: { mrrCents: true } }),
    prisma.customer.count({ where: { status: "active" } }),
  ]);

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-ink">
            <ArrowLeft size={14} />
            Back to the case study
          </Link>

          <div className="mb-7 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-indigo-400 text-white">
              <Activity size={18} strokeWidth={2.6} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Pulse</p>
              <p className="text-[11px] text-slate-500">Product analytics</p>
            </div>
          </div>

          <h1 className="text-[26px] font-semibold tracking-tight text-ink">Sign in to the demo</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Pick a role to see how permissions change the workspace.
          </p>

          {params.error ? (
            <div className="mt-5">
              <Notice tone="bad">Wrong email or password.</Notice>
            </div>
          ) : null}

          <form action={signIn} className="mt-6 space-y-4">
            <Field label="Email">
              <input className="input" type="email" name="email" defaultValue={email} required autoComplete="username" />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                name="password"
                defaultValue="pulse"
                required
                autoComplete="current-password"
              />
            </Field>
            <button type="submit" className="btn btn-primary w-full">
              Sign in
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-7">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Demo accounts · password <span className="font-mono text-slate-500">pulse</span>
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <Link
                  key={account.as}
                  href={`/login?as=${account.as}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 text-[12px] transition hover:border-brand/30 hover:shadow-card"
                >
                  <KeyRound size={13} className="text-slate-400" />
                  <span className="font-medium text-ink-700">{account.role}</span>
                  <span className="font-mono text-[11px] text-slate-400">{account.email}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{account.detail}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden w-1/2 overflow-hidden bg-[#0B1220] lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgba(99,102,241,0.35),transparent_70%)]" />
        <div className="absolute inset-0 bg-dots opacity-40" />

        <div className="relative mx-auto w-full max-w-md px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
            Portfolio case
          </p>
          <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-white">
            Every metric your SaaS team argues about — on one screen.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            MRR movement, cohort retention, activation funnel and account health. Computed from
            invoices and product events, not hardcoded.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Monthly recurring revenue</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatMoney(mrrAggregate._sum.mrrCents ?? 0)}</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                live data
              </span>
            </div>
            <div className="mt-5 flex h-20 items-end gap-1.5">
              {[32, 38, 35, 44, 41, 52, 49, 58, 55, 64, 61, 72, 68, 78, 74, 86].map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-[3px] bg-gradient-to-t from-indigo-500/30 to-indigo-400"
                  style={{ height: `${value}%`, opacity: 0.55 + index / 40 }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-[11px]">
              {[
                ["Active", formatNumber(activeCount)],
                ["Roles", "3"],
                ["Cohorts", "12"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-500">{label}</p>
                  <p className="mt-0.5 font-semibold text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-7 space-y-2 text-[13px] text-slate-300">
            {["Cohort heatmap across 12 months", "Plan-gated roles: owner, admin, viewer", "CSV export of the customer base"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div className="relative mx-auto mt-10 flex w-full max-w-md items-center gap-2 px-10 text-[11px] text-slate-600">
          <BarChart3 size={13} />
          Next.js · Prisma · custom SVG charts
        </div>
      </div>
    </div>
  );
}
