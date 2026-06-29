"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown, MoreVertical, SlidersHorizontal } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { AvatarGroup } from "@/components/shared/avatar";
import { PhaseBadge, PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DueText } from "@/components/shared/due-text";
import { useMembers, useProjects } from "@/lib/queries/hooks";
import type { ProjectTab } from "@/lib/repositories";
import { cn } from "@/lib/utils";

const TABS: { key: ProjectTab; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in_progress", label: "進行中" },
  { key: "done", label: "完了" },
  { key: "on_hold", label: "保留" },
];

export function ProjectsTable({
  initialTab = "all",
}: {
  initialTab?: ProjectTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTabState] = useState<ProjectTab>(initialTab);

  const { data: projects } = useProjects(tab);
  const { data: members } = useMembers();
  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);

  function setTab(next: ProjectTab) {
    setTabState(next);
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    if (next === "all") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <SectionCard bodyClassName="px-0 pb-0">
      <div className="flex items-center justify-between gap-3 px-6 -mt-1 border-b border-line">
        <div className="flex items-center gap-5 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative py-3 text-sm whitespace-nowrap transition-colors",
                  active ? "text-brand-600 font-semibold" : "text-ink-soft hover:text-ink",
                )}
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors">
            <SlidersHorizontal className="size-3.5" />
            フィルター
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors">
            <ArrowUpDown className="size-3.5" />
            次回期限が近い順
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="py-2.5 pl-6 font-medium">プロジェクト</th>
              <th className="py-2.5 font-medium">フェーズ</th>
              <th className="py-2.5 font-medium w-40">進捗</th>
              <th className="py-2.5 font-medium">次回期限</th>
              <th className="py-2.5 font-medium">担当者</th>
              <th className="py-2.5 font-medium">優先度</th>
              <th className="py-2.5 font-medium">ステータス</th>
              <th className="py-2.5 pr-6" />
            </tr>
          </thead>
          <tbody>
            {projects?.map((p) => {
              const assignees = p.memberIds
                .map((id) => memberMap.get(id))
                .filter((m): m is NonNullable<typeof m> => Boolean(m));
              const done = p.status === "done";
              return (
                <tr
                  key={p.id}
                  className="border-t border-line hover:bg-surface-muted/60 transition-colors cursor-pointer"
                >
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">{p.name}</p>
                        <p className="text-xs text-ink-muted truncate">{p.client}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">{p.phase && <PhaseBadge label={p.phase} />}</td>
                  <td className="py-4 pr-4 w-40">
                    <ProgressBar value={p.progress} color={p.color} />
                  </td>
                  <td className="py-4 pr-4">
                    {p.nextDue && <DueText date={p.nextDue} done={done} />}
                  </td>
                  <td className="py-4 pr-4">
                    {assignees.length > 0 && <AvatarGroup members={assignees} max={3} />}
                  </td>
                  <td className="py-4 pr-4">
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td className="py-4 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-4 pr-6">
                    <button
                      type="button"
                      aria-label="メニュー"
                      className="inline-flex items-center justify-center size-7 rounded-lg text-ink-muted hover:bg-surface-muted transition-colors"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {projects?.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">該当する案件はありません</p>
        )}
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-1 py-3 border-t border-line text-sm font-medium text-ink-soft hover:bg-surface-muted transition-colors"
      >
        全{projects?.length ?? 0}件を表示
        <ChevronDown className="size-4" />
      </button>
    </SectionCard>
  );
}
