import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

export const DEMO_PASSWORD = "pulse";

export const DEMO_MEMBERS = [
  { id: "m_owner", email: "owner@pulse.app", name: "Maya Chen", role: "owner", hue: 250 },
  { id: "m_admin", email: "admin@pulse.app", name: "Leo Park", role: "admin", hue: 160 },
  { id: "m_viewer", email: "viewer@pulse.app", name: "Sam Ortiz", role: "viewer", hue: 25 },
];

export const DEMO_PLANS = [
  { code: "starter", name: "Starter", priceCents: 2900, color: "#6366F1", sort: 0 },
  { code: "growth", name: "Growth", priceCents: 9900, color: "#12B76A", sort: 1 },
  { code: "scale", name: "Scale", priceCents: 29900, color: "#F79009", sort: 2 },
];

const DAY = 86_400_000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

const FIRST = [
  "Maya", "Leo", "Sam", "Nora", "Elias", "Ava", "Noah", "Iris", "Owen", "Zoe",
  "Milo", "Elena", "Theo", "Lina", "Jonas", "Mia", "Arlo", "Sofia", "Felix", "Ada",
  "Ravi", "Hana", "Marco", "Ingrid", "Dylan", "Priya", "Luca", "Clara", "Omar", "Yuki",
];

const LAST = [
  "Chen", "Park", "Ortiz", "Bennett", "Novak", "Silva", "Meyer", "Kaur", "Rossi", "Kim",
  "Dubois", "Haas", "Lindqvist", "Moreau", "Ivanov", "Costa", "Fischer", "Alvarez", "Larsen", "Tanaka",
];

const COMPANIES = ["Northwind", "Lumen", "Vertex", "Kinetic", "Orbit", "Nimbus", "Granite", "Cobalt", "Fathom", "Halcyon", "Meridian", "Onyx", "Pivot", "Quanta", "Relay", "Sable", "Tessera", "Umbra", "Vela", "Zephyr"];
const SUFFIXES = ["Labs", "Cloud", "Analytics", "Studio", "Health", "Robotics", "Finance", "Commerce", "Systems", "Works"];

const COUNTRIES = ["US", "DE", "GB", "CA", "NL", "FR", "AU", "BR", "IN", "PL"];

const SOURCES = ["organic", "ads", "referral", "content", "partner"];
const SOURCE_WEIGHTS = [0.36, 0.28, 0.16, 0.12, 0.08];

