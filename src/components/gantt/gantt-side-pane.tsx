"use client";

import { useMemo } from "react";
import { Flag } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { ProgressBar } from "@/components/shared/progress-bar";
import { useGanttRows, useMilestones, useProjects } from "@/lib/queries/hooks";
import { formatDue, relativeDayLabel } from "@/lib/date";

export function GanttSidePane() {
  const { data: milestones } = useMilestones();
  const { data: projects } = useProjects("all");
  const { data: ganttRows } = useGanttRows();

  const nameOf = useMemo(() => {
    const map = new Map(projects?.map((p) => [p.id, p]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [projects]);

  // ガントに表示中のプロジェクト行と同じ集合・進捗で揃える
  const summary = ganttRows?.filter((r) => r.type === "project") ?? [];
  const avg = summary.length
    ? Math.round(summary.reduce((s, p) => s + p.progress, 0) / summary.length)
    : 0;

  return (
    <div className="space-y-5">
      <SectionCard title="近日のマイルストーン" bodyClassName="pb-4">
        <ul className="space-y-3">
          {milestones?.slice(0, 5).map((ms) => {
            const project = nameOf(ms.projectId);
            return (
              <li key={ms.id} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 inline-flex items-center justify-center size-7 rounded-lg shrink-0"
                  style={{
                    backgroundColor: `${project?.color ?? "#3B82F6"}1A`,
                    color: project?.color ?? "#3B82F6",
                  }}
                >
                  <Flag className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{ms.title}</p>
                  <p className="text-xs text-ink-muted truncate">{project?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-ink-soft tabular-nums">{formatDue(ms.dueDate)}</p>
                  <p className="text-[11px] font-semibold text-brand-600">
                    {relativeDayLabel(ms.dueDate)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="プロジェクト進捗サマリー" bodyClassName="pb-4">
        <ul className="space-y-3">
          {summary.map((p) => (
            <li key={p.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-ink truncate">{p.label}</span>
              </div>
              <ProgressBar value={p.progress} color={p.color} />
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
          <span className="text-sm font-medium text-ink-soft">全体平均</span>
          <span className="text-lg font-bold text-ink tabular-nums">{avg}%</span>
        </div>
      </SectionCard>
    </div>
  );
}
