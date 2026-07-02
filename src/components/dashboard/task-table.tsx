"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal, Settings2 } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { Avatar } from "@/components/shared/avatar";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { DueText } from "@/components/shared/due-text";
import {
  useMembers,
  useProjects,
  useTasks,
  useToggleTaskDone,
} from "@/lib/queries/hooks";
import type { TaskTab } from "@/lib/repositories";
import { cn } from "@/lib/utils";

const TABS: { key: TaskTab; label: string; count: number }[] = [
  { key: "all", label: "すべて", count: 120 },
  { key: "mine", label: "自分のタスク", count: 42 },
  { key: "overdue", label: "期限超過", count: 2 },
  { key: "done", label: "完了", count: 86 },
];

export function TaskTable({
  limit,
  initialTab = "all",
  projectId,
}: {
  limit?: number;
  initialTab?: TaskTab;
  projectId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTabState] = useState<TaskTab>(initialTab);

  const { data: tasks } = useTasks({ tab, projectId });
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");
  const toggle = useToggleTaskDone({ tab, projectId });

  const memberMap = useMemo(
    () => new Map(members?.map((m) => [m.id, m])),
    [members],
  );
  const projectMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p])),
    [projects],
  );

  const rows = limit ? tasks?.slice(0, limit) : tasks;

  function setTab(next: TaskTab) {
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
      {/* タブ + ツール */}
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
                  "relative flex items-center gap-1.5 py-3 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "text-brand-600 font-semibold"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {t.label}
                <span className="text-xs text-ink-muted">{t.count}</span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <SlidersHorizontal className="size-3.5" />
            フィルター
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <Settings2 className="size-3.5" />
            表示設定
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="w-12 py-2.5 pl-6" />
              <th className="py-2.5 font-medium">タスク名</th>
              <th className="py-2.5 font-medium">プロジェクト</th>
              <th className="py-2.5 font-medium">担当者</th>
              <th className="py-2.5 font-medium">期限</th>
              <th className="py-2.5 font-medium">優先度</th>
              <th className="py-2.5 pr-6 font-medium">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((task) => {
              const project = task.projectId ? projectMap.get(task.projectId) : undefined;
              const done = task.status === "done";
              const assignee = task.assigneeIds[0]
                ? memberMap.get(task.assigneeIds[0])
                : undefined;
              return (
                <tr
                  key={task.id}
                  className="border-t border-line hover:bg-surface-muted/60 transition-colors"
                >
                  <td className="pl-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggle.mutate(task.id)}
                      aria-label={done ? "未完了に戻す" : "完了にする"}
                      className={cn(
                        "inline-flex items-center justify-center size-5 rounded-full border transition-colors",
                        done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-ink-muted/60 hover:border-brand-500",
                      )}
                    >
                      {done && <Check className="size-3" strokeWidth={3} />}
                    </button>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={cn(
                        "font-medium text-ink",
                        done && "line-through text-ink-muted",
                      )}
                    >
                      {task.title}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {project && (
                      <span className="inline-flex items-center gap-1.5 text-ink-soft">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate max-w-[180px]">{project.name}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {assignee && (
                      <span className="inline-flex items-center gap-2">
                        <Avatar member={assignee} size="sm" />
                        <span className="text-ink-soft whitespace-nowrap">
                          {assignee.name}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {task.dueDate && <DueText date={task.dueDate} done={done} />}
                  </td>
                  <td className="py-3.5 pr-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="py-3.5 pr-6">
                    <StatusBadge status={task.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows?.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">
            該当するタスクはありません
          </p>
        )}
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-1 py-3 border-t border-line text-sm font-medium text-ink-soft hover:bg-surface-muted transition-colors"
      >
        すべてのタスクを表示
        <ChevronDown className="size-4" />
      </button>
    </SectionCard>
  );
}
