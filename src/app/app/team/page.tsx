import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { canManageTeam, requireMember } from "@/lib/auth";
import { getTeam } from "@/lib/analytics";
import { formatDate, formatNumber, formatRelative, pluralRu } from "@/lib/format";
import { getDict, getLocale, t } from "@/lib/i18n";
import { changeMemberRole, inviteMember, removeMember } from "@/app/actions";
import { Avatar, Badge, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

const ROLE_KEYS = ["owner", "admin", "viewer"] as const;

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const locale = await getLocale();
  const d = getDict(locale);
  const member = await requireMember();
  const canManage = canManageTeam(member.role);
  const members = await getTeam();
  const { ok } = await searchParams;

  const roleCounts = members.reduce<Record<string, number>>((counts, row) => {
    counts[row.role] = (counts[row.role] ?? 0) + 1;
    return counts;
  }, {});

  const membersLabel =
    locale === "ru"
      ? pluralRu(members.length, "участник", "участника", "участников")
      : members.length === 1
        ? "member"
        : "members";

  const notices: Record<string, { tone: "good" | "bad" | "warn"; text: string }> = {
    invited: { tone: "good", text: d.team.notices.invited },
    saved: { tone: "good", text: d.team.notices.saved },
    removed: { tone: "good", text: d.team.notices.removed },
    exists: { tone: "bad", text: d.team.notices.exists },
    invalid: { tone: "bad", text: d.team.notices.invalid },
    lastowner: { tone: "warn", text: d.team.notices.lastowner },
  };

  const roleTone = (role: string) =>
    role === "owner" ? ("brand" as const) : role === "admin" ? ("good" as const) : ("neutral" as const);

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.team.title}
        subtitle={d.team.subtitle}
        actions={
          <Badge tone="neutral">
            {formatNumber(members.length)} {membersLabel}
          </Badge>
        }
      />

      {ok && notices[ok] ? <Notice tone={notices[ok].tone}>{notices[ok].text}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {ROLE_KEYS.map((role) => (
          <div key={role} className="card p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-slate-400" />
              <span className="text-[13px] font-semibold text-ink">{d.roles[role]}</span>
              <Badge tone={roleTone(role)} className="ml-auto">
                {roleCounts[role] ?? 0}
              </Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{d.team.roleCards[role]}</p>
          </div>
        ))}
      </div>

      {canManage ? (
        <SectionCard title={d.team.invite} hint={d.team.inviteHint}>
          <form action={inviteMember} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label={d.team.name}>
              <input className="input" name="name" required placeholder="Dana Ruiz" />
            </Field>
            <Field label={d.team.email}>
              <input className="input" type="email" name="email" required placeholder="dana@acme.co" />
            </Field>
            <Field label={d.team.password} hint={d.team.passwordHint}>
              <input className="input" name="password" required minLength={6} defaultValue="pulse123" />
            </Field>
            <Field label={d.team.role}>
              <select className="input" name="role" defaultValue="viewer">
                {ROLE_KEYS.map((role) => (
                  <option key={role} value={role}>
                    {d.roles[role]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                <UserPlus size={15} />
                {d.team.inviteButton}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : (
        <Notice tone="warn">
          {t(d.team.warning, {
            role: d.roles[member.role as keyof typeof d.roles] ?? member.role,
          })}
        </Notice>
      )}

      <SectionCard title={d.team.membersTitle} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="table-head px-5 py-2.5">{d.team.cols.member}</th>
                <th className="table-head px-3 py-2.5">{d.team.cols.role}</th>
                <th className="table-head px-3 py-2.5">{d.team.cols.customers}</th>
                <th className="table-head px-3 py-2.5">{d.team.cols.lastSeen}</th>
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
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                              {d.common.you}
                            </span>
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
                          {ROLE_KEYS.map((role) => (
                            <option key={role} value={role}>
                              {d.roles[role]}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:border-brand/40 hover:text-brand"
                        >
                          {d.common.save}
                        </button>
                      </form>
                    ) : (
                      <Badge tone={roleTone(row.role)}>
                        {d.roles[row.role as keyof typeof d.roles] ?? row.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">
                    {formatNumber(row._count.ownedCustomers)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">
                    {row.lastSeenAt ? formatRelative(row.lastSeenAt, locale) : formatDate(row.createdAt, locale)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canManage && row.id !== member.id && row.role !== "owner" ? (
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={row.id} />
                        <button
                          type="submit"
                          className="inline-flex rounded-md border border-line p-1.5 text-slate-400 transition hover:border-bad/30 hover:text-bad"
                          aria-label={`${d.team.remove} — ${row.name}`}
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

      <p className="text-[11px] text-slate-400">{d.team.footer}</p>
    </div>
  );
}
