import { PageHeader } from "@/components/shared/page-header";
import { IssueBoardGrid } from "@/components/issue-tree/board-grid";

export default function IssueTreePage() {
  return (
    <>
      <PageHeader
        title="Issue Tree"
        subtitle="案件ごとの論点・ロジック・KPI・業務プロセスを構造化し、仮説検証から施策化まで管理"
      />
      <IssueBoardGrid />
    </>
  );
}
