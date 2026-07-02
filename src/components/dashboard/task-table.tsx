"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, SlidersHorizontal, Settings2 } from "lucide-react";
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
import { self } from "@/lib/repositories";
import { daysUntil } from "@/lib/date";
import type { TaskTab } from "@/lib/repositories";
import type { Priority } from "@/types/domain";
import { cn } from "@/lib/utils";

const TABS: { key: TaskTab; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "mine", label: "自分のタスク" },
  { key: "overdue", label: "期限超過" },
  { key: "done", label: "完了" },
];

const PRIORITY_OPTIONS: { key: Priority | "all"; label: string }[] = [
  { key: "all", label: "すべての優先度" },
  { key: "high", label: "高のみ" },
  { key: "medium", label: "中のみ" },
  { key: "low", label: "低のみ" },
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
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [compact, setCompact] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { data: tasks } = useTasks({ tab, projectId });
  const { data: allTasksForCount } = useTasks({ tab: "all", projectId });
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

  const counts = useMemo(() => {
    const list = allTasksForCount ?? [];
    const me = self();
    return {
      all: list.length,
      mine: list.filter((t) => t.assigneeIds.includes(me.id)).length,
      overdue: list.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done")
        .length,
      done: list.filter((t) => t.status === "done").length,
    };
  }, [allTasksForCount]);

  const filtered = useMemo(
    () => (priorityFilter === "all" ? tasks : tasks?.filter((t) => t.priority === priorityFilter)),
    [tasks, priorityFilter],
  );
  const rows = limit && !showAll ? filtered?.slice(0, limit) : filtered;

  function cyclePriorityFilter() {
    const idx = PRIORITY_OPTIONS.findIndex((o) => o.key === priorityFilter);
    setPriorityFilter(PRIORITY_OPTIONS[(idx + 1) % PRIORITY_OPTIONS.length].key);
  }

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

  const rowPadding = compact ? "py-2" : "py-3.5";

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
                <span className="text-xs text-ink-muted">{counts[t.key]}</span>
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
            onClick={cyclePriorityFilter}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
              priorityFilter === "all"
                ? "border-line text-ink-soft hover:bg-surface-muted"
                : "border-brand-300 bg-brand-50 text-brand-700",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            {PRIORITY_OPTIONS.find((o) => o.key === priorityFilter)?.label}
          </button>
          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
              compact
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-line text-ink-soft hover:bg-surface-muted",
            )}
          >
            <Settings2 className="size-3.5" />
            {compact ? "コンパクト表示" : "標準表示"}
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
                  <td className={cn("pl-6", rowPadding)}>
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
                  <td className={cn("pr-4", rowPadding)}>
                    <span
                      className={cn(
                        "font-medium text-ink",
                        done && "line-through text-ink-muted",
                      )}
                    >
                      {task.title}
                    </span>
                  </td>
                  <td className={cn("pr-4", rowPadding)}>
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
                  <td className={cn("pr-4", rowPadding)}>
                    {assignee && (
                      <span className="inline-flex items-center gap-2">
                        <Avatar member={assignee} size="sm" />
                        <span className="text-ink-soft whitespace-nowrap">
                          {assignee.name}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className={cn("pr-4", rowPadding)}>
                    {task.dueDate && <DueText date={task.dueDate} done={done} />}
                  </td>
                  <td className={cn("pr-4", rowPadding)}>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className={cn("pr-6", rowPadding)}>
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

      {limit && (filtered?.length ?? 0) > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-3 border-t border-line text-sm font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          {showAll ? "表示を減らす" : "すべてのタスクを表示"}
          {showAll ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      )}
    </SectionCard>
  );
}
