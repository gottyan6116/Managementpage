import { GanttKpiRow } from "@/components/gantt/gantt-kpi";
import { GanttBoard } from "@/components/gantt/gantt-board";

export default function GanttPage() {
  return (
    <>
      {/* ページタイトルは置かず、KPI → ガント本体の順で情報から始める */}
      <div className="mb-5">
        <GanttKpiRow />
      </div>

      {/* ガントを全幅で表示 */}
      <GanttBoard />
    </>
  );
}
