"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { buildTree, ISSUE_STATUS_META, type IssueTreeNode } from "@/lib/issue-tree";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { IssueNode, IssueTreeKind } from "@/types/domain";

/**
 * ツリー描画 (MVP: 再帰コンポーネント)。
 * 入力は「フラットな nodes[] + コールバック」のみに限定しており、
 * 将来 React Flow へ差し替える場合もこのコンポーネントの内部実装を
 * 置き換えるだけで済む (親コンポーネントは無変更)。
 */
export function IssueTreeView({
  nodes,
  treeKind,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}: {
  nodes: IssueNode[];
  treeKind: IssueTreeKind;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const roots = buildTree(nodes, treeKind);

  return (
    <div className="p-4 sm:p-6">
      {roots.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-soft">このツリーにはまだノードがありません。</p>
          <button
            type="button"
            onClick={() => onAddChild(null)}
            className="primary-button mt-4 inline-flex items-center gap-1.5 h-9 rounded-lg px-3.5 text-sm font-semibold text-white"
          >
            <Plus className="size-4" />
            最初のノードを追加
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {roots.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onAddChild(null)}
            className="mt-3 inline-flex items-center gap-1.5 h-8 rounded-lg border border-dashed border-line px-3 text-xs font-medium text-ink-soft hover:bg-surface-muted hover:text-ink transition-colors"
          >
            <Plus className="size-3.5" />
            ルートに追加
          </button>
        </>
      )}
    </div>
  );
}

function TreeItem({
  node,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}: {
  node: IssueTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = ISSUE_STATUS_META[node.status];
  const prio = PRIORITY_STYLE[node.priority];
  const selected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border pr-2 transition-colors",
          selected
            ? "border-brand-300 bg-brand-50/70 shadow-[0_4px_14px_rgba(47,107,238,0.1)]"
            : "border-transparent hover:border-line hover:bg-surface-muted/60",
        )}
      >
        {/* 開閉トグル */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "子ノードを展開" : "子ノードを折りたたむ"}
          className={cn(
            "ml-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-brand-600",
            !hasChildren && "invisible",
          )}
        >
          <ChevronDown className={cn("size-3.5 transition-transform", collapsed && "-rotate-90")} />
        </button>

        {/* 本体 (選択) */}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 min-w-0 flex items-center gap-2.5 py-2.5 text-left"
        >
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: meta.dot }}
            title={meta.label}
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              selected ? "font-semibold text-ink" : "text-ink",
            )}
          >
            {node.title}
          </span>
          <span
            className="hidden sm:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: meta.fg, backgroundColor: meta.bg }}
          >
            {meta.label}
          </span>
          <span
            className="hidden md:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: prio.fg, backgroundColor: prio.bg }}
          >
            {PRIORITY_LABEL[node.priority]}
          </span>
        </button>

        {/* ホバーアクション */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            aria-label={`「${node.title}」に子ノードを追加`}
            title="子ノードを追加"
            className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand-600"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            aria-label={`「${node.title}」を削除`}
            title="削除 (子孫も削除)"
            className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <ul className="mt-1 ml-4 space-y-1 border-l border-line/70 pl-3">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
