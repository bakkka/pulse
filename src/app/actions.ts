"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAtLeast, requireMember, requireRole } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { destroySession, writeSession } from "@/lib/session";
import { seedDatabase } from "../../prisma/demo-data";

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData): Promise<void> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");

  if (!email || !password) redirect("/login?error=1");

  const member = await prisma.member.findUnique({ where: { email } });
  if (!member || !verifyPassword(password, member.passwordHash)) {
    redirect("/login?error=1");
  }

  await writeSession({ sub: member.id, email: member.email, name: member.name, role: member.role });
  await prisma.member.update({ where: { id: member.id }, data: { lastSeenAt: new Date() } });
  redirect("/app");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const ROLES = ["owner", "admin", "viewer"];

export async function inviteMember(formData: FormData): Promise<void> {
  await requireRole("owner");

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const role = str(formData, "role");

  if (!name || !email || password.length < 6 || !ROLES.includes(role)) {
    redirect("/app/team?ok=invalid");
  }

  const exists = await prisma.member.findUnique({ where: { email } });
  if (exists) redirect("/app/team?ok=exists");

  await prisma.member.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashPassword(password),
      hue: Math.floor(Math.random() * 360),
    },
  });

  revalidatePath("/app/team");
  redirect("/app/team?ok=invited");
}

export async function changeMemberRole(formData: FormData): Promise<void> {
  const current = await requireRole("owner");

  const memberId = str(formData, "memberId");
  const role = str(formData, "role");
  if (!memberId || !ROLES.includes(role)) redirect("/app/team?ok=invalid");

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) redirect("/app/team?ok=invalid");

  if (member.role === "owner" && role !== "owner") {
    const owners = await prisma.member.count({ where: { role: "owner" } });
    if (owners <= 1) redirect("/app/team?ok=lastowner");
  }

  if (member.id === current.id && role !== "owner") {
    const owners = await prisma.member.count({ where: { role: "owner" } });
    if (owners <= 1) redirect("/app/team?ok=lastowner");
  }

  await prisma.member.update({ where: { id: memberId }, data: { role } });
  revalidatePath("/app/team");
  redirect("/app/team?ok=saved");
}

export async function removeMember(formData: FormData): Promise<void> {
  const current = await requireRole("owner");
  const memberId = str(formData, "memberId");

  if (!memberId || memberId === current.id) redirect("/app/team?ok=invalid");

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) redirect("/app/team?ok=invalid");
  if (member.role === "owner") redirect("/app/team?ok=lastowner");

  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath("/app/team");
  redirect("/app/team?ok=removed");
}

export async function saveWorkspace(formData: FormData): Promise<void> {
  await requireRole("admin");

  const name = str(formData, "name") || "Acme Cloud";
  const currency = str(formData, "currency") || "USD";
  const timezone = str(formData, "timezone") || "UTC";

  const workspace = await prisma.workspace.findFirst();
  if (workspace) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name, currency, timezone },
    });
  } else {
    await prisma.workspace.create({ data: { name, currency, timezone } });
  }

  for (const [key, value] of [
    ["workspace_name", name],
    ["currency", currency],
    ["timezone", timezone],
  ]) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  revalidatePath("/app", "layout");
  redirect("/app/settings?ok=saved");
}

export async function updateCustomerPlan(formData: FormData): Promise<void> {
  await requireRole("admin");

  const customerId = str(formData, "customerId");
  const planCode = str(formData, "planCode");

  const [customer, plan] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.plan.findUnique({ where: { code: planCode } }),
  ]);

  if (!customer || !plan) redirect("/app/customers");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      planCode: plan.code,
      mrrCents: customer.status === "active" ? plan.priceCents : 0,
    },
  });

  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
  redirect(`/app/customers/${customerId}?ok=saved`);
}

export async function resetDemoData(): Promise<void> {
  const member = await requireMember();
  if (!isAtLeast(member.role, "owner")) redirect("/app/settings?ok=forbidden");

  await seedDatabase(prisma);
  revalidatePath("/", "layout");
  redirect("/app/settings?ok=reset");
}
