import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCustomers } from "@/lib/analytics";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { Avatar, Badge, EmptyState, PageHeader, PlanBadge, StatusBadge, Tabs } from "@/components/ui";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);

  const q = (params.q ?? "").trim();
  const status = params.status ?? "";
  const plan = params.plan ?? "";
  const sort = params.sort ?? "recent";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const data = await getCustomers({ q, status, plan, sort, page });

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    const merged = { q, status, plan, sort, page: 1, ...overrides };
    if (merged.q) search.set("q", String(merged.q));
    if (merged.status) search.set("status", String(merged.status));
    if (merged.plan) search.set("plan", String(merged.plan));
    if (merged.sort && merged.sort !== "recent") search.set("sort", String(merged.sort));
    if (Number(merged.page) > 1) search.set("page", String(merged.page));
    const query = search.toString();
    return `/app/customers${query ? `?${query}` : ""}`;
  };

  const statusTabs = [
    { key: "", label: d.customers.tabs.all },
    { key: "active", label: d.customers.tabs.active },
    { key: "trialing", label: d.customers.tabs.trialing },
    { key: "churned", label: d.customers.tabs.churned },
    { key: "lead", label: d.customers.tabs.lead },
  ];

  const exportQuery = new URLSearchParams();
  if (q) exportQuery.set("q", q);
  if (status) exportQuery.set("status", status);
  if (plan) exportQuery.set("plan", plan);

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.customers.title}
        subtitle={`${formatNumber(data.total)} ${d.customers.subtitle}`}
        actions={
          <a href={`/api/export/customers?${exportQuery.toString()}`} className="btn btn-ghost btn-sm">
            {d.customers.export}
          </a>
        }
      />

      <div className="card overflow-hidden">
        <div className="px-4 pt-1">
          <Tabs
            current={buildHref({ status })}
            items={statusTabs.map((item) => ({
              href: buildHref({ status: item.key, page: 1 }),
              label: item.label,
              count: data.counts[item.key || "all"] ?? 0,
            }))}
          />
        </div>

        <form method="get" className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <input type="hidden" name="status" value={status} />
          <input
            className="input min-w-[220px] flex-1"
            name="q"
            defaultValue={q}
            placeholder={d.customers.searchPlaceholder}
            autoComplete="off"
          />
          <select className="input w-auto min-w-[140px]" name="plan" defaultValue={plan}>
            <option value="">{d.customers.allPlans}</option>
            {data.plans.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <select className="input w-auto min-w-[160px]" name="sort" defaultValue={sort}>
            <option value="recent">{d.customers.sortRecent}</option>
            <option value="mrr">{d.customers.sortMrr}</option>
            <option value="name">{d.customers.sortName}</option>
          </select>
          <button type="submit" className="btn btn-ghost">
            {d.common.apply}
          </button>
        </form>

        {data.rows.length === 0 ? (
          <EmptyState title={d.customers.empty} text={d.customers.emptyText} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="table-head px-5 py-2.5">{d.customers.cols.customer}</th>
                    <th className="table-head px-3 py-2.5">{d.customers.cols.plan}</th>
                    <th className="table-head px-3 py-2.5">{d.customers.cols.status}</th>
                    <th className="table-head px-3 py-2.5">{d.customers.cols.mrr}</th>
                    <th className="table-head px-3 py-2.5">{d.customers.cols.country}</th>
                    <th className="table-head px-3 py-2.5">{d.customers.cols.joined}</th>
                    <th className="table-head px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((customer, index) => (
                    <tr key={customer.id} className="border-b border-line-soft last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/app/customers/${customer.id}`} className="flex items-center gap-3">
                          <Avatar name={customer.name} hue={(index * 47 + 210) % 360} className="h-8 w-8 text-[11px]" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{customer.name}</span>
                            <span className="block truncate text-[11px] text-slate-400">{customer.company}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {customer.status === "lead" ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <PlanBadge name={customer.plan.name} color={customer.plan.color} />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge
                          status={customer.status}
                          label={d.status[customer.status as keyof typeof d.status]}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-ink">
                        {customer.mrrCents ? formatMoney(customer.mrrCents) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-[12px] uppercase text-slate-500">{customer.country}</td>
                      <td className="px-3 py-3 text-[12px] text-slate-500">
                        {formatDate(customer.createdAt, locale)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/app/customers/${customer.id}`}
                          aria-label={customer.name}
                          className="inline-flex rounded-md border border-line p-1 text-slate-400 transition hover:border-brand/40 hover:text-brand"
                        >
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line-soft md:hidden">
              {data.rows.map((customer, index) => (
                <li key={customer.id}>
                  <Link href={`/app/customers/${customer.id}`} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={customer.name} hue={(index * 47 + 210) % 360} className="h-8 w-8 text-[11px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{customer.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{customer.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {customer.status === "lead" ? null : (
                        <PlanBadge name={customer.plan.name} color={customer.plan.color} />
                      )}
                      <span className="text-[11px] font-medium text-ink-700">
                        {customer.mrrCents ? formatMoney(customer.mrrCents) : "—"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[12px] text-slate-500">
          <span>
            {d.customers.showing} {formatNumber((data.page - 1) * data.pageSize + 1)}–
            {formatNumber(Math.min(data.page * data.pageSize, data.total))} {d.common.of}{" "}
            {formatNumber(data.total)}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={buildHref({ page: data.page - 1 })}
              className={`inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 transition ${
                data.page <= 1 ? "pointer-events-none opacity-40" : "hover:border-brand/40 hover:text-brand"
              }`}
            >
              <ChevronLeft size={13} />
              {d.common.prev}
            </Link>
            <span className="font-mono text-[11px] text-slate-400">
              {data.page} / {data.pages}
            </span>
            <Link
              href={buildHref({ page: data.page + 1 })}
              className={`inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 transition ${
                data.page >= data.pages ? "pointer-events-none opacity-40" : "hover:border-brand/40 hover:text-brand"
              }`}
            >
              {d.common.next}
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">{d.customers.tip}</p>
    </div>
  );
}
