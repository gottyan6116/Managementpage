import { BillingView } from "@/components/billing/billing-view";
import { PageHeader } from "@/components/shared/page-header";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="請求・売上"
        subtitle="契約金額、請求済、未請求、粗利を案件別に管理"
      />
      <BillingView />
    </>
  );
}
