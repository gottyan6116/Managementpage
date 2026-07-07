import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { BoardKanban } from "@/components/board/board-kanban";

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="ボード"
        subtitle="タスクをドラッグ&ドロップでステータス管理"
      />
      {/* useSearchParams (?task= ハイライト) を使うため Suspense 境界が必要 */}
      <Suspense>
        <BoardKanban />
      </Suspense>
    </>
  );
}
