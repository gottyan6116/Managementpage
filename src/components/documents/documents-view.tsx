"use client";

import { useMemo, useState } from "react";
import { FileText, Pencil, Plus } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { useDocuments, useProjects } from "@/lib/queries/hooks";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

export function DocumentsView() {
  const { data: documents } = useDocuments();
  const { data: projects } = useProjects("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  // 未選択時は先頭を表示 (effect での setState を避ける)
  const selected =
    documents?.find((d) => d.id === selectedId) ?? documents?.[0];
  const selProject = selected?.projectId ? projectMap.get(selected.projectId) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
      {/* 一覧 */}
      <div className="rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">ドキュメント</h2>
          <button className="inline-flex items-center gap-1 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 px-2.5 text-xs font-semibold text-white transition-colors">
            <Plus className="size-3.5" />
            新規
          </button>
        </div>
        <ul className="max-h-[560px] overflow-y-auto">
          {documents?.map((doc) => {
            const project = doc.projectId ? projectMap.get(doc.projectId) : undefined;
            const active = doc.id === selected?.id;
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-5 py-3.5 text-left border-b border-line/60 transition-colors",
                    active ? "bg-brand-50" : "hover:bg-surface-muted/60",
                  )}
                >
                  <span
                    className="mt-0.5 inline-flex items-center justify-center size-8 rounded-lg shrink-0"
                    style={{
                      backgroundColor: `${project?.color ?? "#3B82F6"}1A`,
                      color: project?.color ?? "#3B82F6",
                    }}
                  >
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium truncate", active ? "text-brand-700" : "text-ink")}>
                      {doc.title}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      {project?.name ?? "未分類"} ・ {formatDue(doc.updatedAt)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* プレビュー */}
      <div className="rounded-2xl bg-surface border border-line shadow-card min-h-[400px]">
        {selected ? (
          <article className="p-8">
            <header className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-line">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-ink">{selected.title}</h1>
                <p className="text-xs text-ink-muted mt-1">
                  {selProject?.name ?? "未分類"} ・ 更新 {formatDue(selected.updatedAt)}
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line px-3 text-sm font-medium text-ink-soft hover:bg-surface-muted transition-colors shrink-0">
                <Pencil className="size-4" />
                編集
              </button>
            </header>
            <Markdown source={selected.body} />
          </article>
        ) : (
          <div className="flex items-center justify-center h-80 text-sm text-ink-muted">
            ドキュメントを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
