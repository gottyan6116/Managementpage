import { GanttKpiRow } from "@/components/gantt/gantt-kpi";
import { GanttBoard } from "@/components/gantt/gantt-board";

export default function GanttPage() {
  return (
    <>
      {/* タイトル + KPI を同一行に (タイトル左 / KPI 右) */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5 mb-6">
        <div className="min-w-0 shrink-0">
          <h1 className="text-[28px] leading-tight font-bold text-ink">ガントチャート</h1>
          <p className="text-sm text-ink-soft mt-1">
            全プロジェクトの進行状況と依存関係を可視化
          </p>
        </div>
        <div className="xl:flex-1 xl:max-w-[720px] w-full">
          <GanttKpiRow />
        </div>
      </div>

      {/* ガントを全幅で表示 */}
      <GanttBoard />
    </>
  );
}
