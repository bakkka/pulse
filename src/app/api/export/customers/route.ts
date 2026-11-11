import type { NextRequest } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { getCustomersForExport } from "@/lib/analytics";

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const rows = await getCustomersForExport({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    plan: searchParams.get("plan") ?? undefined,
  });

  const header = [
    "name",
    "email",
    "company",
    "country",
    "plan",
    "status",
    "mrr_usd",
    "created_at",
    "churned_at",
  ];

  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.company,
      row.country,
      row.plan.name,
      row.status,
      (row.mrrCents / 100).toFixed(2),
      row.createdAt.toISOString().slice(0, 10),
      row.churnedAt ? row.churnedAt.toISOString().slice(0, 10) : "",
    ]
      .map((value) => escapeCsv(String(value)))
      .join(","),
  );

  const csv = `\uFEFF${[header.join(","), ...lines].join("\r\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pulse-customers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
