import { PageHeader } from "@/components/shared/page-header";
import { BoardKanban } from "@/components/board/board-kanban";

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="ボード"
        subtitle="タスクをドラッグ&ドロップでステータス管理"
      />
      <BoardKanban />
    </>
  );
}
