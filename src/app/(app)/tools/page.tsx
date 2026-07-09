import { PageHeader } from "@/components/shared/page-header";
import { ToolsGrid } from "@/components/tools/tools-grid";

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="その他ツール"
        subtitle="ProManage 本体とは連携していない、外部ツールへのリンク集"
      />
      <ToolsGrid />
    </>
  );
}
