"use client";

import { Briefcase, CalendarClock, CalendarDays, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Donut, MiniBarChart, Sparkline } from "@/components/shared/charts";
import { useDashboardKpi } from "@/lib/queries/hooks";
import { getKpiSeries } from "@/lib/repositories";

/** Todo ダッシュボード KPI 4枚 (docs/04 §1) */
export function TodoKpiRow() {
  const { data: kpi } = useDashboardKpi();
  const series = getKpiSeries();

  const completion = kpi ? Math.round((kpi.doneTasks / kpi.totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <KpiCard
        icon={Briefcase}
        iconColor="#2563EB"
        iconBg="#DBE8FE"
        label="担当プロジェクト"
        value={kpi?.activeProjects ?? "—"}
        sub="進行中の案件"
        trend={{ value: "+2", dir: "up", tone: "good" }}
        graph={<Sparkline data={series.projectsTrend} color="#2563EB" />}
      />
      <KpiCard
        icon={CheckCircle2}
        iconColor="#0F766E"
        iconBg="#CCFBF1"
        label="タスク完了率"
        value={`${completion}%`}
        sub={`完了 ${kpi?.doneTasks ?? 0}/${kpi?.totalTasks ?? 0}`}
        graph={
          <Donut
            size={56}
            thickness={9}
            slices={[
              { label: "完了", value: completion, color: "#14B8A6" },
              { label: "未完", value: 100 - completion, color: "#E8EDF3" },
            ]}
            centerTop={
              <span className="text-[11px] font-bold text-teal-500">{completion}%</span>
            }
          />
        }
      />
      <KpiCard
        icon={CalendarClock}
        iconColor="#7C3AED"
        iconBg="#EDE9FE"
        label="今週の予定タスク"
        value={18}
        sub={<span className="text-red-500 font-medium">期限超過 2件</span>}
        graph={<MiniBarChart data={series.weeklyTasks} color="#8B5CF6" />}
      />
      <KpiCard
        icon={CalendarDays}
        iconColor="#D97706"
        iconBg="#FEF3C7"
        label="今月の期限タスク"
        value={27}
        sub={<span className="text-orange-500 font-medium">今週中に 11件</span>}
        graph={<MiniBarChart data={series.monthlyDue} color="#F59E0B" />}
      />
    </div>
  );
}
