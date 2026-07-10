"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Link2 } from "lucide-react";
import {
  NODE_STATUS_META,
  NODE_TYPE_LABEL,
  type IssueTreeNode,
} from "@/lib/issue-tree/domain";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { IssueFlowNode } from "@/lib/issue-tree/react-flow-adapter";

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

/** React Flow に登録するカスタムノード */
export const IssueFlowNodeCard = memo(function IssueFlowNodeCard({
  data,
}: NodeProps<IssueFlowNode>) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-none !bg-[#c7d4e8]"
      />
      <NodeCardBody node={data.node} dimmed={data.dimmed} selected={data.selected} />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-none !bg-[#c7d4e8]"
      />
    </>
  );
});
