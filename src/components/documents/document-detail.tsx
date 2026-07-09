"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  Check,
  Copy,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListPlus,
  Pilcrow,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useCreateTask,
  useDeleteDocument,
  useDocument,
  useProjects,
  useUpdateDocument,
} from "@/lib/queries/hooks";
import { scheduleUndoableDelete } from "@/lib/undo-delete";
import { formatDue } from "@/lib/date";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown-html";
import { cn } from "@/lib/utils";
import type { DocumentItem } from "@/types/domain";

export function DocumentDetail({ id }: { id: string }) {
  const { data: doc, isLoading } = useDocument(id);

  if (isLoading) {
    return <div className="h-[60vh] rounded-2xl bg-surface border border-line animate-pulse" />;
  }
  if (!doc) {
    return (
      <div className="data-card rounded-2xl p-10 text-center">
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
  // body は常に Markdown 文字列 (保存形式・ToDo検出・タスク化ロジックの単一の真実)
  const [body, setBody] = useState(doc.body);
  const [projectId, setProjectId] = useState<string | null>(doc.projectId);
  const [copied, setCopied] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);

  const dirty = title !== doc.title || body !== doc.body || projectId !== doc.projectId;

  // 左ペイン (contentEditable) の初期表示。doc が切り替わったときだけ流し込む。
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = markdownToHtml(doc.body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  function syncFromEditable() {
    if (editableRef.current) {
      setBody(htmlToMarkdown(editableRef.current.innerHTML));
    }
  }

  function exec(command: string, value?: string) {
    editableRef.current?.focus();
    document.execCommand(command, false, value);
    syncFromEditable();
  }

  function save() {
    update.mutate({ title, body, projectId });
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード権限がない環境ではコピーボタンは静かに失敗する
    }
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
          className="primary-button inline-flex items-center gap-1.5 h-9 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed px-3.5 text-sm font-semibold text-white transition-colors shrink-0"
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

      {/* 2ペイン: 本文入力 (普通の文章) / Markdownソース (AIへコピペ用) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <div className="data-card flex flex-col rounded-2xl overflow-hidden">
          <div className="flex items-center gap-1 px-2 h-11 border-b border-line shrink-0 overflow-x-auto no-scrollbar">
            <ToolbarButton label="見出し1" onClick={() => exec("formatBlock", "H1")}>
              <Heading1 className="size-4" />
            </ToolbarButton>
            <ToolbarButton label="見出し2" onClick={() => exec("formatBlock", "H2")}>
              <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton label="見出し3" onClick={() => exec("formatBlock", "H3")}>
              <Heading3 className="size-4" />
            </ToolbarButton>
            <span className="w-px h-5 bg-line mx-1 shrink-0" />
            <ToolbarButton label="本文" onClick={() => exec("formatBlock", "P")}>
              <Pilcrow className="size-4" />
            </ToolbarButton>
            <ToolbarButton label="太字" onClick={() => exec("bold")}>
              <Bold className="size-4" />
            </ToolbarButton>
            <span className="w-px h-5 bg-line mx-1 shrink-0" />
            <ToolbarButton label="箇条書き" onClick={() => exec("insertUnorderedList")}>
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton label="番号付きリスト" onClick={() => exec("insertOrderedList")}>
              <ListOrdered className="size-4" />
            </ToolbarButton>
          </div>
          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncFromEditable}
            onBlur={syncFromEditable}
            data-placeholder="本文を入力…（見出しや箇条書きは上のボタンで指定できます）"
            className="doc-editable flex-1 w-full overflow-y-auto outline-none bg-transparent px-6 py-4 text-sm leading-7 text-ink"
          />
        </div>
        <div className="data-card flex flex-col rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 h-11 border-b border-line text-xs font-medium text-ink-soft shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Markdown（AIへコピペ用）
            </span>
            <div className="flex items-center gap-3">
              <span>更新 {formatDue(doc.updatedAt)}</span>
              <button
                type="button"
                onClick={copyMarkdown}
                className={cn(
                  "inline-flex items-center gap-1 h-7 rounded-md border px-2 text-xs font-semibold transition-colors",
                  copied
                    ? "border-[#16A34A] bg-[#DCFCE7] text-[#15803D]"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
              >
                <Copy className="size-3.5" />
                {copied ? "コピーしました" : "コピー"}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={body}
            placeholder="左側に本文を入力すると、ここに Markdown ソースが表示されます。"
            className="flex-1 w-full resize-none outline-none bg-transparent px-5 py-4 text-sm leading-7 text-ink-soft font-mono"
          />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // mousedown で preventDefault し、contentEditable のフォーカス/選択範囲を保持したまま実行する
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex items-center justify-center size-8 shrink-0 rounded-lg text-ink-soft hover:bg-surface-muted hover:text-ink transition-colors"
    >
      {children}
    </button>
  );
}
