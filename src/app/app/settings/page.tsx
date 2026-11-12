import { Database, Gauge, KeyRound, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { canEdit, canManageTeam } from "@/lib/auth";
import { requireMember } from "@/lib/auth";
import { getWorkspace } from "@/lib/analytics";
import { resetDemoData, saveWorkspace } from "@/app/actions";
import { Badge, Field, Notice, PageHeader, SectionCard } from "@/components/ui";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const member = await requireMember();
  const { workspace } = await getWorkspace();
  const { ok } = await searchParams;
  const editable = canEdit(member.role);
  const isOwner = canManageTeam(member.role);

  const notices: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
    saved: { tone: "good", text: "Workspace settings saved." },
    reset: { tone: "good", text: "Demo data rebuilt from scratch." },
    forbidden: { tone: "bad", text: "Only an owner can reset demo data." },
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Workspace, data and access"
        actions={<Badge tone={editable ? "brand" : "neutral"}>{member.role}</Badge>}
      />

      {ok && notices[ok] ? <Notice tone={notices[ok].tone}>{notices[ok].text}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Workspace" hint="Shown across the app">
          {editable ? (
            <form action={saveWorkspace} className="space-y-4">
              <Field label="Workspace name">
                <input className="input" name="name" defaultValue={workspace?.name ?? "Acme Cloud"} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Currency">
                  <select className="input" name="currency" defaultValue={workspace?.currency ?? "USD"}>
                    <option value="USD">USD — US dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — Pound sterling</option>
                  </select>
                </Field>
                <Field label="Timezone">
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
                  <Save size={15} />
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <p className="text-[12px] leading-relaxed text-slate-500">
              Your role is <span className="font-medium text-ink-700">{member.role}</span>. Workspace
              settings can be changed by admins and owners.
            </p>
          )}
        </SectionCard>

        <SectionCard title="About this demo" hint="What you are looking at">
          <ul className="space-y-3 text-[12px] text-slate-500">
            <li className="flex gap-2">
              <Database size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                <strong className="font-medium text-ink-700">SQLite + Prisma.</strong> 1,400 accounts,
                invoices and product events seeded deterministically.
              </span>
            </li>
            <li className="flex gap-2">
              <KeyRound size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                <strong className="font-medium text-ink-700">Real auth.</strong> scrypt password hashes,
                HMAC-signed sessions, server-side role checks.
              </span>
            </li>
            <li className="flex gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                <strong className="font-medium text-ink-700">No fake numbers.</strong> Every chart is
                computed from invoices and event rows.
              </span>
            </li>
            <li className="flex gap-2">
              <Gauge size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>
                <strong className="font-medium text-ink-700">Fast by default.</strong> Server
                components render data, client components only handle hover and filters.
              </span>
            </li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Demo data" hint="Useful before a demo call">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-[12px] leading-relaxed text-slate-500">
            Rebuilds accounts, invoices and events with the same deterministic seed. Any changes you
            made to customers or the team are lost.
          </p>
          {isOwner ? (
            <form action={resetDemoData}>
              <button type="submit" className="btn btn-danger">
                <RotateCcw size={15} />
                Rebuild demo data
              </button>
            </form>
          ) : (
            <Badge tone="warn">Owner only</Badge>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
