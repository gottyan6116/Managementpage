"use client";

import { Activity, AlertTriangle, Flag, Gauge } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { Donut } from "@/components/shared/charts";

/** ガント上部 KPI 4枚 (docs/04 §2) */
export function GanttKpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <KpiCard
        icon={Activity}
        iconColor="#2563EB"
        iconBg="#DBE8FE"
        label="進行中タスク"
        value={42}
        sub="全体の 58%"
      />
      <KpiCard
        icon={AlertTriangle}
        iconColor="#DC2626"
        iconBg="#FEE2E2"
        label="遅延タスク"
        value={8}
        sub={<span className="text-red-500 font-medium">全体の 11%</span>}
      />
      <KpiCard
        icon={Flag}
        iconColor="#7C3AED"
        iconBg="#EDE9FE"
        label="今週のマイルストーン"
        value={6}
        sub="完了予定"
      />
      <KpiCard
        icon={Gauge}
        iconColor="#0F766E"
        iconBg="#CCFBF1"
        label="稼働率"
        value="78%"
        sub="最適水準"
        graph={
          <Donut
            size={56}
            thickness={9}
            slices={[
              { label: "稼働", value: 78, color: "#14B8A6" },
              { label: "空き", value: 22, color: "#E8EDF3" },
            ]}
            centerTop={<span className="text-[11px] font-bold text-teal-500">78%</span>}
          />
        }
      />
    </div>
  );
}
