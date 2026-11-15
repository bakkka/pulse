import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  Globe2,
  Mail,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { getCustomerDetail } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { canEdit, requireMember } from "@/lib/auth";
import { formatDate, formatDateTime, formatDays, formatMoney, formatShortDate } from "@/lib/format";
import { getDict, getLocale, t } from "@/lib/i18n";
import { updateCustomerPlan } from "@/app/actions";
import { AreaChart } from "@/components/charts";
import {
  Avatar,
  Badge,
  Field,
  Notice,
  PageHeader,
  PlanBadge,
  SectionCard,
  StatusBadge,
} from "@/components/ui";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  signup: <Sparkles size={13} />,
  activated: <Zap size={13} />,
  project_created: <Building2 size={13} />,
  invited_team: <UserRound size={13} />,
  paid: <CreditCard size={13} />,
  session: <Zap size={13} />,
};

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  const { ok } = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);
  const member = await requireMember();
  const editable = canEdit(member.role);

  const [detail, plans] = await Promise.all([
    getCustomerDetail(id),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
  ]);
  if (!detail) notFound();

  const { customer } = detail;
  const invoiceCurve = [...customer.invoices]
    .reverse()
    .map((invoice) => ({ label: formatShortDate(invoice.createdAt, locale), value: invoice.amountCents }));

  const eventLabel = (name: string) =>
    d.events[name as keyof typeof d.events] ?? { title: name, hint: "" };

  return (
    <div className="space-y-5">
      <Link
        href="/app/customers"
        className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 transition hover:text-ink"
      >
        <ArrowLeft size={13} />
        {d.customer.back}
      </Link>

      {ok === "saved" ? <Notice tone="good">{d.customer.updated}</Notice> : null}

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={customer.name} hue={238} className="h-14 w-14 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{customer.name}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 size={12} />
              {customer.company}
            </span>
            <span className="flex items-center gap-1">
              <Mail size={12} />
              {customer.email}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanBadge name={customer.plan.name} color={customer.plan.color} />
          <StatusBadge status={customer.status} label={d.status[customer.status as keyof typeof d.status]} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.customer.mrr}</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {customer.mrrCents ? formatMoney(customer.mrrCents) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.customer.lifetime}</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {formatDays(detail.lifetimeDays, locale)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.customer.invoices}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{detail.invoiceCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{d.customer.totalPaid}</p>
          <p className="mt-1 text-xl font-semibold text-ink">{formatMoney(detail.totalPaid)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title={d.customer.billing}
            hint={`${detail.invoiceCount} ${
              detail.invoiceCount === 1 ? d.customer.invoiceCountOne : d.customer.invoiceCount
            }`}
            bodyClassName="p-0"
          >
            {customer.invoices.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">{d.customer.noInvoices}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head px-5 py-2.5">{d.customer.cols.date}</th>
                      <th className="table-head px-3 py-2.5">{d.customer.cols.period}</th>
                      <th className="table-head px-3 py-2.5">{d.customer.cols.status}</th>
                      <th className="table-head px-5 py-2.5 text-right">{d.customer.cols.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-line-soft last:border-0">
                        <td className="px-5 py-2.5 text-[12px] text-slate-600">
                          {formatDate(invoice.createdAt, locale)}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-400">
                          {formatShortDate(invoice.periodStart, locale)} –{" "}
                          {formatShortDate(invoice.periodEnd, locale)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            tone={
                              invoice.status === "paid"
                                ? "good"
                                : invoice.status === "open"
                                  ? "warn"
                                  : "muted"
                            }
                          >
                            {d.revenue.invoiceStatus[
                              invoice.status as keyof typeof d.revenue.invoiceStatus
                            ] ?? invoice.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-ink">
                          {formatMoney(invoice.amountCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {invoiceCurve.length >= 2 ? (
            <SectionCard title={d.customer.invoiceChart} hint={d.customer.invoiceChartHint}>
              <AreaChart data={invoiceCurve} height={200} />
            </SectionCard>
          ) : null}

          <SectionCard title={d.customer.activity} hint={d.customer.activityHint} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {customer.events.map((event) => {
                const meta = eventLabel(event.name);
                return (
                  <li key={event.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {EVENT_ICONS[event.name] ?? <Zap size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{meta.title}</p>
                      <p className="text-[11px] text-slate-400">{meta.hint}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatDateTime(event.createdAt, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title={d.customer.account} bodyClassName="p-0">
            <dl className="divide-y divide-line-soft text-[12px]">
              {[
                { icon: <Globe2 size={12} />, label: d.customer.country, value: customer.country },
                {
                  icon: <CalendarDays size={12} />,
                  label: d.customer.joined,
                  value: formatDate(customer.createdAt, locale),
                },
                {
                  icon: <Zap size={12} />,
                  label: d.customer.activated,
                  value: customer.activatedAt ? formatDate(customer.activatedAt, locale) : "—",
                },
                {
                  icon: <UserRound size={12} />,
                  label: d.customer.owner,
                  value: customer.owner?.name ?? d.customer.unassigned,
                },
                {
                  icon: <CreditCard size={12} />,
                  label: d.customer.eventsCount,
                  value: String(detail.eventCount),
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <dt className="flex items-center gap-1.5 text-slate-400">
                    {row.icon}
                    {row.label}
                  </dt>
                  <dd className="font-medium text-ink-700">{row.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard
            title={d.customer.plan}
            hint={editable ? d.customer.planHint : d.customer.planHintReadOnly}
          >
            {editable ? (
              <form action={updateCustomerPlan} className="space-y-3">
                <input type="hidden" name="customerId" value={customer.id} />
                <Field label={d.customer.plan}>
                  <select className="input" name="planCode" defaultValue={customer.planCode}>
                    {plans.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.name} — {formatMoney(plan.priceCents)}
                      </option>
                    ))}
                  </select>
                </Field>
                <button type="submit" className="btn btn-primary w-full">
                  {d.customer.updatePlan}
                </button>
              </form>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                {t(d.customer.readOnlyNote, {
                  role: d.roles[member.role as keyof typeof d.roles] ?? member.role,
                })}
              </p>
            )}
          </SectionCard>

          {customer.churnedAt ? (
            <SectionCard title={d.customer.churn}>
              <p className="text-[12px] text-slate-500">
                {t(d.customer.churnedOn, { date: formatDate(customer.churnedAt, locale) })}
              </p>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
