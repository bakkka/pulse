import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { canManageTeam } from "@/lib/auth";
import { requireMember } from "@/lib/auth";
import { getTeam } from "@/lib/analytics";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { changeMemberRole, inviteMember, removeMember } from "@/app/actions";
import { Avatar, Badge, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

const ROLE_INFO = [
  {
    role: "Owner",
    tone: "brand" as const,
    text: "Full access: manage the team, reset demo data, change billing and plans.",
  },
  {
    role: "Admin",
    tone: "good" as const,
    text: "Can edit customers and workspace settings, but cannot manage team members.",
  },
  {
    role: "Viewer",
    tone: "neutral" as const,
    text: "Read-only. Sees every dashboard, no write actions anywhere in the app.",
  },
];

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const member = await requireMember();
  const canManage = canManageTeam(member.role);
  const members = await getTeam();
  const { ok } = await searchParams;
  const roleCounts = members.reduce<Record<string, number>>((counts, row) => {
    counts[row.role] = (counts[row.role] ?? 0) + 1;
    return counts;
  }, {});

  const notices: Record<string, { tone: "good" | "bad" | "warn"; text: string }> = {
    invited: { tone: "good", text: "Invitation created. Share the password with your teammate." },
    saved: { tone: "good", text: "Role updated." },
    removed: { tone: "good", text: "Member removed." },
    exists: { tone: "bad", text: "A member with this email already exists." },
    invalid: { tone: "bad", text: "Check the fields — password needs at least 6 characters." },
    lastowner: { tone: "warn", text: "The workspace needs at least one owner." },
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        subtitle="Who can see and change what"
        actions={<Badge tone="neutral">{formatNumber(members.length)} members</Badge>}
      />

      {ok && notices[ok] ? <Notice tone={notices[ok].tone}>{notices[ok].text}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {ROLE_INFO.map((info) => (
          <div key={info.role} className="card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-slate-400" />
              <span className="text-[13px] font-semibold text-ink">{info.role}</span>
              <Badge tone={info.tone} className="ml-auto">
                {roleCounts[info.role.toLowerCase()] ?? 0}
              </Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{info.text}</p>
          </div>
        ))}
      </div>

      {canManage ? (
        <SectionCard title="Invite a teammate" hint="Creates a password account immediately">
          <form action={inviteMember} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Name">
              <input className="input" name="name" required placeholder="Dana Ruiz" />
            </Field>
            <Field label="Email">
              <input className="input" type="email" name="email" required placeholder="dana@acme.co" />
            </Field>
            <Field label="Temp password" hint="min. 6 characters">
              <input className="input" name="password" required minLength={6} defaultValue="pulse123" />
            </Field>
            <Field label="Role">
              <select className="input" name="role" defaultValue="viewer">
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </Field>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                <UserPlus size={15} />
                Invite
              </button>
            </div>
          </form>
        </SectionCard>
      ) : (
        <Notice tone="warn">
          Your role ({member.role}) cannot invite people or change roles. Sign in as an owner to manage
          the team.
        </Notice>
      )}

      <SectionCard title="Members" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head px-5 py-2.5">Member</th>
                <th className="table-head px-3 py-2.5">Role</th>
                <th className="table-head px-3 py-2.5">Customers</th>
                <th className="table-head px-3 py-2.5">Last seen</th>
                <th className="table-head px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {members.map((row) => (
                <tr key={row.id} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} hue={row.hue} className="h-8 w-8 text-[11px]" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {row.name}
                          {row.id === member.id ? (
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">(you)</span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <form action={changeMemberRole} className="flex items-center gap-1.5">
                        <input type="hidden" name="memberId" value={row.id} />
                        <select
                          name="role"
                          defaultValue={row.role}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-[12px] text-ink-700 outline-none focus:border-brand/50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-brand/40 hover:text-brand"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      <Badge tone={row.role === "owner" ? "brand" : row.role === "admin" ? "good" : "neutral"}>
                        {row.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">
                    {formatNumber(row._count.ownedCustomers)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">
                    {row.lastSeenAt ? formatRelative(row.lastSeenAt) : formatDate(row.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canManage && row.id !== member.id && row.role !== "owner" ? (
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={row.id} />
                        <button
                          type="submit"
                          className="inline-flex rounded-md border border-line p-1.5 text-slate-400 transition hover:border-bad/30 hover:text-bad"
                          aria-label={`Remove ${row.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <p className="text-[11px] text-slate-400">
        Permissions are enforced on the server in every action, not just hidden in the UI.
      </p>
    </div>
  );
}
