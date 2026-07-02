"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, ListPlus, Pencil, Trash2 } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import {
  useCreateTask,
  useDeleteDocument,
  useDocument,
  useProjects,
  useUpdateDocument,
} from "@/lib/queries/hooks";
import { scheduleUndoableDelete } from "@/lib/undo-delete";
import { formatDue } from "@/lib/date";
import type { DocumentItem } from "@/types/domain";

export function DocumentDetail({ id }: { id: string }) {
  const { data: doc, isLoading } = useDocument(id);

  if (isLoading) {
    return <div className="h-[60vh] rounded-2xl bg-surface border border-line animate-pulse" />;
  }
  if (!doc) {
    return (
      <div className="rounded-2xl bg-surface border border-line shadow-card p-10 text-center">
        <p className="text-ink-soft">ドキュメントが見つかりませんでした。</p>
        <Link href="/documents" className="text-brand-600 text-sm mt-2 inline-block">
          ← 一覧へ戻る
        </Link>
      </div>
    );
  }
  return <Editor key={doc.id} doc={doc} />;
}

function Editor({ doc }: { doc: DocumentItem }) {
  const router = useRouter();
  const update = useUpdateDocument(doc.id);
  const deleteDoc = useDeleteDocument();
  const createTask = useCreateTask({ tab: "all", projectId: doc.projectId ?? undefined });
  const { data: projects } = useProjects("all");
  const [title, setTitle] = useState(doc.title);
  const [body, setBody] = useState(doc.body);
  const [projectId, setProjectId] = useState<string | null>(doc.projectId);

  const dirty = title !== doc.title || body !== doc.body || projectId !== doc.projectId;

  function save() {
    update.mutate({ title, body, projectId });
  }

  function remove() {
    router.push("/documents");
    scheduleUndoableDelete({
      ids: [doc.id],
      message: `「${doc.title}」を削除しました`,
      onCommit: () => deleteDoc.mutate(doc.id),
    });
  }

  const todoCandidates = body
    .split("\n")
    .map((line) => line.match(/^\s*-\s\[\s\]\s+(.+)/)?.[1]?.trim())
    .filter((text): text is string => Boolean(text));

  function createTasksFromTodos() {
    for (const title of todoCandidates) {
      createTask.mutate({ projectId, title });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] min-h-[520px]">
      {/* ヘッダ */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/documents"
          className="inline-flex items-center justify-center size-9 rounded-lg border border-line text-ink-soft hover:bg-surface-muted transition-colors shrink-0"
          aria-label="一覧へ戻る"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-0 text-xl font-bold text-ink bg-transparent outline-none border-b border-transparent focus:border-brand-300 py-1"
          placeholder="ドキュメントのタイトル"
        />
        <select
          value={projectId ?? ""}
          onChange={(e) => setProjectId(e.target.value || null)}
          className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink-soft shrink-0"
        >
          <option value="">未分類</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 text-sm font-semibold text-white transition-colors shrink-0"
        >
          {dirty ? "保存" : (<><Check className="size-4" /> 保存済み</>)}
        </button>
        <button
          type="button"
          onClick={createTasksFromTodos}
          disabled={todoCandidates.length === 0}
          className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed px-3 text-sm font-semibold text-ink-soft transition-colors shrink-0"
        >
          <ListPlus className="size-4" />
          ToDoをタスク化
        </button>
        <button
          type="button"
          onClick={remove}
          aria-label="ドキュメントを削除"
          title="削除"
          className="inline-flex items-center justify-center size-9 rounded-lg border border-line bg-surface text-ink-soft hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* 2ペイン: エディタ / プレビュー */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 h-10 border-b border-line text-xs font-medium text-ink-muted">
            <Pencil className="size-3.5" /> Markdown
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="# 見出し&#10;本文を Markdown で入力…"
            className="flex-1 w-full resize-none outline-none bg-transparent px-5 py-4 text-sm leading-7 text-ink-soft font-mono"
          />
        </div>
        <div className="flex flex-col rounded-2xl bg-surface border border-line shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-4 h-10 border-b border-line text-xs font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" /> プレビュー
            </span>
            <span>更新 {formatDue(doc.updatedAt)}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {body.trim() ? (
              <Markdown source={body} />
            ) : (
              <p className="text-sm text-ink-muted">本文を入力するとここにプレビューが表示されます。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
