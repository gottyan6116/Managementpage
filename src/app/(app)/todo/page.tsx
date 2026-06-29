import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TodoKpiRow } from "@/components/dashboard/kpi-row";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { TaskTable } from "@/components/dashboard/task-table";
import { BoardPreview } from "@/components/dashboard/board-preview";
import { GanttChart } from "@/components/gantt/gantt-chart";
import type { TaskTab } from "@/lib/repositories";

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = (tab as TaskTab) ?? "all";
  return (
    <>
      <PageHeader
        title="Todo"
        subtitle="今日のタスクとプロジェクトの進捗を一覧で確認"
      />

      <div className="space-y-5">
        <TodoKpiRow />

        {/* 行A: ガントプレビュー (2/3) + 今後の期限 (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 min-w-0">
            <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 className="text-base font-semibold text-ink">
                  ガントチャート
                  <span className="ml-2 text-xs font-normal text-ink-muted">
                    今週のプレビュー
                  </span>
                </h2>
                <Link
                  href="/gantt"
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  ガントチャートへ
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              <div className="px-3 pb-3">
                <GanttChart variant="preview" height={240} />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <UpcomingList />
          </div>
        </div>

        {/* 行B: タスク一覧 (2/3) + ボードプレビュー (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 min-w-0">
            <TaskTable limit={6} initialTab={initialTab} />
          </div>
          <div className="min-w-0">
            <BoardPreview />
          </div>
        </div>
      </div>
    </>
  );
}
