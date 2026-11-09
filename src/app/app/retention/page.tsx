import { Info } from "lucide-react";
import { getRetention } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";
import { AreaChart } from "@/components/charts";
import { Kpi, PageHeader, SectionCard } from "@/components/ui";

function cellStyle(value: number) {
  const alpha = Math.min(0.88, 0.05 + (value / 100) * 0.85);
  return {
    backgroundColor: `rgba(79,70,229,${alpha})`,
    color: value >= 55 ? "#ffffff" : value >= 25 ? "#312E81" : "#475467",
  };
}

export default async function RetentionPage() {
  const data = await getRetention();

  const lastFilled = data.average.reduce<number>(
    (last, value, index) => (value !== null ? index : last),
    0,
  );
  const curve = data.average
    .slice(0, lastFilled + 1)
    .map((value, index) => ({ label: `M${index}`, value: value ?? 0 }));

  const at = (index: number) => data.average[index];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Retention"
        subtitle="Do customers keep coming back?"
        actions={<span className="chip">Monthly cohorts · 12 periods</span>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Month 1 retention"
          value={at(1) !== null && at(1) !== undefined ? formatPercent(at(1) as number, 0) : "—"}
          hint="active one month after signup"
        />
        <Kpi
          label="Month 3 retention"
          value={at(3) !== null && at(3) !== undefined ? formatPercent(at(3) as number, 0) : "—"}
          hint="still active after a quarter"
        />
        <Kpi
          label="Month 6 retention"
          value={at(6) !== null && at(6) !== undefined ? formatPercent(at(6) as number, 0) : "—"}
          hint="half-year mark"
        />
        <Kpi
          label="Month 12 retention"
          value={at(11) !== null && at(11) !== undefined ? formatPercent(at(11) as number, 0) : "—"}
          hint="annual stickiness"
        />
      </div>

      <SectionCard
        title="Cohort retention"
        hint="Share of each signup cohort with at least one session in the month"
        actions={
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>0%</span>
            <span className="h-2 w-16 rounded-full bg-gradient-to-r from-indigo-50 to-indigo-600" />
            <span>100%</span>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 px-3 py-3 text-[11px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Cohort
                </th>
                <th className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Size</th>
                {Array.from({ length: data.periods }, (_, index) => (
                  <th key={index} className="px-1 py-1 text-center text-[10px] font-semibold text-slate-400">
                    M{index}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((cohort) => (
                <tr key={cohort.key}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 text-[12px] font-medium text-ink-700">
                    {cohort.label}
                  </td>
                  <td className="px-1 py-1 text-center text-[11px] text-slate-400">{formatNumber(cohort.size)}</td>
                  {cohort.values.map((value, index) => (
                    <td key={index} className="p-0">
                      {value === null ? (
                        <div className="h-8 rounded-md bg-slate-50/60" />
                      ) : (
                        <div
                          className="flex h-8 min-w-[38px] items-center justify-center rounded-md text-[11px] font-semibold tabular-nums"
                          style={cellStyle(value)}
                          title={`${cohort.label} · M${index}: ${value}%`}
                        >
                          {value}%
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Average retention curve" hint="Weighted across all cohorts">
          <AreaChart data={curve} format="percent" height={240} color="#4F46E5" />
        </SectionCard>

        <SectionCard title="How this is calculated" hint="No vanity numbers">
          <div className="flex gap-2.5 text-[12px] leading-relaxed text-slate-500">
            <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <div className="space-y-2">
              <p>
                Each row is a signup cohort. A customer counts as retained in month N if they had at
                least one product session during that month.
              </p>
              <p>
                The curve is weighted by cohort size, so a large recent cohort does not get hidden by
                a tiny old one.
              </p>
              <p className="text-slate-400">
                Data source: <span className="font-mono text-[11px]">Event</span> rows of type{" "}
                <span className="font-mono text-[11px]">session</span>.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
