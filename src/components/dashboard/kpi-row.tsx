"use client";

import { KpiCard } from "@/components/shared/kpi-card";
import { MiniBarChart, Sparkline } from "@/components/shared/charts";
import { useDashboardKpi } from "@/lib/queries/hooks";
import { getKpiSeries } from "@/lib/repositories";

/** サマリー KPI 3枚 (docs/04 §1) */
export function TodoKpiRow() {
  const { data: kpi } = useDashboardKpi();
  const series = getKpiSeries();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard
        label="担当プロジェクト"
        value={kpi?.activeProjects ?? "—"}
        sub="進行中の案件"
        href="/projects?tab=in_progress"
        trend={{ value: "+2", dir: "up", tone: "good" }}
        graph={<Sparkline data={series.projectsTrend} color="#2563EB" />}
      />
      <KpiCard
        label="今週の予定タスク"
        value={18}
        sub={<span className="text-red-500 font-medium">期限超過 2件</span>}
        href="/todo?tab=overdue"
        graph={<MiniBarChart data={series.weeklyTasks} color="#8B5CF6" />}
      />
      <KpiCard
        label="今月の期限タスク"
        value={27}
        sub={<span className="text-orange-500 font-medium">今週中に 11件</span>}
        href="/gantt"
        graph={<MiniBarChart data={series.monthlyDue} color="#F59E0B" />}
      />
    </div>
  );
}
