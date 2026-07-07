"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Settings2,
  X,
} from "lucide-react";
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

type DueFilter = "today" | "week" | null;

const DUE_FILTER_LABEL: Record<Exclude<DueFilter, null>, string> = {
  today: "期限: 今日",
  week: "期限: 今週",
};

function isTaskTab(value: string | null): value is TaskTab {
  return value === "all" || value === "mine" || value === "overdue" || value === "done";
}

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
  const searchParams = useSearchParams();

  // URL クエリを唯一の状態源にする (KPI カード等からのリンクで確実に切り替わる)
  const tabParam = searchParams.get("tab");
  const tab: TaskTab = isTaskTab(tabParam) ? tabParam : initialTab;
  const dueParam = searchParams.get("due");
  const dueFilter: DueFilter = dueParam === "today" || dueParam === "week" ? dueParam : null;

  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data: tasks } = useTasks({ tab, projectId });
  const { data: allTasksForCount } = useTasks({ tab: "all", projectId });
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");
  const toggle = useToggleTaskDone({ tab, projectId });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

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

  const filtered = useMemo(() => {
    let list = tasks ?? [];
    if (dueFilter) {
      list = list.filter((t) => {
        if (!t.dueDate || t.status === "done") return false;
        const d = daysUntil(t.dueDate);
        return dueFilter === "today" ? d === 0 : d >= 0 && d <= 7;
      });
    }
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    return list;
  }, [tasks, dueFilter, priorityFilter]);
  const rows = limit && !showAll ? filtered.slice(0, limit) : filtered;
  const hiddenCount = limit ? Math.max(0, filtered.length - limit) : 0;

  function replaceQuery(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setTab(next: TaskTab) {
    replaceQuery((params) => {
      if (next === initialTab) params.delete("tab");
      else params.set("tab", next);
      params.delete("due"); // タブ切替時は期限フィルタを解除して状態を単純に保つ
    });
  }

  function clearDueFilter() {
    replaceQuery((params) => params.delete("due"));
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowLeft" ? -1 : 1;
    const next = (index + delta + TABS.length) % TABS.length;
    tabRefs.current[next]?.focus();
    setTab(TABS[next].key);
  }

  const rowPadding = compact ? "py-2" : "py-3.5";

  return (
    <SectionCard bodyClassName="px-0 pb-0" className="data-card">
      {/* タブ + ツール */}
      <div className="flex items-center justify-between gap-3 px-6 -mt-1 border-b border-line">
        <div
          role="tablist"
          aria-label="タスクの絞り込み"
          className="flex items-center gap-5 overflow-x-auto no-scrollbar"
        >
          {TABS.map((t, i) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.key)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={cn(
                  "relative flex items-center gap-1.5 py-3 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "text-brand-600 font-semibold"
                    : "text-ink-soft hover:text-ink",
                )}
              >
                {t.label}
                <span className="text-xs text-ink-soft">{counts[t.key]}</span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </button>
            );
          })}
          {dueFilter && (
            <button
              type="button"
              onClick={clearDueFilter}
              title="期限フィルタを解除"
              className="inline-flex items-center gap-1 h-7 rounded-full border border-brand-300 bg-brand-50 px-2.5 text-xs font-medium text-brand-700 whitespace-nowrap"
            >
              {DUE_FILTER_LABEL[dueFilter]}
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={priorityRef}>
            <button
              type="button"
              onClick={() => setPriorityOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={priorityOpen}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                priorityFilter === "all"
                  ? "border-line text-ink-soft hover:bg-surface-muted"
                  : "border-brand-300 bg-brand-50 text-brand-700",
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              {PRIORITY_OPTIONS.find((o) => o.key === priorityFilter)?.label}
              <ChevronDown className="size-3.5" />
            </button>
            {priorityOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-40 rounded-xl border border-line bg-surface shadow-pop p-1.5 z-30"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={priorityFilter === o.key}
                    onClick={() => {
                      setPriorityFilter(o.key);
                      setPriorityOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs text-left transition-colors",
                      priorityFilter === o.key
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-ink hover:bg-surface-muted",
                    )}
                  >
                    {o.label}
                    {priorityFilter === o.key && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCompact((v) => !v)}
            aria-pressed={compact}
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
            <tr className="text-left text-xs text-ink-soft">
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
            {rows.map((task) => {
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
                  <td className={cn("pl-4", rowPadding)}>
                    {/* 当たり判定 36px / 視覚円 20px (タッチターゲット確保) */}
                    <button
                      type="button"
                      onClick={() => toggle.mutate(task.id)}
                      aria-label={done ? "未完了に戻す" : "完了にする"}
                      className="group/check inline-flex items-center justify-center size-9 rounded-full"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center size-5 rounded-full border transition-colors",
                          done
                            ? "bg-[#16A34A] border-[#16A34A] text-white"
                            : "border-ink-muted/60 group-hover/check:border-brand-500",
                        )}
                      >
                        {done && <Check className="size-3" strokeWidth={3} />}
                      </span>
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
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-soft">
            該当するタスクはありません
          </p>
        )}
      </div>

      {limit && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-3 border-t border-line text-sm font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          {showAll ? "表示を減らす" : `残り${hiddenCount}件を表示`}
          {showAll ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      )}
    </SectionCard>
  );
}
