import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./demo-data";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding Pulse demo data…");
  const started = Date.now();
  await seedDatabase(prisma);

  const [customers, invoices, events, mrr] = await Promise.all([
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.event.count(),
    prisma.customer.aggregate({ where: { status: "active" }, _sum: { mrrCents: true } }),
  ]);

  console.log(
    `✔ ${customers} accounts · ${invoices} invoices · ${events} events · MRR $${(
      (mrr._sum.mrrCents ?? 0) / 100
    ).toLocaleString("en-US")} · ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  console.log("  Owner:  owner@pulse.app / pulse");
  console.log("  Viewer: viewer@pulse.app / pulse");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
