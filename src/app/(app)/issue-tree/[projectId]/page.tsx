import { Suspense } from "react";
import { IssueTreeWorkspace } from "@/components/issue-tree/workspace/workspace";

export default async function IssueTreeWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    // useSearchParams (?view=) を使うため Suspense 境界が必要
    <Suspense>
      <IssueTreeWorkspace projectId={projectId} />
    </Suspense>
  );
}
