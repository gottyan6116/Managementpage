"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useCreateDocument, useDocuments, useProjects } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";

export function DocumentsView() {
  const router = useRouter();
  const { data: documents, isLoading } = useDocuments();
  const { data: projects } = useProjects("all");
  const createDoc = useCreateDocument();

  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  function addDocument() {
    createDoc.mutate(undefined, {
      onSuccess: (doc) => router.push(`/documents/${doc.id}`),
    });
  }

  return (
    <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h2 className="text-base font-semibold text-ink">ドキュメント一覧</h2>
        <button
          type="button"
          onClick={addDocument}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="size-4" />
          新規ドキュメント
        </button>
      </div>

      {isLoading ? (
        <div className="divide-y divide-line/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-surface-muted/40" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-line">
              <th className="py-2.5 pl-5 font-medium">タイトル</th>
              <th className="py-2.5 font-medium">プロジェクト</th>
              <th className="py-2.5 pr-5 font-medium">更新日</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const project = doc.projectId ? projectMap.get(doc.projectId) : undefined;
              return (
                <tr key={doc.id} className="border-b border-line/60 hover:bg-surface-muted/50 transition-colors">
                  <td className="py-0 pl-5">
                    <Link href={`/documents/${doc.id}`} className="flex items-center gap-2.5 py-3.5">
                      <span
                        className="inline-flex items-center justify-center size-8 rounded-lg shrink-0"
                        style={{
                          backgroundColor: `${project?.color ?? "#7C3AED"}1A`,
                          color: project?.color ?? "#7C3AED",
                        }}
                      >
                        <FileText className="size-4" />
                      </span>
                      <span className="font-medium text-ink">{doc.title}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 text-ink-soft">
                    {project ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </span>
                    ) : (
                      <span className="text-ink-muted">未分類</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-5 text-ink-soft tabular-nums">{formatDue(doc.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <EmptyState
          icon={FileText}
          title="ドキュメントがありません"
          description="案件の議事録や設計メモを Markdown で残しましょう。"
          action={
            <button
              type="button"
              onClick={addDocument}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors"
            >
              <Plus className="size-4" />
              最初のドキュメントを作成
            </button>
          }
        />
      )}
    </div>
  );
}
