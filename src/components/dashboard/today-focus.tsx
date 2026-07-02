"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, Play, Target } from "lucide-react";
import { useProjects, useTasks, useToggleTaskDone } from "@/lib/queries/hooks";
import { daysUntil, formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

export function TodayFocusCard() {
  const { data: tasks } = useTasks({ tab: "mine" });
  const { data: projects } = useProjects("all");
  const toggle = useToggleTaskDone({ tab: "mine" });
  const router = useRouter();

  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  const openTasks = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => t.status !== "done" && t.dueDate)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    [tasks],
  );
  const focus = openTasks[0] ?? null;
  const next = openTasks.slice(1, 5);

  if (!focus) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full flex items-center justify-center text-sm text-ink-muted">
        今取り組むべき未完了タスクはありません
      </div>
    );
  }

  const project = focus.projectId ? projectMap.get(focus.projectId) : undefined;
  const remain = focus.dueDate ? daysUntil(focus.dueDate) : null;

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
          <Target className="size-3.5" />
          最優先
        </span>
        {remain !== null && (
          <span
            className={cn(
              "text-xs font-semibold rounded-full px-2 py-0.5 whitespace-nowrap",
              remain < 0 ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700",
            )}
          >
            {remain < 0
              ? `期限超過 ${Math.abs(remain)}日`
              : remain === 0
                ? "本日期限"
                : `期限まで ${remain}日`}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-bold text-ink leading-snug">{focus.title}</h3>
      {project && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          {project.name}
        </p>
      )}
      {focus.description && (
        <p className="mt-2 text-sm text-ink-muted line-clamp-2">{focus.description}</p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/board")}
          className="primary-button inline-flex items-center gap-1.5 h-9 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors"
        >
          <Play className="size-3.5" />
          作業を開く
        </button>
        <button
          type="button"
          onClick={() => toggle.mutate(focus.id)}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3.5 text-sm font-semibold text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <Check className="size-3.5" />
          完了にする
        </button>
      </div>
      {next.length > 0 && (
        <div className="mt-5 pt-4 border-t border-line">
          <p className="mb-2 text-xs font-semibold text-ink-muted">次に迫るタスク</p>
          <ul className="space-y-2">
            {next.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink-soft">{t.title}</span>
                <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                  {t.dueDate && formatDue(t.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
