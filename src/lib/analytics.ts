import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { intlLocale, type Locale } from "@/lib/locale";

export const DAY = 86_400_000;

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function pctChange(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export type CoreCustomer = {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  planCode: string;
  status: string;
  mrrCents: number;
  createdAt: Date;
  churnedAt: Date | null;
};

type CoreInvoice = {
  id: string;
  customerId: string;
  amountCents: number;
  status: string;
  createdAt: Date;
};

type Core = {
  customers: CoreCustomer[];
  invoices: CoreInvoice[];
  byCustomer: Map<string, CoreInvoice[]>;
  prevAmount: Map<string, number>;
  firstInvoice: Map<string, CoreInvoice>;
  lastInvoice: Map<string, CoreInvoice>;
};

async function loadCore(): Promise<Core> {
  const [customers, invoices] = await Promise.all([
    prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        country: true,
        planCode: true,
        status: true,
        mrrCents: true,
        createdAt: true,
        churnedAt: true,
      },
    }),
    prisma.invoice.findMany({
      select: { id: true, customerId: true, amountCents: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byCustomer = new Map<string, CoreInvoice[]>();
  const prevAmount = new Map<string, number>();
  const firstInvoice = new Map<string, CoreInvoice>();
  const lastInvoice = new Map<string, CoreInvoice>();

  for (const invoice of invoices) {
    const list = byCustomer.get(invoice.customerId);
    if (!list) {
      byCustomer.set(invoice.customerId, [invoice]);
      firstInvoice.set(invoice.customerId, invoice);
    } else {
      prevAmount.set(invoice.id, list[list.length - 1].amountCents);
      list.push(invoice);
    }
    lastInvoice.set(invoice.customerId, invoice);
  }

  return { customers, invoices, byCustomer, prevAmount, firstInvoice, lastInvoice };
}

function mrrAt(core: Core, date: Date): number {
  let total = 0;
  for (const customer of core.customers) {
    if (customer.createdAt > date) continue;
    if (customer.churnedAt && customer.churnedAt <= date) continue;
    const list = core.byCustomer.get(customer.id);
    if (!list || list.length === 0) continue;

    let low = 0;
    let high = list.length - 1;
    let index = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (list[mid].createdAt <= date) {
        index = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (index >= 0) total += list[index].amountCents;
  }
  return total;
}

function activeAt(core: Core, date: Date): number {
  let total = 0;
  for (const customer of core.customers) {
    if (customer.createdAt > date) continue;
    if (customer.churnedAt && customer.churnedAt <= date) continue;
    const first = core.firstInvoice.get(customer.id);
    if (first && first.createdAt <= date) total += 1;
  }
  return total;
}

type Movement = { new: number; expansion: number; contraction: number; churn: number };

function movementBetween(core: Core, start: Date, end: Date): Movement {
  const result: Movement = { new: 0, expansion: 0, contraction: 0, churn: 0 };

  for (const invoice of core.invoices) {
    if (invoice.createdAt < start || invoice.createdAt >= end) continue;
    if (invoice.status === "void") continue;

    const previous = core.prevAmount.get(invoice.id);
    if (previous === undefined) {
      result.new += invoice.amountCents;
    } else if (invoice.amountCents > previous) {
      result.expansion += invoice.amountCents - previous;
    } else if (invoice.amountCents < previous) {
      result.contraction += previous - invoice.amountCents;
    }
  }

  for (const customer of core.customers) {
    if (!customer.churnedAt) continue;
    if (customer.churnedAt < start || customer.churnedAt >= end) continue;
    const last = core.lastInvoice.get(customer.id);
    if (last) result.churn += last.amountCents;
  }

  return result;
}

function churnRateBetween(core: Core, start: Date, end: Date): number {
  const opening = activeAt(core, start);
  if (!opening) return 0;
  let churned = 0;
  for (const customer of core.customers) {
    if (!customer.churnedAt) continue;
    if (customer.churnedAt < start || customer.churnedAt >= end) continue;
    if (core.firstInvoice.has(customer.id)) churned += 1;
  }
  return (churned / opening) * 100;
}

function monthPoints(count: number, now = new Date(), locale: Locale = "en"): { start: Date; end: Date; label: string }[] {
  const current = startOfMonth(now);
  const points = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = addMonths(current, -i);
    const end = i === 0 ? now : endOfMonth(start);
    points.push({
      start,
      end,
      label: new Intl.DateTimeFormat(intlLocale(locale), { month: "short" })
        .format(start)
        .replace(/\.$/, ""),
    });
  }
  return points;
}

export type SeriesPoint = { label: string; value: number };
export type MovementPoint = { label: string; new: number; expansion: number; contraction: number; churn: number };

export type OverviewData = {
  mrr: number;
  mrrDelta: number;
  activeCustomers: number;
  activeDelta: number;
  churnRate: number;
  churnDelta: number;
  nrr: number;
  nrrDelta: number;
  arpa: number;
  revenue: number;
  revenueSeries: SeriesPoint[];
  mrrSeries: SeriesPoint[];
  activeSeries: SeriesPoint[];
  churnSeries: SeriesPoint[];
  nrrSeries: SeriesPoint[];
  movement: MovementPoint[];
  planMix: { code: string; name: string; color: string; count: number; mrr: number }[];
  topCustomers: {
    id: string;
    name: string;
    company: string;
    planName: string;
    lifetimeCents: number;
  }[];
  live: {
    activeNow: number;
    items: { id: string; customerId: string; name: string; company: string; createdAt: Date }[];
  };
  totalAccounts: number;
};

export async function getOverview(locale: Locale = "en"): Promise<OverviewData> {
  const now = new Date();
  const core = await loadCore();
  const [plans, liveEvents, activeNowGroups] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.event.findMany({
      where: { name: "session", createdAt: { gte: new Date(now.getTime() - 24 * 3_600_000) } },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { customer: { select: { name: true, company: true } } },
    }),
    prisma.event.groupBy({
      by: ["customerId"],
      where: { name: "session", createdAt: { gte: new Date(now.getTime() - 24 * 3_600_000) } },
    }),
  ]);

  const mrr = mrrAt(core, now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const mrrPrevious = mrrAt(core, thirtyDaysAgo);

  const activeCustomers = activeAt(core, now);
  const activePrevious = activeAt(core, thirtyDaysAgo);

  const churnRate = churnRateBetween(core, thirtyDaysAgo, now);
  const previousChurn = churnRateBetween(core, new Date(thirtyDaysAgo.getTime() - 30 * DAY), thirtyDaysAgo);

  const startMrr = mrrAt(core, thirtyDaysAgo);
  const moved = movementBetween(core, thirtyDaysAgo, now);
  const nrr = startMrr
    ? ((startMrr + moved.expansion - moved.contraction - moved.churn) / startMrr) * 100
    : 100;

  const prevStart = new Date(thirtyDaysAgo.getTime() - 30 * DAY);
  const prevMoved = movementBetween(core, prevStart, thirtyDaysAgo);
  const prevNrr = mrrPrevious
    ? ((mrrPrevious + prevMoved.expansion - prevMoved.contraction - prevMoved.churn) / mrrPrevious) * 100
    : 100;

  const months = monthPoints(12, new Date(startOfMonth(now).getTime() - 1), locale);
  const revenueSeries: SeriesPoint[] = months.map((point) => ({
    label: point.label,
    value: core.invoices
      .filter((invoice) => invoice.status === "paid" && invoice.createdAt >= point.start && invoice.createdAt <= point.end)
      .reduce((sum, invoice) => sum + invoice.amountCents, 0),
  }));

  const movement: MovementPoint[] = months.slice(-6).map((point) => ({
    label: point.label,
    ...movementBetween(core, point.start, point.end),
  }));

  const mrrSeries: SeriesPoint[] = months.map((point) => ({
    label: point.label,
    value: mrrAt(core, point.end),
  }));

  const activeSeries: SeriesPoint[] = months.map((point) => ({
    label: point.label,
    value: activeAt(core, point.end),
  }));

  const lastSix = months.slice(-6);
  const churnSeries: SeriesPoint[] = lastSix.map((point) => ({
    label: point.label,
    value: churnRateBetween(core, point.start, point.end),
  }));

  const nrrSeries: SeriesPoint[] = movement.map((point, index) => {
    const base = mrrAt(core, lastSix[index].start);
    const value = base
      ? ((base + point.expansion - point.contraction - point.churn) / base) * 100
      : 100;
    return { label: point.label, value };
  });

  const planMix = plans.map((plan) => {
    const list = core.customers.filter((c) => c.status === "active" && c.planCode === plan.code);
    return {
      code: plan.code,
      name: plan.name,
      color: plan.color,
      count: list.length,
      mrr: list.reduce((sum, c) => sum + c.mrrCents, 0),
    };
  });

  const planName = new Map(plans.map((plan) => [plan.code, plan.name]));
  const paidByCustomer = new Map<string, number>();
  for (const invoice of core.invoices) {
    if (invoice.status !== "paid") continue;
    paidByCustomer.set(invoice.customerId, (paidByCustomer.get(invoice.customerId) ?? 0) + invoice.amountCents);
  }

  const topCustomers = core.customers
    .filter((customer) => customer.status === "active")
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      planName: planName.get(customer.planCode) ?? customer.planCode,
      lifetimeCents: paidByCustomer.get(customer.id) ?? 0,
    }))
    .sort((a, b) => b.lifetimeCents - a.lifetimeCents)
    .slice(0, 5);

  return {
    mrr,
    mrrDelta: pctChange(mrr, mrrPrevious),
    activeCustomers,
    activeDelta: pctChange(activeCustomers, activePrevious),
    churnRate,
    churnDelta: churnRate - previousChurn,
    nrr,
    nrrDelta: nrr - prevNrr,
    arpa: activeCustomers ? mrr / activeCustomers : 0,
    revenue: revenueSeries[revenueSeries.length - 1]?.value ?? 0,
    revenueSeries,
    mrrSeries,
    activeSeries,
    churnSeries,
    nrrSeries,
    movement,
    planMix,
    topCustomers,
    live: {
      activeNow: activeNowGroups.length,
      items: liveEvents.map((event) => ({
        id: event.id,
        customerId: event.customerId,
        name: event.customer.name,
        company: event.customer.company,
        createdAt: event.createdAt,
      })),
    },
    totalAccounts: core.customers.length,
  };
}

