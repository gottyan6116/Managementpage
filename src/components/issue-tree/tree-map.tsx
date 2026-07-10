"use client";

import { Plus, Trash2 } from "lucide-react";
import { buildTree, ISSUE_STATUS_META, type IssueTreeNode } from "@/lib/issue-tree";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { IssueNode, IssueTreeKind } from "@/types/domain";

/**
 * ロジックツリー型のマップ表示。ルートを左に置き、右へ分岐が広がる。
 * ステータス色 (左端バー/ドット) で検証状況の偏り = ボトルネックの枝を俯瞰できる。
 * props は tree-view.tsx と同一 (フラット nodes[] + コールバック) のため、
 * 将来 React Flow へ差し替える場合もこのファイルの内部実装を置き換えるだけでよい。
 */
export function IssueTreeMap({
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

  if (roots.length === 0) {
    return (
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
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-x-auto">
      <div className="min-w-max space-y-8 pb-2">
        {roots.map((root) => (
          <MapItem
            key={root.id}
            node={root}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAddChild(null)}
        className="mt-4 inline-flex items-center gap-1.5 h-8 rounded-lg border border-dashed border-line px-3 text-xs font-medium text-ink-soft hover:bg-surface-muted hover:text-ink transition-colors"
      >
        <Plus className="size-3.5" />
        ルートに追加
      </button>
    </div>
  );
}

function MapItem({
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
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex items-center">
      <MapCard
        node={node}
        selected={selectedId === node.id}
        onSelect={() => onSelect(node.id)}
        onAddChild={() => onAddChild(node.id)}
        onDelete={() => onDelete(node.id)}
      />
      {hasChildren && (
        <>
          {/* 親カード → 子の幹への水平線 */}
          <div className="w-7 h-px bg-line shrink-0" aria-hidden />
          <div className="flex flex-col gap-3">
            {node.children.map((child) => (
              <div key={child.id} className="itree-child">
                <MapItem
                  node={child}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MapCard({
  node,
  selected,
  onSelect,
  onAddChild,
  onDelete,
}: {
  node: IssueTreeNode;
  selected: boolean;
  onSelect: () => void;
  onAddChild: () => void;
  onDelete: () => void;
}) {
  const meta = ISSUE_STATUS_META[node.status];
  const prio = PRIORITY_STYLE[node.priority];

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-[220px] rounded-xl border bg-surface p-3 pl-3.5 text-left transition-all",
          selected
            ? "border-brand-400 ring-2 ring-brand-200 shadow-pop"
            : "border-line shadow-sm hover:border-brand-200 hover:shadow-card",
        )}
        style={{ borderLeftWidth: 3, borderLeftColor: meta.dot }}
      >
        <p className="text-[13px] font-medium text-ink leading-snug line-clamp-2">
          {node.title}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: meta.fg, backgroundColor: meta.bg }}
          >
            {meta.label}
          </span>
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: prio.fg, backgroundColor: prio.bg }}
          >
            {PRIORITY_LABEL[node.priority]}
          </span>
        </div>
      </button>

      {/* ホバーアクション */}
      <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onAddChild}
          aria-label={`「${node.title}」に子ノードを追加`}
          title="子ノードを追加"
          className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-card hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`「${node.title}」を削除`}
          title="削除 (子孫も削除)"
          className="inline-flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-soft shadow-card hover:bg-red-50 hover:text-red-500 hover:border-red-200"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
