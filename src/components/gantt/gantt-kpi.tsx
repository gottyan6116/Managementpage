"use client";

import { Activity, AlertTriangle, Flag, type LucideIcon } from "lucide-react";
import { useMilestones, useTasks } from "@/lib/queries/hooks";
import { daysUntil } from "@/lib/date";

function CompactKpi({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  subTone,
  graph,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub: string;
  subTone?: "muted" | "danger";
  graph?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-line shadow-card px-4 py-3 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center size-7 rounded-lg shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-xs text-ink-soft truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-1 mt-1.5">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink leading-none tabular-nums">{value}</p>
          <p
            className={
              subTone === "danger"
                ? "text-[11px] font-medium text-red-500 mt-1"
                : "text-[11px] text-ink-muted mt-1"
            }
          >
            {sub}
          </p>
        </div>
        {graph}
      </div>
    </div>
  );
}

/** ガント上部 KPI 4枚 (docs/04 §2)。固定値ではなく実データから算出する。 */
export function GanttKpiRow() {
  const { data: tasks } = useTasks({ tab: "all" });
  const { data: milestones } = useMilestones();

  const list = tasks ?? [];
  const total = list.length;
  const inProgress = list.filter((t) => t.status === "in_progress").length;
  const overdue = list.filter(
    (t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done",
  ).length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const weekMilestones = (milestones ?? []).filter((m) => {
    if (m.isDone) return false;
    const d = daysUntil(m.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <CompactKpi
        icon={Activity}
        iconColor="#2563EB"
        iconBg="#DBE8FE"
        label="進行中タスク数"
        value={inProgress}
        sub={`全体の ${pct(inProgress)}%`}
      />
      <CompactKpi
        icon={AlertTriangle}
        iconColor="#DC2626"
        iconBg="#FEE2E2"
        label="遅延タスク"
        value={overdue}
        sub={overdue > 0 ? `全体の ${pct(overdue)}%` : "遅延なし"}
        subTone={overdue > 0 ? "danger" : "muted"}
      />
      <CompactKpi
        icon={Flag}
        iconColor="#7C3AED"
        iconBg="#EDE9FE"
        label="今週のマイルストーン"
        value={weekMilestones}
        sub="完了予定"
      />
    </div>
  );
}
