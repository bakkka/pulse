import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

export { hashPassword, verifyPassword };

export type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  hue: number;
};

const RANK: Record<string, number> = { viewer: 1, admin: 2, owner: 3 };

export function isAtLeast(role: string, required: "viewer" | "admin" | "owner"): boolean {
  return (RANK[role] ?? 0) >= (RANK[required] ?? 99);
}

export function canEdit(role: string): boolean {
  return isAtLeast(role, "admin");
}

export function canManageTeam(role: string): boolean {
  return isAtLeast(role, "owner");
}

export async function getCurrentMember(): Promise<Member | null> {
  const session = await readSession();
  if (!session) return null;
  const member = await prisma.member.findUnique({ where: { id: session.sub } });
  if (!member) return null;
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    role: member.role,
    hue: member.hue,
  };
}

export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireRole(role: "admin" | "owner"): Promise<Member> {
  const member = await requireMember();
  if (!isAtLeast(member.role, role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return member;
}
