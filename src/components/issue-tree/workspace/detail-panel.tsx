"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  ListPlus,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  NODE_STATUS_META,
  NODE_STATUS_ORDER,
  NODE_TYPE_LABEL,
  type IssueTreeEvidenceItem,
  type IssueTreeNode,
  type IssueTreeNodeStatus,
  type IssueTreeNodeType,
  type IssueTreePriority,
  type IssueTreeProject,
} from "@/lib/issue-tree/domain";
import type { IssueTreeNodePatch } from "@/lib/issue-tree/repository";
import {
  useUpdateIssueTreeNode,
} from "@/lib/queries/issue-tree-hooks";
import { useCreateTask, useMembers } from "@/lib/queries/hooks";
import { useIssueTreeStore } from "@/stores/issue-tree-store";
import { PRIORITY_LABEL } from "@/lib/labels";
import { formatDue } from "@/lib/date";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 800;

function createEvidenceItem(): IssueTreeEvidenceItem {
  return {
    id: `ev-${Date.now()}`,
    text: "",
    source: "",
    createdAt: new Date().toISOString(),
  };
}
const PRIORITIES: IssueTreePriority[] = ["high", "medium", "low"];
const NODE_TYPES: IssueTreeNodeType[] = [
  "question",
  "hypothesis",
  "driver",
  "metric",
  "process",
  "action",
];

/**
 * 選択ノードの詳細編集。テキスト系フィールドは 800ms デバウンスで保存し、
 * 正規化エラー時は再試行ボタンを出す。保存状態はミューテーション結果が駆動する。
 */
