import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getRevenue, type RevenueRange } from "@/lib/analytics";
import { formatDate, formatMoney } from "@/lib/format";
import { getDict, getLocale, t } from "@/lib/i18n";
import { AreaChart, MovementBars } from "@/components/charts";
import { Badge, EmptyState, Kpi, Notice, PageHeader, SectionCard } from "@/components/ui";

const RANGES: RevenueRange[] = ["3m", "6m", "12m"];

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);

  const range = (RANGES.find((item) => item === params.range) ?? "6m") as RevenueRange;
  const data = await getRevenue(range, locale);

  const netNew = data.newMrr + data.expansion - data.contraction - data.churnMrr;
  const churnPct = data.currentMrr ? (data.churnMrr / data.currentMrr) * 100 : 0;

  const legend = [
    { key: "new", label: d.overview.movementNew, color: "#12B76A" },
    { key: "expansion", label: d.overview.movementExpansion, color: "#6366F1" },
    { key: "contraction", label: d.overview.movementContraction, color: "#F79009" },
    { key: "churn", label: d.overview.movementChurn, color: "#F04438" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.revenue.title}
        actions={
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
            {RANGES.map((item) => (
              <Link
                key={item}
                href={`/app/revenue?range=${item}`}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  item === range ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                }`}
              >
                {d.revenue.ranges[item]}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={d.revenue.currentMrr}
          value={formatMoney(data.currentMrr)}
          hint={
            data.startMrr > 0
              ? `${formatMoney(data.startMrr, { compact: true })} ${d.revenue.atStart}`
              : d.revenue.launchYear
          }
          change={{
            text: `${netNew >= 0 ? "+" : ""}${formatMoney(netNew, { compact: true })}`,
            tone: netNew >= 0 ? "good" : "bad",
          }}
        />
        <Kpi
          label={d.revenue.newMrr}
          value={formatMoney(data.newMrr)}
          hint={`${formatMoney(data.expansion)} ${d.revenue.expansionHint}`}
          change={{ text: d.revenue.grossAdds, tone: "brand" }}
        />
        <Kpi
          label={d.revenue.churnedMrr}
          value={formatMoney(data.churnMrr)}
          hint={`${churnPct.toFixed(1)}% ${d.revenue.ofCurrent}`}
        />
        <Kpi
          label={d.revenue.nrr}
          value={`${data.nrr30.toFixed(0)}%`}
          hint={d.revenue.last30}
          change={{
            text: data.nrr30 >= 100 ? d.revenue.above100 : d.revenue.below100,
            tone: data.nrr30 >= 100 ? "good" : "warn",
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title={d.revenue.mrrChart}
        >
          <AreaChart data={data.mrrSeries} height={250} />
        </SectionCard>

        <SectionCard title={d.revenue.movement} hint={t(d.revenue.movementHint, { n: data.months })}>
          <ul className="space-y-4">
            {[
              { label: d.overview.movementNew, value: data.newMrr, color: "#12B76A", sign: "+" },
              { label: d.overview.movementExpansion, value: data.expansion, color: "#6366F1", sign: "+" },
              { label: d.overview.movementContraction, value: data.contraction, color: "#F79009", sign: "−" },
              { label: d.overview.movementChurn, value: data.churnMrr, color: "#F04438", sign: "−" },
            ].map((item) => {
              const max = Math.max(data.newMrr, data.expansion, data.contraction, data.churnMrr, 1);
              return (
                <li key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="font-medium text-ink">
                      {item.sign}
                      {formatMoney(item.value)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.revenue.netNew}</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-ink">
              {netNew >= 0 ? (
                <ArrowUpRight size={16} className="text-good" />
              ) : (
                <ArrowDownRight size={16} className="text-bad" />
              )}
              {formatMoney(netNew)}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={d.revenue.movementBars}
        actions={
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {legend.map((item) => (
              <span key={item.key} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        }
      >
        <MovementBars data={data.movement} height={250} />
      </SectionCard>

      <SectionCard title={d.revenue.latestInvoices} bodyClassName="p-0">
        {data.invoices.length === 0 ? (
          <EmptyState title={d.revenue.latestInvoices} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="table-head px-5 py-2.5">{d.revenue.cols.customer}</th>
                  <th className="table-head px-3 py-2.5">{d.revenue.cols.company}</th>
                  <th className="table-head px-3 py-2.5">{d.revenue.cols.date}</th>
                  <th className="table-head px-3 py-2.5">{d.revenue.cols.status}</th>
                  <th className="table-head px-5 py-2.5 text-right">{d.revenue.cols.amount}</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-line-soft last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/app/customers/${invoice.customerId}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {invoice.customerName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{invoice.company}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-500">
                      {formatDate(invoice.createdAt, locale)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={
                          invoice.status === "paid" ? "good" : invoice.status === "open" ? "warn" : "muted"
                        }
                      >
                        {d.revenue.invoiceStatus[invoice.status as keyof typeof d.revenue.invoiceStatus] ??
                          invoice.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-ink">
                      {formatMoney(invoice.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {data.nrr < 100 ? <Notice tone="warn">{d.revenue.nrrNotice}</Notice> : null}
    </div>
  );
}
