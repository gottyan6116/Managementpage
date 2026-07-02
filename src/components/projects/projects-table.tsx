"use client";

import { Fragment, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { AvatarGroup } from "@/components/shared/avatar";
import { PhaseBadge, PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { DueText } from "@/components/shared/due-text";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionCard } from "@/components/shared/section-card";
import {
  useCreateProjectActivity,
  useDeleteGanttRow,
  useMembers,
  useProjects,
} from "@/lib/queries/hooks";
import { useToastStore } from "@/stores/toast-store";
import { scheduleUndoableDelete } from "@/lib/undo-delete";
import type { ProjectTab } from "@/lib/repositories";
import type { Member, Project, Priority } from "@/types/domain";
import { cn } from "@/lib/utils";

const TABS: { key: ProjectTab; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in_progress", label: "進行中" },
  { key: "done", label: "完了" },
  { key: "on_hold", label: "保留" },
];

const PRIORITY_OPTIONS: { key: Priority | "all"; label: string }[] = [
  { key: "all", label: "すべての優先度" },
  { key: "high", label: "高のみ" },
  { key: "medium", label: "中のみ" },
  { key: "low", label: "低のみ" },
];

const SORT_OPTIONS = [
  { key: "dueDate", label: "次回期限が近い順" },
  { key: "priority", label: "優先度が高い順" },
  { key: "name", label: "名前順" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function ProjectsTable({
  initialTab = "all",
}: {
  initialTab?: ProjectTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTabState] = useState<ProjectTab>(initialTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");

  const { data: projects } = useProjects(tab);
  const { data: members } = useMembers();
  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);
  const deleteProject = useDeleteGanttRow();
  const pendingDeleteIds = useToastStore((s) => s.pendingDeleteIds);

  const visibleProjects = useMemo(() => {
    let list = (projects ?? []).filter((p) => !pendingDeleteIds.has(p.id));
    if (priorityFilter !== "all") list = list.filter((p) => p.priority === priorityFilter);
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "ja");
      if (sortKey === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999");
    });
    return list;
  }, [projects, priorityFilter, sortKey, pendingDeleteIds]);

  function handleDelete(event: React.MouseEvent, id: string, name: string) {
    event.stopPropagation();
    if (expandedId === id) setExpandedId(null);
    scheduleUndoableDelete({
      ids: [id],
      message: `「${name}」とその配下のタスクを削除しました`,
      onCommit: () => deleteProject.mutate({ id, type: "project" }),
    });
  }

  function cycleSort() {
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sortKey);
    setSortKey(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
  }

  function cyclePriorityFilter() {
    const idx = PRIORITY_OPTIONS.findIndex((o) => o.key === priorityFilter);
    setPriorityFilter(PRIORITY_OPTIONS[(idx + 1) % PRIORITY_OPTIONS.length].key);
  }

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
    <SectionCard bodyClassName="px-0 pb-0" className="data-card">
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
            onClick={cycleSort}
            className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <ArrowUpDown className="size-3.5" />
            {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
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
              <th className="py-2.5 font-medium">優先度</th>
              <th className="py-2.5 font-medium">ステータス</th>
              <th className="py-2.5 pr-6 w-20" />
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map((p) => {
              const assignees = p.memberIds
                .map((id) => memberMap.get(id))
                .filter((m): m is NonNullable<typeof m> => Boolean(m));
              const done = p.status === "done";
              const expanded = expandedId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => setExpandedId(expanded ? null : p.id)}
                    className={cn(
                      "border-t border-line hover:bg-surface-muted/60 transition-colors cursor-pointer",
                      expanded && "bg-brand-50/40",
                    )}
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
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, p.id, p.name)}
                          aria-label={`${p.name}を削除`}
                          title="削除"
                          className="inline-flex items-center justify-center size-7 rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-500 transition"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        <ChevronDown
                          className={cn(
                            "size-4 text-ink-muted transition-transform",
                            expanded && "rotate-180 text-brand-600",
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                  {expanded && <ExpandedRow project={p} assignees={assignees} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {visibleProjects.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">該当する案件はありません</p>
        )}
      </div>
    </SectionCard>
  );
}

function ExpandedRow({
  project,
  assignees,
}: {
  project: Project;
  assignees: Member[];
}) {
  const createActivity = useCreateProjectActivity(project.id);
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);

  function saveMemo() {
    const text = memo.trim();
    if (!text) return;
    createActivity.mutate(text, {
      onSuccess: () => {
        setMemo("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }

  return (
    <tr className="border-t border-line bg-surface">
      <td colSpan={7} className="px-6 py-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">案件ガント</p>
            <p className="mb-3 text-xs text-ink-muted">
              行をもう一度クリックすると閉じます。バー編集はガント画面で行えます。
            </p>
            <GanttChart variant="preview" projectId={project.id} height={260} />
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-line bg-surface-muted/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold text-ink">
                <span className="flex items-center gap-2">
                  <StickyNote className="size-4 text-brand-600" />
                  案件メモ
                </span>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="size-3.5" />
                    保存しました
                  </span>
                )}
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={5}
                placeholder="次回確認、懸念点、顧客からの依頼など"
                className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-300"
              />
              <button
                type="button"
                onClick={saveMemo}
                disabled={!memo.trim() || createActivity.isPending}
                className="primary-button mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
              >
                保存（アクティビティに記録）
              </button>
            </section>

            <section className="rounded-xl border border-line bg-surface-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Users className="size-4 text-brand-600" />
                関係者リスト
              </div>
              {assignees.length > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <AvatarGroup members={assignees} max={5} />
                  <span className="text-xs text-ink-muted">{assignees.length}名</span>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">未設定</p>
              )}
            </section>
          </div>
        </div>
      </td>
    </tr>
  );
}
