import { PageHeader } from "@/components/shared/page-header";
import { ProjectsKpiRow } from "@/components/projects/projects-kpi";
import { ProjectsTable } from "@/components/projects/projects-table";
import { ProjectsSidePane } from "@/components/projects/projects-side-pane";
import { NewProjectButton } from "@/components/projects/new-project-button";
import type { ProjectTab } from "@/lib/repositories";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = (tab as ProjectTab) ?? "all";

  return (
    <>
      <PageHeader
        title="担当案件"
        subtitle="自分が担当する案件の状況を一覧で管理"
        actions={<NewProjectButton />}
      />

      <div className="space-y-5">
        <ProjectsKpiRow />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
          <div className="min-w-0">
            <ProjectsTable initialTab={initialTab} />
          </div>
          <ProjectsSidePane />
        </div>
      </div>
    </>
  );
}
