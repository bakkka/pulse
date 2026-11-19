import { canEdit, canManageTeam, requireMember } from "@/lib/auth";
import { getWorkspace } from "@/lib/analytics";
import { getDict, getLocale, t } from "@/lib/i18n";
import { resetDemoData, saveWorkspace } from "@/app/actions";
import { Badge, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const locale = await getLocale();
  const d = getDict(locale);
  const member = await requireMember();
  const { workspace } = await getWorkspace();
  const { ok } = await searchParams;
  const editable = canEdit(member.role);
  const isOwner = canManageTeam(member.role);

  const notices: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
    saved: { tone: "good", text: d.settings.notices.saved },
    reset: { tone: "good", text: d.settings.notices.reset },
    forbidden: { tone: "bad", text: d.settings.notices.forbidden },
  };

  const roleName = d.roles[member.role as keyof typeof d.roles] ?? member.role;

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.settings.title}
        actions={<Badge tone={editable ? "brand" : "neutral"}>{roleName}</Badge>}
      />

      {ok && notices[ok] ? <Notice tone={notices[ok].tone}>{notices[ok].text}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title={d.settings.workspace}>
          {editable ? (
            <form action={saveWorkspace} className="space-y-4">
              <Field label={d.settings.name}>
                <input className="input" name="name" defaultValue={workspace?.name ?? "Acme Cloud"} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={d.settings.currency}>
                  <select className="input" name="currency" defaultValue={workspace?.currency ?? "USD"}>
                    <option value="USD">USD (US dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (Pound sterling)</option>
                  </select>
                </Field>
                <Field label={d.settings.timezone}>
                  <select className="input" name="timezone" defaultValue={workspace?.timezone ?? "UTC"}>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                  </select>
                </Field>
              </div>
              <div className="flex justify-end border-t border-line-soft pt-4">
                <button type="submit" className="btn btn-primary">
                  {d.settings.save}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-[12px] leading-relaxed text-slate-500">
              {t(d.settings.readOnly, { role: roleName })}
            </p>
          )}
        </SectionCard>

        <SectionCard title={d.settings.about}>
          <ul className="space-y-3 text-[12px] text-slate-500">
            {d.settings.aboutItems.map((item) => {
              const [title, ...rest] = item.split(". ");
              return (
                <li key={item}>
                  <span>
                    <strong className="font-medium text-ink-700">{title}.</strong>{" "}
                    {rest.join(". ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title={d.settings.demo}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-[12px] leading-relaxed text-slate-500">{d.settings.demoText}</p>
          {isOwner ? (
            <form action={resetDemoData}>
              <button type="submit" className="btn btn-danger">
                {d.settings.reset}
              </button>
            </form>
          ) : (
            <Badge tone="warn">{d.common.ownerOnly}</Badge>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
