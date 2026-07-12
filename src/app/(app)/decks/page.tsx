import { PageHeader } from "@/components/shared/page-header";
import { DecksView } from "@/components/decks/decks-view";

export default function DecksPage() {
  return (
    <>
      <PageHeader
        title="資料 (PPT)"
        subtitle="アップロードしたプレゼン資料をいつでもダウンロードできます"
      />
      <DecksView />
    </>
  );
}
