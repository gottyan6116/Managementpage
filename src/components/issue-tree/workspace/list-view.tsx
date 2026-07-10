"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  buildHierarchy,
  dimmedNodeIds,
  NODE_STATUS_META,
  type IssueTreeFilters,
  type IssueTreeHierarchyNode,
  type IssueTreeNode,
  type IssueTreeType,
} from "@/lib/issue-tree/domain";
import { PRIORITY_LABEL, PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { InlineNodeCreator } from "./inline-node-creator";

/**
 * リストビュー (モバイル既定 / 高速編集向け)。
 * フィルタ不一致ノードは構造を保ったまま淡色表示する。
 */
export function ListView({
  nodes,
  treeType,
  filters,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: {
  nodes: IssueTreeNode[];
  treeType: IssueTreeType;
  filters: IssueTreeFilters;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null, title: string) => void;
  onDelete: (node: IssueTreeNode) => void;
}) {
  const roots = buildHierarchy(nodes, treeType);
  const dimmed = dimmedNodeIds(nodes, filters);
  const [creatingUnder, setCreatingUnder] = useState<string | null | "root">(null);

  return (
    <div className="p-4 sm:p-6">
      {roots.length === 0 && creatingUnder === null ? (
        <div className="py-14 text-center">
          <p className="text-sm text-ink-soft">このツリーにはまだノードがありません。</p>
          <button
            type="button"
            onClick={() => setCreatingUnder("root")}
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
              <ListItem
                key={node.id}
                node={node}
                dimmed={dimmed}
                selectedId={selectedId}
                creatingUnder={creatingUnder}
                setCreatingUnder={setCreatingUnder}
                onSelect={onSelect}
                onCreate={onCreate}
                onDelete={onDelete}
              />
            ))}
          </ul>
          <div className="mt-3 max-w-md">
            {creatingUnder === "root" ? (
              <InlineNodeCreator
                onConfirm={(title) => {
                  onCreate(null, title);
                  setCreatingUnder(null);
                }}
                onCancel={() => setCreatingUnder(null)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setCreatingUnder("root")}
                className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-dashed border-line px-3 text-xs font-medium text-ink-soft hover:bg-surface-muted hover:text-ink transition-colors"
              >
                <Plus className="size-3.5" />
                ルートに追加
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ListItem({
  node,
  dimmed,
  selectedId,
  creatingUnder,
  setCreatingUnder,
  onSelect,
  onCreate,
  onDelete,
}: {
  node: IssueTreeHierarchyNode;
  dimmed: Set<string>;
  selectedId: string | null;
  creatingUnder: string | null | "root";
  setCreatingUnder: (v: string | null | "root") => void;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null, title: string) => void;
  onDelete: (node: IssueTreeNode) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const status = NODE_STATUS_META[node.status];
  const prio = PRIORITY_STYLE[node.priority];
  const selected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const isDimmed = dimmed.has(node.id);

  return (
    <li>
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border pr-2 transition-all",
          selected
            ? "border-brand-300 bg-brand-50/70"
            : "border-transparent hover:border-line hover:bg-surface-muted/60",
          isDimmed && "opacity-30",
        )}
      >
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

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 min-w-0 flex items-center gap-2.5 py-2.5 text-left"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              selected ? "font-semibold text-ink" : "text-ink",
            )}
          >
            {node.title}
          </span>
          <span
            className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: status.fg, backgroundColor: status.bg }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
            {status.label}
          </span>
          <span
            className="hidden md:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: prio.fg, backgroundColor: prio.bg }}
          >
            {PRIORITY_LABEL[node.priority]}
          </span>
        </button>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => setCreatingUnder(node.id)}
            aria-label={`「${node.title}」に子ノードを追加`}
            title="子ノードを追加"
            className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft hover:bg-brand-50 hover:text-brand-600"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            aria-label={`「${node.title}」を削除`}
            title="削除"
            className="inline-flex size-7 items-center justify-center rounded-lg text-ink-soft hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {(hasChildren || creatingUnder === node.id) && !collapsed && (
        <ul className="mt-1 ml-4 space-y-1 border-l border-line/70 pl-3">
          {node.children.map((child) => (
            <ListItem
              key={child.id}
              node={child}
              dimmed={dimmed}
              selectedId={selectedId}
              creatingUnder={creatingUnder}
              setCreatingUnder={setCreatingUnder}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
          {creatingUnder === node.id && (
            <li className="max-w-md py-1">
              <InlineNodeCreator
                onConfirm={(title) => {
                  onCreate(node.id, title);
                  setCreatingUnder(null);
                }}
                onCancel={() => setCreatingUnder(null)}
              />
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
