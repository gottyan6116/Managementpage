"use client";

import { Activity, AlertTriangle, Flag, Gauge, type LucideIcon } from "lucide-react";
import { Donut } from "@/components/shared/charts";

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

/** ガント上部 KPI 4枚 (docs/04 §2)。タイトル右にコンパクト横並び。 */
export function GanttKpiRow() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <CompactKpi
        icon={Activity}
        iconColor="#2563EB"
        iconBg="#DBE8FE"
        label="進行中タスク数"
        value={42}
        sub="全体の 58%"
      />
      <CompactKpi
        icon={AlertTriangle}
        iconColor="#DC2626"
        iconBg="#FEE2E2"
        label="遅延タスク"
        value={8}
        sub="全体の 11%"
        subTone="danger"
      />
      <CompactKpi
        icon={Flag}
        iconColor="#7C3AED"
        iconBg="#EDE9FE"
        label="今週のマイルストーン"
        value={6}
        sub="完了予定"
      />
      <CompactKpi
        icon={Gauge}
        iconColor="#0F766E"
        iconBg="#CCFBF1"
        label="稼働率(今週)"
        value="78%"
        sub="最適水準"
        graph={
          <Donut
            size={46}
            thickness={7}
            slices={[
              { label: "稼働", value: 78, color: "#14B8A6" },
              { label: "空き", value: 22, color: "#E8EDF3" },
            ]}
          />
        }
      />
    </div>
  );
}
