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
import { canEdit } from "@/lib/auth";
import { requireMember } from "@/lib/auth";
import { formatDate, formatDateTime, formatMoney, formatShortDate } from "@/lib/format";
import { updateCustomerPlan } from "@/app/actions";
import { AreaChart } from "@/components/charts";
import { Avatar, Badge, Field, Notice, PageHeader, PlanBadge, SectionCard, StatusBadge } from "@/components/ui";

const EVENT_META: Record<string, { icon: React.ReactNode; title: string; hint: string }> = {
  signup: { icon: <Sparkles size={13} />, title: "Signed up", hint: "account created" },
  activated: { icon: <Zap size={13} />, title: "Activated", hint: "completed onboarding" },
  project_created: { icon: <Building2 size={13} />, title: "Created a project", hint: "first value moment" },
  invited_team: { icon: <UserRound size={13} />, title: "Invited a teammate", hint: "team expansion" },
  paid: { icon: <CreditCard size={13} />, title: "Converted to paid", hint: "first invoice" },
  session: { icon: <Zap size={13} />, title: "Opened the app", hint: "product session" },
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
  const member = await requireMember();
  const editable = canEdit(member.role);

  const [detail, plans] = await Promise.all([getCustomerDetail(id), prisma.plan.findMany({ orderBy: { sort: "asc" } })]);
  if (!detail) notFound();

  const { customer } = detail;
  const invoiceCurve = [...customer.invoices]
    .reverse()
    .map((invoice) => ({ label: formatShortDate(invoice.createdAt), value: invoice.amountCents }));

  return (
    <div className="space-y-5">
      <Link href="/app/customers" className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 transition hover:text-ink">
        <ArrowLeft size={13} />
        Customers
      </Link>

      {ok === "saved" ? <Notice tone="good">Customer updated.</Notice> : null}

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
          <StatusBadge status={customer.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Current MRR</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {customer.mrrCents ? formatMoney(customer.mrrCents) : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Lifetime</p>
          <p className="mt-1 text-xl font-semibold text-ink">{detail.lifetimeDays} days</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Invoices</p>
          <p className="mt-1 text-xl font-semibold text-ink">{detail.invoiceCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Total paid</p>
          <p className="mt-1 text-xl font-semibold text-ink">{formatMoney(detail.totalPaid)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Billing history" hint={`${detail.invoiceCount} ${detail.invoiceCount === 1 ? "invoice" : "invoices"}`} bodyClassName="p-0">
            {customer.invoices.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="table-head px-5 py-2.5">Date</th>
                      <th className="table-head px-3 py-2.5">Period</th>
                      <th className="table-head px-3 py-2.5">Status</th>
                      <th className="table-head px-5 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-line-soft last:border-0">
                        <td className="px-5 py-2.5 text-[12px] text-slate-600">{formatDate(invoice.createdAt)}</td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-400">
                          {formatShortDate(invoice.periodStart)} – {formatShortDate(invoice.periodEnd)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={invoice.status === "paid" ? "good" : invoice.status === "open" ? "warn" : "muted"}>
                            {invoice.status}
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
            <SectionCard title="Invoice amount" hint="Last 12 billing periods">
              <AreaChart data={invoiceCurve} height={200} />
            </SectionCard>
          ) : null}

          <SectionCard title="Activity" hint="Product events for this account" bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {customer.events.map((event) => {
                const meta = EVENT_META[event.name] ?? {
                  icon: <Zap size={13} />,
                  title: event.name,
                  hint: "",
                };
                return (
                  <li key={event.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{meta.title}</p>
                      <p className="text-[11px] text-slate-400">{meta.hint}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(event.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Account" bodyClassName="p-0">
            <dl className="divide-y divide-line-soft text-[12px]">
              {[
                { icon: <Globe2 size={12} />, label: "Country", value: customer.country },
                { icon: <CalendarDays size={12} />, label: "Joined", value: formatDate(customer.createdAt) },
                {
                  icon: <Zap size={12} />,
                  label: "Activated",
                  value: customer.activatedAt ? formatDate(customer.activatedAt) : "—",
                },
                {
                  icon: <UserRound size={12} />,
                  label: "Owner",
                  value: customer.owner?.name ?? "Unassigned",
                },
                {
                  icon: <CreditCard size={12} />,
                  label: "Events",
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

          <SectionCard title="Plan" hint={editable ? "Changes take effect immediately" : "Read-only for your role"}>
            {editable ? (
              <form action={updateCustomerPlan} className="space-y-3">
                <input type="hidden" name="customerId" value={customer.id} />
                <Field label="Plan">
                  <select className="input" name="planCode" defaultValue={customer.planCode}>
                    {plans.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.name} — {formatMoney(plan.priceCents)}
                      </option>
                    ))}
                  </select>
                </Field>
                <button type="submit" className="btn btn-primary w-full">
                  Update plan
                </button>
              </form>
            ) : (
              <p className="text-[12px] leading-relaxed text-slate-500">
                Your role (<span className="font-medium text-ink-700">{member.role}</span>) can view
                accounts but not change them. Sign in as an owner or admin to edit.
              </p>
            )}
          </SectionCard>

          {customer.churnedAt ? (
            <SectionCard title="Churn">
              <p className="text-[12px] text-slate-500">
                Churned on <span className="font-medium text-ink-700">{formatDate(customer.churnedAt)}</span>.
              </p>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
