import { PageHeader } from "@/components/shared/page-header";
import { NotesView } from "@/components/notes/notes-view";

export default function NotesPage() {
  return (
    <>
      <PageHeader title="メモ" subtitle="軽量なノート。ピン留め・色分けで整理" />
      <NotesView />
    </>
  );
}
