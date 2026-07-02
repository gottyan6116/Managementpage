import { PageHeader } from "@/components/shared/page-header";
import { DocumentsAndFiles } from "@/components/documents/documents-and-files";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="ドキュメント"
        subtitle="案件に紐づく資料・ファイルをまとめて管理"
      />
      <DocumentsAndFiles />
    </>
  );
}
