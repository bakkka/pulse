import Link from "next/link";
import { ArrowRight, CalendarClock, TrendingDown } from "lucide-react";
import { getFunnel } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";
import { Badge, Kpi, PageHeader, SectionCard } from "@/components/ui";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const days = RANGES.find((range) => String(range.days) === params.days)?.days ?? 90;
  const data = await getFunnel(days);

  const signups = data.steps[0]?.count ?? 0;
  const paid = data.steps[data.steps.length - 1]?.count ?? 0;
  const conversion = signups ? (paid / signups) * 100 : 0;
  const biggestDrop = data.steps
    .slice(1)
    .reduce(
      (worst, step) => (100 - step.fromPrevious > worst.drop ? { label: step.label, drop: 100 - step.fromPrevious } : worst),
      { label: "—", drop: 0 },
    );

  const sourceTotal = data.sources.reduce((sum, source) => sum + source.count, 0) || 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activation funnel"
        subtitle="From first signup to first payment"
        actions={
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
            {RANGES.map((range) => (
              <Link
                key={range.days}
                href={`/app/funnel?days=${range.days}`}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  range.days === days ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                }`}
              >
                {range.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Signups" value={formatNumber(signups)} hint={`in the last ${days} days`} />
        <Kpi
          label="Converted to paid"
          value={formatNumber(paid)}
          hint={`${formatNumber(signups - paid)} did not convert`}
          change={{ text: formatPercent(conversion, 0), tone: conversion > 30 ? "good" : "warn" }}
        />
        <Kpi
          label="Avg. time to convert"
          value={`${data.avgDaysToConvert.toFixed(1)}d`}
          hint="signup → first payment"
        />
        <Kpi
          label="Biggest drop-off"
          value={formatPercent(biggestDrop.drop, 0)}
          hint={biggestDrop.label}
          change={{ text: "Lost here", tone: "bad" }}
        />
      </div>

      <SectionCard title="Funnel" hint="Share of signups reaching each step">
        <div className="space-y-5">
          {data.steps.map((step, index) => {
            const width = signups ? (step.count / signups) * 100 : 0;
            return (
              <div key={step.key}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                      {index + 1}
                    </span>
                    <span className="text-[13px] font-medium text-ink">{step.label}</span>
                    {index > 0 ? (
                      <span className="text-[11px] text-slate-400">
                        {formatPercent(step.fromStart, 1)} of signups
                      </span>
                    ) : (
                      <Badge tone="neutral">100%</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{formatNumber(step.count)}</span>
                    {index > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          step.fromPrevious >= 60 ? "text-slate-400" : "text-bad"
                        }`}
                      >
                        <TrendingDown size={11} />
                        {formatPercent(step.fromPrevious, 0)} step conversion
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(width, 1.5)}%`,
                      background: `linear-gradient(90deg, #4F46E5, ${index >= 3 ? "#7C3AED" : "#6366F1"})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
          <CalendarClock size={14} className="text-slate-400" />
          <span>
            Average conversion takes <strong className="font-semibold text-ink">{data.avgDaysToConvert.toFixed(1)} days</strong>.
          </span>
          <ArrowRight size={13} className="text-slate-300" />
          <span>
            {formatPercent(conversion, 0)} of signups become paying customers in this window.
          </span>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Signups by source" hint="Where the top of the funnel comes from">
          <ul className="space-y-3">
            {data.sources.map((source) => (
              <li key={source.source}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="capitalize text-slate-600">{source.source}</span>
                  <span className="font-medium text-ink">
                    {formatNumber(source.count)}
                    <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                      {formatPercent((source.count / sourceTotal) * 100, 0)}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(source.count / sourceTotal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="What to do with this" hint="Typical next moves">
          <ul className="space-y-3 text-[12px] leading-relaxed text-slate-500">
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">Fix the biggest drop first.</strong> A 10-point
              gain at the steepest step usually beats a new acquisition channel.
            </li>
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">Compare 30 and 90 days.</strong> Short windows
              flatter activation; long windows include customers who were never going to convert.
            </li>
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">Segment by source.</strong> Paid traffic often
              converts worse at the top but better at the bottom.
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
