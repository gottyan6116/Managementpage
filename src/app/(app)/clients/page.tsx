import { ClientsView } from "@/components/clients/clients-view";
import { PageHeader } from "@/components/shared/page-header";

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="クライアント"
        subtitle="企業ごとの案件、担当者連絡先、対応履歴を集約"
      />
      <ClientsView />
    </>
  );
}
