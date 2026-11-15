import Link from "next/link";
import { ArrowRight, CalendarClock, TrendingDown } from "lucide-react";
import { getFunnel } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";
import { getDict, getLocale, t } from "@/lib/i18n";
import { Badge, Kpi, PageHeader, SectionCard } from "@/components/ui";

const RANGES = [30, 90, 365];

export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);

  const days = RANGES.find((range) => String(range) === params.days) ?? 90;
  const data = await getFunnel(days);

  const signups = data.steps[0]?.count ?? 0;
  const paid = data.steps[data.steps.length - 1]?.count ?? 0;
  const conversion = signups ? (paid / signups) * 100 : 0;

  const biggestDrop = data.steps.slice(1).reduce(
    (worst, step) =>
      100 - step.fromPrevious > worst.drop ? { key: step.key, drop: 100 - step.fromPrevious } : worst,
    { key: "signup", drop: 0 },
  );
  const biggestDropLabel =
    d.funnel.steps[biggestDrop.key as keyof typeof d.funnel.steps] ?? biggestDrop.key;

  const sourceTotal = data.sources.reduce((sum, source) => sum + source.count, 0) || 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.funnel.title}
        subtitle={d.funnel.subtitle}
        actions={
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/app/funnel?days=${range}`}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  range === days ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                }`}
              >
                {d.funnel.ranges[String(range) as keyof typeof d.funnel.ranges]}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={d.funnel.signups} value={formatNumber(signups)} hint={t(d.funnel.signupsHint, { n: days })} />
        <Kpi
          label={d.funnel.converted}
          value={formatNumber(paid)}
          hint={t(d.funnel.convertedHint, { n: formatNumber(signups - paid) })}
          change={{ text: formatPercent(conversion, 0), tone: conversion > 30 ? "good" : "warn" }}
        />
        <Kpi
          label={d.funnel.avgTime}
          value={`${data.avgDaysToConvert.toFixed(1)}${d.funnel.days}`}
          hint={d.funnel.avgTimeHint}
        />
        <Kpi
          label={d.funnel.biggestDrop}
          value={formatPercent(biggestDrop.drop, 0)}
          hint={biggestDropLabel}
          change={{ text: d.funnel.lostHere, tone: "bad" }}
        />
      </div>

      <SectionCard title={d.funnel.title} hint={d.funnel.subtitle}>
        <div className="space-y-5">
          {data.steps.map((step, index) => {
            const width = signups ? (step.count / signups) * 100 : 0;
            const label = d.funnel.steps[step.key as keyof typeof d.funnel.steps] ?? step.key;
            return (
              <div key={step.key}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                      {index + 1}
                    </span>
                    <span className="text-[13px] font-medium text-ink">{label}</span>
                    {index > 0 ? (
                      <span className="text-[11px] text-slate-400">
                        {t(d.funnel.ofSignups, { n: formatPercent(step.fromStart, 1) })}
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
                        {t(d.funnel.stepConversion, { n: formatPercent(step.fromPrevious, 0) })}
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
          <span>{t(d.funnel.avgConvert, { n: data.avgDaysToConvert.toFixed(1) })}</span>
          <ArrowRight size={13} className="text-slate-300" />
          <span>{t(d.funnel.window, { n: formatPercent(conversion, 0) })}</span>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={d.funnel.sources} hint={d.funnel.sourcesHint}>
          <ul className="space-y-3">
            {data.sources.map((source) => (
              <li key={source.source}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-slate-600">
                    {d.sources[source.source as keyof typeof d.sources] ?? source.source}
                  </span>
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

        <SectionCard title={d.funnel.tips} hint={d.funnel.tipsHint}>
          <ul className="space-y-3 text-[12px] leading-relaxed text-slate-500">
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">{d.funnel.tip1Title}</strong> {d.funnel.tip1Text}
            </li>
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">{d.funnel.tip2Title}</strong> {d.funnel.tip2Text}
            </li>
            <li className="rounded-xl border border-line-soft bg-slate-50/60 p-3">
              <strong className="font-semibold text-ink">{d.funnel.tip3Title}</strong> {d.funnel.tip3Text}
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
