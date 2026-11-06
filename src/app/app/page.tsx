import Link from "next/link";
import { ArrowUpRight, CircleDot } from "lucide-react";
import { getOverview } from "@/lib/analytics";
import { formatMoney, formatNumber, formatPercent, formatRelative } from "@/lib/format";
import { AreaChart, Donut, MovementBars, Sparkline } from "@/components/charts";
import { Avatar, Badge, EmptyState, Kpi, PageHeader, PlanBadge, SectionCard } from "@/components/ui";

const MOVEMENT_LEGEND = [
  { key: "new", label: "New", color: "#12B76A" },
  { key: "expansion", label: "Expansion", color: "#6366F1" },
  { key: "contraction", label: "Contraction", color: "#F79009" },
  { key: "churn", label: "Churn", color: "#F04438" },
] as const;

export default async function OverviewPage() {
  const data = await getOverview();
  const revenueTotal = data.revenueSeries.reduce((sum, point) => sum + point.value, 0);
  const mrrSpark = data.mrrSeries.map((point) => point.value);
  const activeSpark = data.activeSeries.map((point) => point.value);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        subtitle="How the business is doing right now"
        actions={
          <>
            <Badge tone="neutral">Last 12 months</Badge>
            <Link href="/app/revenue" className="btn btn-ghost btn-sm">
              Revenue report
              <ArrowUpRight size={13} />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Monthly recurring revenue"
          value={formatMoney(data.mrr)}
          hint="vs. 30 days ago"
          change={{
            text: `${data.mrrDelta >= 0 ? "+" : ""}${data.mrrDelta.toFixed(1)}%`,
            tone: data.mrrDelta >= 0 ? "good" : "bad",
          }}
        >
          <Sparkline values={mrrSpark} color="#4F46E5" />
        </Kpi>

        <Kpi
          label="Active customers"
          value={formatNumber(data.activeCustomers)}
          hint={`${formatNumber(data.totalAccounts)} accounts total`}
          change={{
            text: `${data.activeDelta >= 0 ? "+" : ""}${data.activeDelta.toFixed(1)}%`,
            tone: data.activeDelta >= 0 ? "good" : "bad",
          }}
        >
          <Sparkline values={activeSpark} color="#12B76A" />
        </Kpi>

        <Kpi
          label="Churn rate"
          value={formatPercent(data.churnRate)}
          hint="last 30 days"
          change={{
            text: `${data.churnDelta >= 0 ? "+" : ""}${data.churnDelta.toFixed(1)}pp`,
            tone: data.churnDelta <= 0 ? "good" : "bad",
          }}
        >
          <Sparkline values={data.churnSeries.map((point) => point.value)} color="#F04438" />
        </Kpi>

        <Kpi
          label="Net revenue retention"
          value={formatPercent(data.nrr, 0)}
          hint="last 30 days"
          change={{
            text: `${data.nrrDelta >= 0 ? "+" : ""}${data.nrrDelta.toFixed(1)}pp`,
            tone: data.nrrDelta >= 0 ? "good" : "bad",
          }}
        >
          <Sparkline values={data.nrrSeries.map((point) => point.value)} color="#7C3AED" />
        </Kpi>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Revenue"
          hint="Paid invoices, last 12 months"
          actions={<Badge tone="brand">{formatMoney(revenueTotal)}</Badge>}
        >
          <AreaChart data={data.revenueSeries} height={250} />
        </SectionCard>

        <SectionCard title="Plan mix" hint="Active customers by plan">
          <div className="flex flex-col items-center gap-4">
            <Donut
              slices={data.planMix.map((plan) => ({
                label: plan.name,
                value: plan.count,
                color: plan.color,
              }))}
              centerValue={formatNumber(data.activeCustomers)}
              centerLabel="customers"
              size={148}
            />
            <ul className="w-full space-y-2.5">
              {data.planMix.map((plan) => (
                <li key={plan.code} className="flex items-center gap-2 text-[13px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-ink-700">{plan.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-slate-500">
                    {formatNumber(plan.count)}
                  </span>
                  <span className="w-16 text-right text-[11px] text-slate-400">
                    {formatMoney(plan.mrr, { compact: true })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2 lg:h-[420px]"
          title="MRR movement"
          hint="New, expansion, contraction and churn by month"
          actions={
            <div className="hidden flex-wrap items-center gap-2 sm:flex">
              {MOVEMENT_LEGEND.map((item) => (
                <span key={item.key} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          }
        >
          <MovementBars data={data.movement} height={300} />
        </SectionCard>

        <SectionCard
          className="lg:h-[420px]"
          title="Live activity"
          hint="Sessions in the last hour"
          actions={
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-good">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
              </span>
              {data.live.activeNow} active
            </span>
          }
          bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
        >
          {data.live.items.length === 0 ? (
            <EmptyState title="No sessions yet" text="Activity shows up here as customers open the app." />
          ) : (
            <ul
              className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto"
              style={{ maskImage: "linear-gradient(to bottom, black calc(100% - 26px), transparent)" }}
            >
              {data.live.items.map((event, index) => (
                <li key={event.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={event.name} hue={index % 2 === 0 ? 232 : 158} className="h-7 w-7 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink-700">
                      <span className="font-medium text-ink">{event.name}</span> opened the app
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{event.company}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{formatRelative(event.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Top customers"
        hint="Highest lifetime value among active accounts"
        actions={
          <Link href="/app/customers" className="text-[12px] font-medium text-brand hover:text-brand-hover">
            View all
          </Link>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head px-5 py-2.5">Customer</th>
                <th className="table-head px-3 py-2.5">Plan</th>
                <th className="table-head px-3 py-2.5">Lifetime</th>
                <th className="table-head px-5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((customer, index) => (
                <tr key={customer.id} className="border-b border-line-soft last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/app/customers/${customer.id}`} className="flex items-center gap-3">
                      <Avatar name={customer.name} hue={210 + index * 24} className="h-8 w-8 text-[11px]" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{customer.name}</span>
                        <span className="block truncate text-[11px] text-slate-400">{customer.company}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <PlanBadge
                      name={customer.planName}
                      color={
                        customer.planName === "Scale"
                          ? "#F79009"
                          : customer.planName === "Growth"
                            ? "#12B76A"
                            : "#6366F1"
                      }
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-ink">{formatMoney(customer.lifetimeCents)}</td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone="good">
                      <CircleDot size={9} />
                      Active
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
