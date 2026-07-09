import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TodayFocusCard } from "@/components/dashboard/today-focus";
import { SpotlightGrid } from "@/components/dashboard/spotlight-grid";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { TaskTable } from "@/components/dashboard/task-table";
import { GanttChart } from "@/components/gantt/gantt-chart";
import type { TaskTab } from "@/lib/repositories";

export default async function TodoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = (tab as TaskTab) ?? "mine";
  return (
    <>
      {/* ホームはページタイトルを置かず、コンテンツ (今日の判断材料) から始める */}
      <div className="space-y-5">
        {/* 行A: 今日のフォーカス (2/3) + KPI (1/3) — 「今日何をすべきか」に最短で答える */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lg:col-span-2 min-w-0">
            <TodayFocusCard />
          </div>
          <div className="min-w-0">
            <SpotlightGrid />
          </div>
        </div>

        {/* 行B: タスク一覧 (実行対象を上へ。既定は自分のタスク) */}
        <TaskTable limit={8} initialTab={initialTab} />

        {/* 行C: ガントプレビュー (今週版・2/3) + 今後の期限 (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 min-w-0">
            <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 className="text-base font-semibold text-ink">
                  ガントチャート
                  <span className="ml-2 text-xs font-normal text-ink-soft">
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
      </div>
    </>
  );
}
