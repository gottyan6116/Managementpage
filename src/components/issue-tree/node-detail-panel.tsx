"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, ListPlus, Trash2 } from "lucide-react";
import {
  useCreateTask,
  useDeleteIssueNode,
  useUpdateIssueNode,
} from "@/lib/queries/hooks";
import { ISSUE_STATUS_META, ISSUE_STATUS_ORDER } from "@/lib/issue-tree";
import { PRIORITY_LABEL } from "@/lib/labels";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { IssueBoard, IssueNode, IssueNodeStatus, Priority } from "@/types/domain";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

/** 選択ノードの詳細編集パネル (desktop: 右カラム / mobile: 下部ドロワーの中身) */
export function NodeDetailPanel({
  node,
  board,
  onDeleted,
}: {
  node: IssueNode;
  board: IssueBoard;
  onDeleted: () => void;
}) {
  const update = useUpdateIssueNode(board.id);
  const remove = useDeleteIssueNode(board.id);
  const createTask = useCreateTask({ tab: "all" });

  const [title, setTitle] = useState(node.title);
  const [hypothesis, setHypothesis] = useState(node.hypothesis);
  const [evidence, setEvidence] = useState(node.evidence);
  const [dataNeeded, setDataNeeded] = useState(node.dataNeeded);
  const [method, setMethod] = useState(node.method);
  const [status, setStatus] = useState<IssueNodeStatus>(node.status);
  const [priority, setPriority] = useState<Priority>(node.priority);
  const [taskCreating, setTaskCreating] = useState(false);

  const dirty =
    title !== node.title ||
    hypothesis !== node.hypothesis ||
    evidence !== node.evidence ||
    dataNeeded !== node.dataNeeded ||
    method !== node.method ||
    status !== node.status ||
    priority !== node.priority;

  function save() {
    update.mutate({
      id: node.id,
      title,
      hypothesis,
      evidence,
      dataNeeded,
      method,
      status,
      priority,
    });
  }

  async function createTaskFromNode() {
    setTaskCreating(true);
    try {
      const task = await createTask.mutateAsync({
        projectId: board.projectId,
        title: `[検証] ${title}`,
        priority,
      });
      update.mutate({ id: node.id, status: "actionized", createdTaskId: task.id });
      setStatus("actionized");
    } finally {
      setTaskCreating(false);
    }
  }

  function handleDelete() {
    if (!window.confirm(`「${node.title}」を子ノードごと削除します。よろしいですか？`)) return;
    remove.mutate(node.id, { onSuccess: onDeleted });
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">タイトル</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand-300"
        />
      </div>

      {/* ステータス: 5値をセグメントで選択 */}
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">ステータス</label>
        <div className="flex flex-wrap gap-1.5">
          {ISSUE_STATUS_ORDER.map((s) => {
            const meta = ISSUE_STATUS_META[s];
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  active ? "border-transparent" : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
                style={active ? { color: meta.fg, backgroundColor: meta.bg } : undefined}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">優先度</label>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-pressed={priority === p}
              className={cn(
                "flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                priority === p
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
              )}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <Field label="仮説" value={hypothesis} onChange={setHypothesis} placeholder="この論点に対する仮説" />
      <Field label="根拠" value={evidence} onChange={setEvidence} placeholder="仮説を支持/棄却する事実・データ" />
      <Field label="必要データ" value={dataNeeded} onChange={setDataNeeded} placeholder="検証に必要なデータソース" />
      <Field label="検証方法" value={method} onChange={setMethod} placeholder="どう検証するか (分析/テスト/ヒアリング…)" />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={!dirty}
          className="primary-button inline-flex flex-1 items-center justify-center gap-1.5 h-9 rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {dirty ? "保存" : (<><Check className="size-4" /> 保存済み</>)}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="このノードを削除"
          title="削除"
          className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* タスク連携 */}
      <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
        {node.createdTaskId ? (
          <Link
            href={`/board?task=${node.createdTaskId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ExternalLink className="size-4" />
            作成済みタスクをボードで開く
          </Link>
        ) : (
          <button
            type="button"
            onClick={createTaskFromNode}
            disabled={taskCreating}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            <ListPlus className="size-4" />
            {taskCreating ? "作成中…" : "この論点からタスク作成"}
          </button>
        )}
        <p className="mt-1 text-[11px] text-ink-soft leading-relaxed">
          {board.projectId
            ? "紐付く案件のタスクとして作成し、このノードを施策化済みにします。"
            : "未分類タスクとして作成し、このノードを施策化済みにします。"}
        </p>
      </div>

      <p className="text-[11px] text-ink-soft text-right">最終更新 {formatDue(node.updatedAt)}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand-300 placeholder:text-ink-muted"
      />
    </div>
  );
}
