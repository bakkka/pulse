import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getRevenue, type RevenueRange } from "@/lib/analytics";
import { formatDate, formatMoney } from "@/lib/format";
import { AreaChart, MovementBars } from "@/components/charts";
import { Badge, EmptyState, Kpi, Notice, PageHeader, SectionCard } from "@/components/ui";

const RANGES: { key: RevenueRange; label: string }[] = [
  { key: "3m", label: "3 months" },
  { key: "6m", label: "6 months" },
  { key: "12m", label: "12 months" },
];

const LEGEND = [
  { key: "new", label: "New", color: "#12B76A" },
  { key: "expansion", label: "Expansion", color: "#6366F1" },
  { key: "contraction", label: "Contraction", color: "#F79009" },
  { key: "churn", label: "Churn", color: "#F04438" },
] as const;

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (RANGES.find((item) => item.key === params.range)?.key ?? "6m") as RevenueRange;
  const data = await getRevenue(range);

  const netNew = data.newMrr + data.expansion - data.contraction - data.churnMrr;
  const churnPct = data.currentMrr ? (data.churnMrr / data.currentMrr) * 100 : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revenue"
        subtitle="How recurring revenue moves month over month"
        actions={
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
            {RANGES.map((item) => (
              <Link
                key={item.key}
                href={`/app/revenue?range=${item.key}`}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                  item.key === range ? "bg-ink text-white" : "text-slate-500 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Current MRR"
          value={formatMoney(data.currentMrr)}
          hint={data.startMrr > 0 ? `${formatMoney(data.startMrr, { compact: true })} at period start` : "launch year — no MRR at start"}
          change={{
            text: `${netNew >= 0 ? "+" : ""}${formatMoney(netNew, { compact: true })}`,
            tone: netNew >= 0 ? "good" : "bad",
          }}
        />
        <Kpi
          label="New MRR"
          value={formatMoney(data.newMrr)}
          hint={`${formatMoney(data.expansion)} expansion`}
          change={{ text: "Gross adds", tone: "brand" }}
        />
        <Kpi
          label="Churned MRR"
          value={formatMoney(data.churnMrr)}
          hint={`${churnPct.toFixed(1)}% of current MRR`}
          change={{ text: `${churnPct.toFixed(1)}% of start`, tone: churnPct < 5 ? "good" : "bad" }}
        />
        <Kpi
          label="Net revenue retention"
          value={`${data.nrr30.toFixed(0)}%`}
          hint="last 30 days"
          change={{ text: data.nrr30 >= 100 ? "Above 100%" : "Below 100%", tone: data.nrr30 >= 100 ? "good" : "warn" }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="MRR"
          hint="Recurring revenue at each month end"
          actions={<Badge tone="brand">{formatMoney(data.currentMrr)}</Badge>}
        >
          <AreaChart data={data.mrrSeries} height={250} />
        </SectionCard>

        <SectionCard title="Movement" hint={`Last ${data.months} months`}>
          <ul className="space-y-4">
            {[
              { label: "New", value: data.newMrr, color: "#12B76A", sign: "+" },
              { label: "Expansion", value: data.expansion, color: "#6366F1", sign: "+" },
              { label: "Contraction", value: data.contraction, color: "#F79009", sign: "−" },
              { label: "Churn", value: data.churnMrr, color: "#F04438", sign: "−" },
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
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Net new MRR</p>
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
        title="MRR movement"
        hint="Adds above the line, losses below it"
        actions={
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {LEGEND.map((item) => (
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

      <SectionCard title="Latest invoices" hint="Most recent billing activity" bodyClassName="p-0">
        {data.invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="table-head px-5 py-2.5">Customer</th>
                  <th className="table-head px-3 py-2.5">Company</th>
                  <th className="table-head px-3 py-2.5">Date</th>
                  <th className="table-head px-3 py-2.5">Status</th>
                  <th className="table-head px-5 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-line-soft last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/app/customers/${invoice.customerId}`} className="font-medium text-ink hover:text-brand">
                        {invoice.customerName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{invoice.company}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-500">{formatDate(invoice.createdAt)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={invoice.status === "paid" ? "good" : invoice.status === "open" ? "warn" : "muted"}>
                        {invoice.status}
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

      {data.nrr < 100 ? (
        <Notice tone="warn">
          Net revenue retention is below 100% — churn and contraction outweigh expansion this period.
        </Notice>
      ) : null}
    </div>
  );
}
