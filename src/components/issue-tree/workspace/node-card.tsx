"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Link2, Plus, Trash2 } from "lucide-react";
import {
  NODE_STATUS_META,
  NODE_TYPE_LABEL,
  type IssueTreeNode,
} from "@/lib/issue-tree/domain";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { IssueFlowNode } from "@/lib/issue-tree/react-flow-adapter";
import { useIssueFlowActions } from "./flow-actions";

/**
 * キャンバス上のノードカード。
 * ニュートラルな白カード + 控えめな境界/影。ステータスは文字ラベル付きバッジで表現し、
 * 左端のカラーストライプは使わない。
 */
export function NodeCardBody({
  node,
  dimmed,
  selected,
  onClick,
  className,
}: {
  node: IssueTreeNode;
  dimmed: boolean;
  selected: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const status = NODE_STATUS_META[node.status];
  const prio = PRIORITY_STYLE[node.priority];

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-[240px] rounded-xl border bg-surface-solid p-3 text-left transition-all",
        selected
          ? "border-brand-400 ring-2 ring-brand-200 shadow-pop"
          : "border-line shadow-sm hover:border-brand-200 hover:shadow-card",
        dimmed && "opacity-30",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold tracking-wide text-ink-soft">
          {NODE_TYPE_LABEL[node.nodeType]}
        </span>
        {node.linkedTaskIds.length > 0 && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] text-brand-600"
            title="タスク連携あり"
          >
            <Link2 className="size-3" />
            {node.linkedTaskIds.length}
          </span>
        )}
      </div>
      <p className="mt-1 text-[13px] font-medium leading-snug text-ink line-clamp-3">
        {node.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ color: status.fg, backgroundColor: status.bg }}
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
          {status.label}
        </span>
        <span
          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ color: prio.fg, backgroundColor: prio.bg }}
        >
          {PRIORITY_LABEL[node.priority]}
        </span>
      </div>
    </div>
  );
}

/** React Flow に登録するカスタムノード (ホバーで追加/削除、ダブルクリックで改名) */
export const IssueFlowNodeCard = memo(function IssueFlowNodeCard({
  data,
}: NodeProps<IssueFlowNode>) {
  const { node, dimmed, selected } = data;
  const { onAddChild, onDelete, onRename } = useIssueFlowActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      el?.focus();
      el?.select();
    }
  }, [editing]);

  function commitRename() {
    const next = draft.trim();
    if (next && next !== node.title) onRename(node.id, next);
    else setDraft(node.title);
    setEditing(false);
  }

  return (
    <div className="group relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-none !bg-[#c7d4e8]"
      />

      {editing ? (
        // インライン改名: Enter=確定 / Shift+Enter=改行 / Escape=取消
        <div
          className={cn(
            "nodrag nopan w-[240px] rounded-xl border bg-surface-solid p-3",
            "border-brand-400 ring-2 ring-brand-200 shadow-pop",
          )}
        >
          <span className="text-[10px] font-semibold tracking-wide text-ink-soft">
            {NODE_TYPE_LABEL[node.nodeType]}
          </span>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setDraft(node.title);
                setEditing(false);
              }
            }}
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-brand-300 bg-white px-1.5 py-1 text-[13px] font-medium leading-snug text-ink outline-none"
          />
        </div>
      ) : (
        <div onDoubleClick={() => { setDraft(node.title); setEditing(true); }}>
          <NodeCardBody node={node} dimmed={dimmed} selected={selected} />
        </div>
      )}

      {/* ホバー/選択時のアクション (ドラッグ・パン無効化) */}
      {!editing && (
        <div className="nodrag nopan absolute -right-2.5 -top-2.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [.selected_&]:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            aria-label={`「${node.title}」に子ノードを追加`}
            title="子ノードを追加"
            className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-card hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            aria-label={`「${node.title}」を削除`}
            title="削除"
            className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-card hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-none !bg-[#c7d4e8]"
      />
    </div>
  );
});