export type RevenueRange = "3m" | "6m" | "12m";
export const REVENUE_RANGES: RevenueRange[] = ["3m", "6m", "12m"];

export type RevenueData = {
  range: RevenueRange;
  months: number;
  startMrr: number;
  currentMrr: number;
  newMrr: number;
  expansion: number;
  contraction: number;
  churnMrr: number;
  nrr: number;
  nrr30: number;
  movement: MovementPoint[];
  mrrSeries: SeriesPoint[];
  revenueSeries: SeriesPoint[];
  invoices: {
    id: string;
    customerId: string;
    customerName: string;
    company: string;
    amountCents: number;
    status: string;
    createdAt: Date;
  }[];
};

export async function getRevenue(range: RevenueRange = "6m", locale: Locale = "en"): Promise<RevenueData> {
  const now = new Date();
  const core = await loadCore();
  const monthsCount = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const months = monthPoints(monthsCount, new Date(startOfMonth(now).getTime() - 1), locale);
  const start = months[0].start;

  const startMrr = mrrAt(core, start);
  const currentMrr = mrrAt(core, now);
  const moved = movementBetween(core, start, now);
  const nrr = startMrr
    ? ((startMrr + moved.expansion - moved.contraction - moved.churn) / startMrr) * 100
    : 100;

  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const mrr30 = mrrAt(core, thirtyDaysAgo);
  const moved30 = movementBetween(core, thirtyDaysAgo, now);
  const nrr30 = mrr30
    ? ((mrr30 + moved30.expansion - moved30.contraction - moved30.churn) / mrr30) * 100
    : 100;

  const recentInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { customer: { select: { name: true, company: true } } },
  });

  return {
    range,
    months: monthsCount,
    startMrr,
    currentMrr,
    newMrr: moved.new,
    expansion: moved.expansion,
    contraction: moved.contraction,
    churnMrr: moved.churn,
    nrr,
    nrr30,
    movement: months.map((point) => ({ label: point.label, ...movementBetween(core, point.start, point.end) })),
    mrrSeries: months.map((point) => ({ label: point.label, value: mrrAt(core, point.end) })),
    revenueSeries: months.map((point) => ({
      label: point.label,
      value: core.invoices
        .filter((invoice) => invoice.status === "paid" && invoice.createdAt >= point.start && invoice.createdAt <= point.end)
        .reduce((sum, invoice) => sum + invoice.amountCents, 0),
    })),
    invoices: recentInvoices.map((invoice) => ({
      id: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      company: invoice.customer.company,
      amountCents: invoice.amountCents,
      status: invoice.status,
      createdAt: invoice.createdAt,
    })),
  };
}

