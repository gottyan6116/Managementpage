"use client";

import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { useClients, useMembers, useProjects } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

const HEALTH = {
  good: { label: "良好", cls: "bg-emerald-50 text-emerald-700" },
  watch: { label: "要確認", cls: "bg-orange-50 text-orange-700" },
  risk: { label: "リスク", cls: "bg-red-50 text-red-700" },
} as const;

export function ClientsView() {
  const { data: clients } = useClients();
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");
  const memberMap = new Map(members?.map((m) => [m.id, m]));

  if (!clients?.length) {
    return (
      <EmptyState
        icon={Building2}
        title="クライアントがありません"
        description="企業・担当者・対応履歴を登録すると、案件の前後関係を追いやすくなります。"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {clients.map((client) => {
        const owner = memberMap.get(client.ownerMemberId);
        const linkedProjects = projects?.filter((p) => p.clientId === client.id) ?? [];
        const health = HEALTH[client.health];
        return (
          <section key={client.id} className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-ink">{client.name}</h2>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", health.cls)}>
                    {health.label}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1">{client.industry}</p>
              </div>
              {owner && <Avatar member={owner} size="sm" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="border-b md:border-b-0 md:border-r border-line p-5">
                <p className="text-xs font-semibold text-ink-muted">紐づく案件</p>
                <div className="mt-3 space-y-2">
                  {linkedProjects.length > 0 ? linkedProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted"
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{project.name}</span>
                        <span className="block text-xs text-ink-muted">次回期限 {project.nextDue ? formatDue(project.nextDue) : "未設定"}</span>
                      </span>
                    </Link>
                  )) : (
                    <p className="text-sm text-ink-muted">案件はまだありません</p>
                  )}
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-ink-muted">担当者連絡先</p>
                <div className="mt-3 space-y-3">
                  {client.contacts.length > 0 ? client.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-xl bg-app px-3 py-3">
                      <p className="text-sm font-semibold text-ink">{contact.name}</p>
                      <p className="text-xs text-ink-muted">{contact.role}</p>
                      <div className="mt-2 space-y-1 text-xs text-ink-soft">
                        <p className="flex items-center gap-1.5"><Mail className="size-3.5" />{contact.email}</p>
                        <p className="flex items-center gap-1.5"><Phone className="size-3.5" />{contact.phone}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-ink-muted">連絡先は未登録です</p>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-line px-5 py-4">
              <p className="text-xs font-semibold text-ink-muted">対応履歴</p>
              <div className="mt-3 space-y-3">
                {client.interactions.length > 0 ? client.interactions.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="mt-1 size-2 rounded-full bg-brand-500" />
                    <div className="min-w-0">
                      <p className="text-xs text-ink-muted">{formatDue(item.date)} / {item.channel}</p>
                      <p className="text-sm text-ink-soft">{item.summary}</p>
                      {item.nextAction && <p className="mt-1 text-xs font-medium text-brand-600">次: {item.nextAction}</p>}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-ink-muted">対応履歴はまだありません</p>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
