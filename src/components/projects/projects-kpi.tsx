"use client";

import { AlertCircle, Briefcase, CheckCircle2, Loader } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Donut, MiniBarChart, Sparkline } from "@/components/shared/charts";
import { getKpiSeries } from "@/lib/repositories";

/** 担当案件 KPI 4枚 (docs/04 §3) */
export function ProjectsKpiRow() {
  const series = getKpiSeries();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-5">
      <KpiCard
        icon={Briefcase}
        iconColor="#2563EB"
        iconBg="#DBE8FE"
        label="担当案件数"
        value={12}
        sub="件"
        href="/projects"
        trend={{ value: "+2件", dir: "up", tone: "good" }}
        graph={<Sparkline data={series.projectsCountTrend} color="#2563EB" />}
      />
      <KpiCard
        icon={Loader}
        iconColor="#0F766E"
        iconBg="#CCFBF1"
        label="進行中"
        value={8}
        sub="全体の 66%"
        href="/projects?tab=in_progress"
        graph={
          <Donut
            size={56}
            thickness={9}
            slices={[
              { label: "進行中", value: 66, color: "#14B8A6" },
              { label: "その他", value: 34, color: "#E8EDF3" },
            ]}
            centerTop={<span className="text-[11px] font-bold text-teal-500">66%</span>}
          />
        }
      />
      <KpiCard
        icon={AlertCircle}
        iconColor="#DC2626"
        iconBg="#FEE2E2"
        label="要注意"
        value={2}
        sub="件"
        href="/projects?tab=in_progress"
        trend={{ value: "-1件", dir: "down", tone: "good" }}
        graph={<MiniBarChart data={series.atRiskTrend} color="#F59E0B" />}
      />
      <KpiCard
        icon={CheckCircle2}
        iconColor="#D97706"
        iconBg="#FEF3C7"
        label="今月完了予定"
        value={3}
        sub="件"
        href="/gantt"
        trend={{ value: "+1件", dir: "up", tone: "good" }}
        graph={<MiniBarChart data={series.completeSoonTrend} color="#F59E0B" />}
      />
    </div>
  );
}