function weighted(rand: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export async function seedDatabase(prisma: PrismaClient, accountCount = 1400): Promise<void> {
  const now = new Date();
  const rand = mulberry32(20261116);
  const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)];
  const between = (min: number, max: number) => min + rand() * (max - min);

  await prisma.event.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.member.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.workspace.create({
    data: { id: "ws_demo", name: "Acme Cloud", currency: "USD", timezone: "UTC" },
  });

  await prisma.member.createMany({
    data: DEMO_MEMBERS.map((member) => ({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      hue: member.hue,
      passwordHash: hashPassword(DEMO_PASSWORD),
      lastSeenAt: new Date(now.getTime() - Math.floor(rand() * 4) * 3_600_000),
    })),
  });

  await prisma.setting.createMany({
    data: [
      { key: "workspace_name", value: "Acme Cloud" },
      { key: "currency", value: "USD" },
      { key: "timezone", value: "UTC" },
    ],
  });

  for (const plan of DEMO_PLANS) {
    await prisma.plan.create({ data: plan });
  }

  const planIndex = new Map(DEMO_PLANS.map((plan, index) => [plan.code, index]));
  const planCodes = DEMO_PLANS.map((plan) => plan.code);

  type AccountRow = {
    id: string;
    name: string;
    email: string;
    company: string;
    country: string;
    planCode: string;
    status: string;
    mrrCents: number;
    ownerId: string | null;
    createdAt: Date;
    activatedAt: Date | null;
    churnedAt: Date | null;
  };
  type InvoiceRow = {
    id: string;
    customerId: string;
    amountCents: number;
    status: string;
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
  };
  type EventRow = {
    id: string;
    customerId: string;
    name: string;
    createdAt: Date;
    meta: string | null;
  };

  const accounts: AccountRow[] = [];
  const invoices: InvoiceRow[] = [];
  const events: EventRow[] = [];
  let invoiceSeq = 0;
  let eventSeq = 0;

  const pushEvent = (customerId: string, name: string, createdAt: Date, meta: string | null = null) => {
    eventSeq += 1;
    events.push({ id: `ev_${eventSeq}`, customerId, name, createdAt, meta });
  };

  for (let i = 0; i < accountCount; i += 1) {

    const daysAgo = Math.floor(Math.pow(rand(), 1.2) * 365);
    const createdAt = new Date(now.getTime() - daysAgo * DAY - Math.floor(rand() * 12) * 3_600_000);
    const cohortMonth = startOfMonth(createdAt);
    const monthsSince = Math.max(
      0,
      (now.getFullYear() - cohortMonth.getFullYear()) * 12 + (now.getMonth() - cohortMonth.getMonth()),
    );

    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const company = `${pick(COMPANIES)} ${pick(SUFFIXES)}`;
    const domain = company.toLowerCase().replace(/[^a-z]/g, "") + ".com";
    const slug = `${firstName}.${lastName}`.toLowerCase();

    const activated = rand() < 0.82;
    const project = activated && rand() < 0.78;
    const team = project && rand() < 0.78;
    const paying = team && rand() < 0.9;

    const initialPlan = weighted(rand, [0.52, 0.35, 0.13]);
    let currentPlan = initialPlan;
    let currentMrr = DEMO_PLANS[currentPlan].priceCents;

    let churnedAt: Date | null = null;
    if (paying) {
      for (let m = 1; m <= monthsSince; m += 1) {
        if (rand() < 0.024) {
          const candidate = new Date(addMonths(cohortMonth, m).getTime() + rand() * 26 * DAY);
          if (candidate < now) churnedAt = candidate;
          break;
        }
      }
    }

    const isTrialing = !paying && monthsSince === 0 && rand() < 0.55;

    let lastMrr = 0;
    if (paying) {
      for (let m = 0; m <= monthsSince; m += 1) {
        const invoiceDate = new Date(createdAt.getTime() + m * 30 * DAY + 3_600_000);
        if (invoiceDate > now) break;
        if (churnedAt && invoiceDate > churnedAt) break;

        if (m > 0) {
          const roll = rand();
          if (currentPlan < planCodes.length - 1 && roll < 0.105) {
            currentPlan += 1;
            currentMrr = DEMO_PLANS[currentPlan].priceCents;
          } else if (currentPlan > 0 && roll >= 0.105 && roll < 0.125) {
            currentPlan -= 1;
            currentMrr = DEMO_PLANS[currentPlan].priceCents;
          }
        }

        const isFresh = now.getTime() - invoiceDate.getTime() < 5 * DAY;
        const invoiceStatus = isFresh && rand() < 0.3 ? "open" : rand() < 0.01 ? "void" : "paid";

        invoiceSeq += 1;
        invoices.push({
          id: `inv_${invoiceSeq}`,
          customerId: `c_${i + 1}`,
          amountCents: currentMrr,
          status: invoiceStatus,
          periodStart: invoiceDate,
          periodEnd: new Date(invoiceDate.getTime() + 30 * DAY),
          createdAt: invoiceDate,
        });
        lastMrr = currentMrr;
      }
    }

    const hasInvoices = lastMrr > 0;
    const status = churnedAt
      ? "churned"
      : paying && hasInvoices
        ? "active"
        : isTrialing
          ? "trialing"
          : "lead";
    const mrrCents = status === "active" ? lastMrr : 0;

    const elapsed = Math.max(60_000, now.getTime() - createdAt.getTime());
    const at = (fraction: number, desiredDays: number, floor: Date) => {
      const desired = createdAt.getTime() + rand() * desiredDays * DAY;
      const capped = createdAt.getTime() + elapsed * fraction;
      return new Date(Math.max(floor.getTime(), Math.min(desired, capped)));
    };

    const activatedAt = activated ? at(0.4, 3, createdAt) : null;
    const projectAt = project && activatedAt ? at(0.6, 9, activatedAt) : null;
    const teamAt = team && projectAt ? at(0.8, 16, projectAt) : null;
    const paidAt = paying && teamAt ? at(0.95, 20, teamAt) : null;

    accounts.push({
      id: `c_${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${slug}${i + 1}@${domain}`,
      company,
      country: pick(COUNTRIES),
      planCode: planCodes[currentPlan],
      status,
      mrrCents,
      ownerId: rand() < 0.6 ? "m_owner" : rand() < 0.75 ? "m_admin" : null,
      createdAt,
      activatedAt,
      churnedAt,
    });

    pushEvent(`c_${i + 1}`, "signup", createdAt, JSON.stringify({ source: SOURCES[weighted(rand, SOURCE_WEIGHTS)] }));
    if (activatedAt) pushEvent(`c_${i + 1}`, "activated", activatedAt);
    if (projectAt) pushEvent(`c_${i + 1}`, "project_created", projectAt);
    if (teamAt) pushEvent(`c_${i + 1}`, "invited_team", teamAt);

    if (paying && paidAt) {
      pushEvent(`c_${i + 1}`, "paid", paidAt, JSON.stringify({ plan: planCodes[currentPlan] }));
    }

    const activityBase = paying ? 0.92 : 0.55;
    for (let m = 0; m <= monthsSince; m += 1) {
      const monthStart = addMonths(cohortMonth, m);
      const monthEnd = new Date(addMonths(cohortMonth, m + 1).getTime() - 1);
      const from = Math.max(monthStart.getTime(), createdAt.getTime());
      const to = Math.min(
        monthEnd.getTime(),
        now.getTime(),
        churnedAt ? churnedAt.getTime() : Number.POSITIVE_INFINITY,
      );
      if (to <= from) continue;

      const probability = Math.max(0.14, activityBase - m * 0.035);
      if (rand() > probability) continue;

      const sessions = 1 + Math.floor(rand() * 2.4);
      for (let s = 0; s < sessions; s += 1) {
        pushEvent(`c_${i + 1}`, "session", new Date(from + rand() * (to - from)));
      }
    }
  }

  await prisma.customer.createMany({ data: accounts });
  await prisma.invoice.createMany({ data: invoices });

  const activeAccounts = accounts.filter((account) => account.status === "active");
  for (let i = 0; i < 48; i += 1) {
    const account = activeAccounts[Math.floor(rand() * activeAccounts.length)];
    pushEvent(account.id, "session", new Date(now.getTime() - Math.floor(rand() * 40) * 60_000));
  }

  events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (let i = 0; i < events.length; i += 2_000) {
    await prisma.event.createMany({ data: events.slice(i, i + 2_000) });
  }
}