export type RetentionData = {
  cohorts: {
    key: string;
    label: string;
    size: number;
    values: (number | null)[];
  }[];
  periods: number;
  average: (number | null)[];
};

export async function getRetention(locale: Locale = "en"): Promise<RetentionData> {
  const now = new Date();
  const periods = 12;
  const firstMonth = addMonths(startOfMonth(now), -(periods - 1));

  const [customers, sessions] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, createdAt: true } }),
    prisma.event.findMany({
      where: { name: "session", createdAt: { gte: firstMonth } },
      select: { customerId: true, createdAt: true },
    }),
  ]);

  const customerCohort = new Map<string, string>();
  for (const customer of customers) {
    customerCohort.set(customer.id, monthKey(customer.createdAt));
  }

  const activity = new Set<string>();
  for (const session of sessions) {
    const cohort = customerCohort.get(session.customerId);
    if (!cohort) continue;
    activity.add(`${session.customerId}|${monthKey(session.createdAt)}`);
  }

  const cohortMap = new Map<string, string[]>();
  for (const customer of customers) {
    const key = monthKey(customer.createdAt);
    const list = cohortMap.get(key) ?? [];
    list.push(customer.id);
    cohortMap.set(key, list);
  }

  const monthList = Array.from({ length: periods }, (_, i) => addMonths(firstMonth, i));
  const currentKey = monthKey(now);

  const cohorts = monthList.map((month) => {
    const key = monthKey(month);
    const members = cohortMap.get(key) ?? [];
    const offsetLimit = monthList.findIndex((m) => monthKey(m) === currentKey) - monthList.findIndex((m) => monthKey(m) === key);
    const values: (number | null)[] = [];

    for (let offset = 0; offset < periods; offset += 1) {
      if (offset > offsetLimit) {
        values.push(null);
        continue;
      }
      const activityMonth = addMonths(month, offset);
      const active = members.filter((id) => activity.has(`${id}|${monthKey(activityMonth)}`)).length;
      values.push(members.length ? Math.round((active / members.length) * 100) : 0);
    }

    return {
      key,
      label: `${new Intl.DateTimeFormat(intlLocale(locale), { month: "short" })
        .format(month)
        .replace(/\.$/, "")} ${String(month.getFullYear()).slice(-2)}`,
      size: members.length,
      values,
    };
  });

  const average = Array.from({ length: periods }, (_, offset) => {
    let weighted = 0;
    let total = 0;
    for (const cohort of cohorts) {
      const value = cohort.values[offset];
      if (value === null) continue;
      weighted += (value / 100) * cohort.size;
      total += cohort.size;
    }
    return total ? Math.round((weighted / total) * 100) : null;
  });

  return { cohorts, periods, average };
}

