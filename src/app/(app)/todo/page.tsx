import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TodayFocusCard } from "@/components/dashboard/today-focus";
import { SpotlightGrid } from "@/components/dashboard/spotlight-grid";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { WorkTabs } from "@/components/dashboard/work-tabs";
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
        title="サマリー"
        subtitle="今日のタスクとプロジェクトの進捗を一覧で確認"
      />

      <div className="space-y-5">
        {/* 行A: 今日のフォーカス (2/3) + 注目の項目 (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lg:col-span-2 min-w-0">
            <TodayFocusCard />
          </div>
          <div className="min-w-0">
            <SpotlightGrid />
          </div>
        </div>

        {/* 行B: ガントプレビュー (2/3) + 今後の期限 (1/3) */}
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

        {/* 行C: リスト / ボード / タイムライン */}
        <WorkTabs initialTab={initialTab} />
      </div>
    </>
  );
}
