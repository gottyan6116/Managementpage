"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Target, X } from "lucide-react";
import { useCreateIssueNode, useDeleteIssueNode, useIssueNodes } from "@/lib/queries/hooks";
import { TREE_KINDS } from "@/lib/issue-tree";
import { IssueTreeView } from "./tree-view";
import { NodeDetailPanel } from "./node-detail-panel";
import { cn } from "@/lib/utils";
import type { IssueBoardSummary } from "@/lib/repositories";
import type { IssueTreeKind } from "@/types/domain";

/** 画面幅を大きく使う拡張モーダル (mobile はフルスクリーン) */
export function IssueBoardDetail({
  board,
  onClose,
}: {
  board: IssueBoardSummary;
  onClose: () => void;
}) {
  const { data: nodes } = useIssueNodes(board.id);
  const createNode = useCreateIssueNode(board.id);
  const deleteNode = useDeleteIssueNode(board.id);
  const [treeKind, setTreeKind] = useState<IssueTreeKind>("issue");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => nodes?.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const countByKind = useMemo(() => {
    const m: Record<IssueTreeKind, number> = { issue: 0, logic: 0, kpi: 0, process: 0 };
    for (const n of nodes ?? []) m[n.treeKind] += 1;
    return m;
  }, [nodes]);

  // モーダル表示中は背面のスクロールを止める + Escape で閉じる
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addNode(parentId: string | null) {
    createNode.mutate(
      { treeKind, parentId, title: "新しい論点" },
      { onSuccess: (node) => setSelectedId(node.id) },
    );
  }

  function removeNode(id: string) {
    if (!window.confirm("このノードを子ノードごと削除します。よろしいですか？")) return;
    deleteNode.mutate(id, {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景スクリム */}
      <motion.button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[rgba(15,23,42,0.45)]"
      />

      {/* 拡張パネル (カードからモーフ) */}
      <motion.div
        layoutId={`issue-board-${board.id}`}
        className="absolute inset-0 lg:inset-5 xl:inset-8 bg-app lg:rounded-3xl overflow-hidden shadow-pop flex flex-col"
      >
        {/* 上部: 案件概要 */}
        <div className="header-glass shrink-0 px-4 sm:px-6 py-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-ink-soft">{board.clientName}</p>
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                {board.category}
              </span>
            </div>
            <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-ink leading-snug truncate">
              {board.name}
            </h2>
            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Target className="size-3.5 shrink-0 text-brand-600" />
                <span className="truncate">{board.objective}</span>
              </span>
              <span className="shrink-0">
                <span className="font-semibold text-ink">主要KPI:</span> {board.kpi}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="shrink-0 inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* タブ */}
        <div
          role="tablist"
          aria-label="ツリーの種類"
          className="shrink-0 flex items-center gap-1 px-4 sm:px-6 pt-3 overflow-x-auto no-scrollbar"
        >
          {TREE_KINDS.map((t) => {
            const active = treeKind === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTreeKind(t.key);
                  setSelectedId(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 rounded-t-xl border border-b-0 px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-line bg-surface text-brand-700 font-semibold"
                    : "border-transparent text-ink-soft hover:text-ink hover:bg-surface-muted/60",
                )}
              >
                {t.label}
                <span className={cn("text-xs", active ? "text-brand-600" : "text-ink-muted")}>
                  {countByKind[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* 中央: ツリー + 右: ノード詳細 */}
        <div className="flex-1 min-h-0 flex border-t border-line bg-surface">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <IssueTreeView
              nodes={nodes ?? []}
              treeKind={treeKind}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
              onAddChild={addNode}
              onDelete={removeNode}
            />
          </div>

          {/* desktop: 右パネル */}
          <aside className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col border-l border-line bg-surface-muted/30 overflow-y-auto">
            {selected ? (
              <NodeDetailPanel
                key={selected.id}
                node={selected}
                board={board}
                onDeleted={() => setSelectedId(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-sm text-ink-soft leading-relaxed">
                  ノードを選択すると、仮説・根拠・検証方法を
                  <br />
                  ここで編集できます。
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* mobile: 下部ドロワー */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="lg:hidden absolute inset-x-0 bottom-0 max-h-[72%] rounded-t-2xl border-t border-line bg-surface shadow-pop overflow-y-auto"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between bg-surface/95 px-5 pt-3 pb-2 border-b border-line">
                <span className="text-xs font-semibold text-ink-soft">ノード詳細</span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="ノード詳細を閉じる"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NodeDetailPanel
                key={selected.id}
                node={selected}
                board={board}
                onDeleted={() => setSelectedId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