export type FunnelStep = {
  key: string;
  count: number;
  fromPrevious: number;
  fromStart: number;
};

export type FunnelData = {
  days: number;
  steps: FunnelStep[];
  sources: { source: string; count: number }[];
  avgDaysToConvert: number;
  totalSignups: number;
};

const FUNNEL_STEPS = [
  { key: "signup" },
  { key: "activated" },
  { key: "project_created" },
  { key: "invited_team" },
  { key: "paid" },
];

export async function getFunnel(days = 90): Promise<FunnelData> {
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY);

  const [customers, events] = await Promise.all([
    prisma.customer.findMany({ where: { createdAt: { gte: start } }, select: { id: true } }),
    prisma.event.findMany({
      where: { name: { in: FUNNEL_STEPS.map((step) => step.key) }, createdAt: { gte: start } },
      select: { customerId: true, name: true, createdAt: true, meta: true },
    }),
  ]);

  const cohort = new Set(customers.map((customer) => customer.id));
  const perCustomer = new Map<string, Map<string, Date>>();

  for (const event of events) {
    if (!cohort.has(event.customerId)) continue;
    const map = perCustomer.get(event.customerId) ?? new Map<string, Date>();
    const existing = map.get(event.name);
    if (!existing || existing > event.createdAt) map.set(event.name, event.createdAt);
    perCustomer.set(event.customerId, map);
  }

  const counts = FUNNEL_STEPS.map((step) => {
    let count = 0;
    for (const map of perCustomer.values()) {
      if (map.has(step.key)) count += 1;
    }
    return count;
  });

  const steps: FunnelStep[] = FUNNEL_STEPS.map((step, index) => ({
    key: step.key,
    count: counts[index],
    fromPrevious: index === 0 ? 100 : counts[index - 1] ? (counts[index] / counts[index - 1]) * 100 : 0,
    fromStart: counts[0] ? (counts[index] / counts[0]) * 100 : 0,
  }));

  const sourceCounts = new Map<string, number>();
  let conversionDaysTotal = 0;
  let conversionCount = 0;

  for (const event of events) {
    if (event.name !== "signup" || !cohort.has(event.customerId)) continue;
    const source = event.meta ? (JSON.parse(event.meta) as { source?: string }).source ?? "unknown" : "unknown";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    const map = perCustomer.get(event.customerId);
    const paid = map?.get("paid");
    if (paid) {
      conversionDaysTotal += (paid.getTime() - event.createdAt.getTime()) / DAY;
      conversionCount += 1;
    }
  }

  return {
    days,
    steps,
    sources: Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    avgDaysToConvert: conversionCount ? conversionDaysTotal / conversionCount : 0,
    totalSignups: counts[0],
  };
}

