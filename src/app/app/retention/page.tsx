import { getRetention } from "@/lib/analytics";
import { formatNumber, formatPercent } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
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
  const locale = await getLocale();
  const d = getDict(locale);
  const data = await getRetention(locale);

  const lastFilled = data.average.reduce<number>(
    (last, value, index) => (value !== null ? index : last),
    0,
  );
  const curve = data.average
    .slice(0, lastFilled + 1)
    .map((value, index) => ({ label: `M${index}`, value: value ?? 0 }));

  const at = (index: number) => {
    const value = data.average[index];
    return value === null || value === undefined ? "—" : formatPercent(value, 0);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.retention.title}
        actions={<span className="chip">{d.retention.chip}</span>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={d.retention.m1} value={at(1)} hint={d.retention.m1Hint} />
        <Kpi label={d.retention.m3} value={at(3)} hint={d.retention.m3Hint} />
        <Kpi label={d.retention.m6} value={at(6)} hint={d.retention.m6Hint} />
        <Kpi label={d.retention.m12} value={at(11)} hint={d.retention.m12Hint} />
      </div>

      <SectionCard
        title={d.retention.heatmap}
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
                  {d.retention.cohort}
                </th>
                <th className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {d.retention.size}
                </th>
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
                  <td className="px-1 py-1 text-center text-[11px] text-slate-400">
                    {formatNumber(cohort.size)}
                  </td>
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
        <SectionCard className="lg:col-span-2" title={d.retention.curve} hint={d.retention.curveHint}>
          <AreaChart data={curve} format="percent" height={240} color="#4F46E5" />
        </SectionCard>

        <SectionCard title={d.retention.how}>
          <div className="space-y-2 text-[12px] leading-relaxed text-slate-500">
            <p>{d.retention.howP1}</p>
            <p>{d.retention.howP2}</p>
            <p className="text-slate-400">{d.retention.howP3}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
