import { PageHeader } from "@/components/shared/page-header";
import { DocumentsView } from "@/components/documents/documents-view";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="ドキュメント"
        subtitle="案件に紐づく資料を Markdown で管理"
      />
      <DocumentsView />
    </>
  );
}