export type CustomerFilters = {
  q?: string;
  status?: string;
  plan?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function customerWhere(filters: CustomerFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { company: { contains: filters.q } },
      { email: { contains: filters.q } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.plan) where.planCode = filters.plan;
  return where;
}

export async function getCustomers(filters: CustomerFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 20;
  const where = customerWhere(filters);

  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    filters.sort === "mrr"
      ? { mrrCents: "desc" }
      : filters.sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const [total, rows, plans, statusGroups] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { plan: true },
    }),
    prisma.plan.findMany({ orderBy: { sort: "asc" } }),
    prisma.customer.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = { all: 0, active: 0, trialing: 0, churned: 0, lead: 0 } as Record<string, number>;
  for (const group of statusGroups) {
    counts[group.status] = group._count._all;
    counts.all += group._count._all;
  }

  return {
    rows,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    plans,
    counts,
  };
}

export async function getCustomersForExport(filters: CustomerFilters) {
  return prisma.customer.findMany({
    where: customerWhere(filters),
    orderBy: { mrrCents: "desc" },
    take: 5000,
    include: { plan: true },
  });
}

export async function getCustomerDetail(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      plan: true,
      owner: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 12 },
      events: { orderBy: { createdAt: "desc" }, take: 16 },
    },
  });
  if (!customer) return null;

  const [paidAggregate, invoiceCount, eventCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: { customerId: id, status: "paid" },
      _sum: { amountCents: true },
    }),
    prisma.invoice.count({ where: { customerId: id } }),
    prisma.event.count({ where: { customerId: id } }),
  ]);

  const lifetimeDays = Math.max(
    1,
    Math.round(((customer.churnedAt ?? new Date()).getTime() - customer.createdAt.getTime()) / DAY),
  );

  return {
    customer,
    lifetimeDays,
    totalPaid: paidAggregate._sum.amountCents ?? 0,
    invoiceCount,
    eventCount,
  };
}

export async function getTeam() {
  const members = await prisma.member.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { ownedCustomers: true } } },
  });
  return members;
}

export async function getWorkspace() {
  const [workspace, settings] = await Promise.all([
    prisma.workspace.findFirst(),
    prisma.setting.findMany(),
  ]);
  return { workspace, settings: new Map(settings.map((setting) => [setting.key, setting.value])) };
}
