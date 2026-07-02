import { PageHeader } from "@/components/shared/page-header";
import { TimeView } from "@/components/time/time-view";

export default function TimePage() {
  return (
    <>
      <PageHeader
        title="工数"
        subtitle="タスク単位の実績工数と案件別の消化状況を管理"
      />
      <TimeView />
    </>
  );
}
