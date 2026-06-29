import { PageHeader } from "@/components/shared/page-header";
import { GanttKpiRow } from "@/components/gantt/gantt-kpi";
import { GanttBoard } from "@/components/gantt/gantt-board";
import { GanttSidePane } from "@/components/gantt/gantt-side-pane";

export default function GanttPage() {
  return (
    <>
      <PageHeader
        title="ガントチャート"
        subtitle="全プロジェクトの進行状況と依存関係を可視化"
      />

      <div className="space-y-5">
        <GanttKpiRow />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="min-w-0">
            <GanttBoard />
          </div>
          <GanttSidePane />
        </div>
      </div>
    </>
  );
}
