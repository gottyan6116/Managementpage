import { PageHeader } from "@/components/shared/page-header";
import { FilesView } from "@/components/files/files-view";

export default function FilesPage() {
  return (
    <>
      <PageHeader title="ファイル" subtitle="案件のファイルをアップロード・共有" />
      <FilesView />
    </>
  );
}