export function NodeDetailPanel({
  node,
  project,
  onRequestDelete,
}: {
  node: IssueTreeNode;
  project: IssueTreeProject;
  onRequestDelete: (node: IssueTreeNode) => void;
}) {
  const update = useUpdateIssueTreeNode(project.id);
  const createTask = useCreateTask({ tab: "all" });
  const { data: members } = useMembers();
  const saveError = useIssueTreeStore((s) => s.saveError);

  // 呼び出し側が key={node.id} を渡すため、ノード切替はコンポーネント再マウントで反映される
  const [draft, setDraft] = useState(node);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPatch = useRef<IssueTreeNodePatch | null>(null);
  const [taskCreating, setTaskCreating] = useState(false);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function commit(patch: IssueTreeNodePatch) {
    lastPatch.current = patch;
    update.mutate({ id: node.id, ...patch });
  }

  /** テキスト系: 800ms デバウンス保存 */
  function queueSave(patch: IssueTreeNodePatch) {
    setDraft((d) => ({ ...d, ...patch }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(patch), DEBOUNCE_MS);
  }

  /** 選択系: 即時保存 */
  function saveNow(patch: IssueTreeNodePatch) {
    setDraft((d) => ({ ...d, ...patch }));
    if (timer.current) clearTimeout(timer.current);
    commit(patch);
  }

  function retry() {
    if (lastPatch.current) update.mutate({ id: node.id, ...lastPatch.current });
  }

  /* エビデンス */
  function addEvidence() {
    saveNow({ evidenceItems: [...draft.evidenceItems, createEvidenceItem()] });
  }
  function updateEvidence(id: string, patch: Partial<IssueTreeEvidenceItem>) {
    queueSave({
      evidenceItems: draft.evidenceItems.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }
  function removeEvidence(id: string) {
    saveNow({ evidenceItems: draft.evidenceItems.filter((e) => e.id !== id) });
  }

  async function createTaskFromNode() {
    setTaskCreating(true);
    try {
      const task = await createTask.mutateAsync({
        projectId: project.linkedProjectId,
        title: `[検証] ${draft.title}`,
        priority: draft.priority,
      });
      saveNow({
        status: "actionized",
        linkedTaskIds: [...draft.linkedTaskIds, task.id],
      });
    } finally {
      setTaskCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {saveError && (
        <div className="flex items-start gap-2 rounded-xl border border-[#fde2e7] bg-[#fff0f2] p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#B91C1C]">{saveError}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-[#fbc4cf] bg-white px-2 py-1 text-[11px] font-semibold text-[#B91C1C] hover:bg-[#fff5f7]"
            >
              <RotateCcw className="size-3" />
              再試行
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">タイトル</label>
        <textarea
          value={draft.title}
          onChange={(e) => queueSave({ title: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium leading-snug text-ink outline-none focus:border-brand-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">種別</label>
          <select
            value={draft.nodeType}
            onChange={(e) => saveNow({ nodeType: e.target.value as IssueTreeNodeType })}
            className="w-full h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {NODE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">担当</label>
          <select
            value={draft.ownerId ?? ""}
            onChange={(e) => saveNow({ ownerId: e.target.value || null })}
            className="w-full h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
          >
            <option value="">未設定</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">ステータス</p>
        <div className="flex flex-wrap gap-1.5">
          {NODE_STATUS_ORDER.map((s: IssueTreeNodeStatus) => {
            const meta = NODE_STATUS_META[s];
            const active = draft.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => saveNow({ status: s })}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "border-transparent"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-soft">優先度</p>
          <div className="flex gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => saveNow({ priority: p })}
                aria-pressed={draft.priority === p}
                className={cn(
                  "flex-1 rounded-lg border px-1 py-1.5 text-xs font-semibold transition-colors",
                  draft.priority === p
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">期限</label>
          <input
            type="date"
            value={draft.deadline ?? ""}
            onChange={(e) => saveNow({ deadline: e.target.value || null })}
            className="w-full h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
          />
        </div>
      </div>

      <TextField
        label="仮説"
        value={draft.hypothesis}
        placeholder="この論点に対する仮説"
        onChange={(v) => queueSave({ hypothesis: v })}
      />

      {/* エビデンス */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-soft">根拠 (エビデンス)</p>
          <button
            type="button"
            onClick={addEvidence}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-50"
          >
            <Plus className="size-3" />
            追加
          </button>
        </div>
        <div className="space-y-2">
          {draft.evidenceItems.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-ink-soft">
              仮説を支持/棄却する事実・データを追加します。
            </p>
          )}
          {draft.evidenceItems.map((ev) => (
            <div key={ev.id} className="rounded-lg border border-line bg-surface p-2">
              <div className="flex items-start gap-1.5">
                <textarea
                  value={ev.text}
                  onChange={(e) => updateEvidence(ev.id, { text: e.target.value })}
                  placeholder="事実・データ"
                  rows={2}
                  className="min-w-0 flex-1 resize-none bg-transparent px-1 py-0.5 text-sm leading-snug text-ink outline-none placeholder:text-ink-muted"
                />
                <button
                  type="button"
                  onClick={() => removeEvidence(ev.id)}
                  aria-label="エビデンスを削除"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-500"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <input
                value={ev.source}
                onChange={(e) => updateEvidence(ev.id, { source: e.target.value })}
                placeholder="出典 (GA4 / ヒアリング…)"
                className="mt-1 w-full rounded-md bg-surface-muted/60 px-2 py-1 text-[11px] text-ink-soft outline-none placeholder:text-ink-muted"
              />
            </div>
          ))}
        </div>
      </div>

      <TextField
        label="必要データ"
        value={draft.validationData.dataNeeded}
        placeholder="検証に必要なデータソース"
        onChange={(v) =>
          queueSave({ validationData: { ...draft.validationData, dataNeeded: v } })
        }
      />
      <TextField
        label="検証方法"
        value={draft.validationData.method}
        placeholder="どう検証するか (分析/テスト/ヒアリング…)"
        onChange={(v) =>
          queueSave({ validationData: { ...draft.validationData, method: v } })
        }
      />
      <TextField
        label="結論"
        value={draft.conclusion}
        placeholder="検証から得られた結論・ネクストアクション"
        onChange={(v) => queueSave({ conclusion: v })}
      />

      {/* タスク連携 */}
      <div className="rounded-xl border border-line bg-surface-muted/50 p-3">
        {draft.linkedTaskIds.length > 0 ? (
          <div className="space-y-1">
            {draft.linkedTaskIds.map((taskId, i) => (
              <Link
                key={taskId}
                href={`/board?task=${taskId}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                <ExternalLink className="size-4" />
                連携タスク{draft.linkedTaskIds.length > 1 ? ` ${i + 1}` : ""}をボードで開く
              </Link>
            ))}
          </div>
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
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          {project.linkedProjectId
            ? "連携案件のタスクとして作成し、このノードを施策化済みにします。"
            : "未分類タスクとして作成し、このノードを施策化済みにします。"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onRequestDelete(node)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 h-9 text-sm font-medium text-ink-soft hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <Trash2 className="size-4" />
          削除
        </button>
        <p className="text-[11px] text-ink-soft">更新 {formatDue(node.updatedAt)}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</label>
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

/** ノード未選択時: 案件サマリー */
export function ProjectSummaryPanel({
  project,
  nodes,
}: {
  project: IssueTreeProject;
  nodes: IssueTreeNode[];
}) {
  const counts = useMemo(() => {
    const byStatus = new Map<string, number>();
    for (const n of nodes) byStatus.set(n.status, (byStatus.get(n.status) ?? 0) + 1);
    return byStatus;
  }, [nodes]);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Target className="size-3.5 text-brand-600" />
          目的
        </p>
        <p className="text-sm leading-relaxed text-ink">{project.objective || "未設定"}</p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">主要KPI</p>
        {project.kpis.length === 0 ? (
          <p className="text-sm text-ink-soft">未設定</p>
        ) : (
          <ul className="space-y-1.5">
            {project.kpis.map((kpi) => (
              <li
                key={kpi.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium text-ink">{kpi.label}</span>
                <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                  {kpi.current || "—"} → <span className="font-semibold text-ink">{kpi.target || "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {project.nextAction && (
        <div>
          <p className="mb-1 text-xs font-semibold text-ink-soft">ネクストアクション</p>
          <p className="rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm leading-relaxed text-ink">
            {project.nextAction}
          </p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">検証状況</p>
        <ul className="space-y-1">
          {NODE_STATUS_ORDER.map((s) => {
            const meta = NODE_STATUS_META[s];
            return (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-ink-soft">
                  <span className="size-2 rounded-full" style={{ backgroundColor: meta.dot }} />
                  {meta.label}
                </span>
                <span className="font-semibold text-ink tabular-nums">{counts.get(s) ?? 0}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {project.deadline && (
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <CalendarDays className="size-3.5" />
          期限 {formatDue(project.deadline)}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-ink-soft">
        ノードを選択すると、仮説・根拠・検証方法をここで編集できます。
      </p>
    </div>
  );
}
