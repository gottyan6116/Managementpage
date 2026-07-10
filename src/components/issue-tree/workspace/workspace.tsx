"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  List,
  Loader2,
  Network,
  Plus,
  Redo2,
  SlidersHorizontal,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import {
  TREE_TYPES,
  type IssueTreeNode,
  type IssueTreeType,
} from "@/lib/issue-tree/domain";
import {
  useCreateIssueTreeNode,
  useDeleteIssueTreeNode,
  useIssueTreeEdges,
  useIssueTreeNodes,
  useIssueTreeProject,
  useIssueTreeUndoRedo,
  useUpdateIssueTreeNode,
} from "@/lib/queries/issue-tree-hooks";
import { useIssueTreeStore } from "@/stores/issue-tree-store";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { ListView } from "./list-view";
import { FilterPanel } from "./filter-panel";
import { NodeDetailPanel, ProjectSummaryPanel } from "./detail-panel";
import { InlineNodeCreator } from "./inline-node-creator";

// React Flow は計測済みコンテナ前提のためクライアント側でのみ読み込む
const FlowCanvas = dynamic(() => import("./flow-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink-soft">
      キャンバスを読み込み中…
    </div>
  ),
});

function isTreeType(v: string | null): v is IssueTreeType {
  return v === "issue" || v === "logic" || v === "kpi" || v === "process";
}

export function IssueTreeWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: project, isLoading } = useIssueTreeProject(projectId);
  const { data: nodes } = useIssueTreeNodes(projectId);
  const { data: edges } = useIssueTreeEdges(projectId);

  const createNode = useCreateIssueTreeNode(projectId);
  const movePersist = useUpdateIssueTreeNode(projectId, { history: false });
  const deleteNode = useDeleteIssueTreeNode(projectId);
  const { undo, redo, canUndo, canRedo } = useIssueTreeUndoRedo(projectId);
  const pushToast = useToastStore((s) => s.push);

  const selectedNodeId = useIssueTreeStore((s) => s.selectedNodeId);
  const activeTreeType = useIssueTreeStore((s) => s.activeTreeType);
  const viewMode = useIssueTreeStore((s) => s.viewMode);
  const filters = useIssueTreeStore((s) => s.filters);
  const filterPanelOpen = useIssueTreeStore((s) => s.filterPanelOpen);
  const detailPanelOpen = useIssueTreeStore((s) => s.detailPanelOpen);
  const selectNode = useIssueTreeStore((s) => s.selectNode);
  const setActiveTreeType = useIssueTreeStore((s) => s.setActiveTreeType);
  const setViewMode = useIssueTreeStore((s) => s.setViewMode);
  const setFilterPanelOpen = useIssueTreeStore((s) => s.setFilterPanelOpen);
  const setDetailPanelOpen = useIssueTreeStore((s) => s.setDetailPanelOpen);

  const [creatorOpen, setCreatorOpen] = useState(false);

  // プロジェクト切替時に UI 状態を初期化し、URL の ?view= を反映する
  useEffect(() => {
    const store = useIssueTreeStore.getState();
    store.resetForProject();
    const view = searchParams.get("view");
    if (isTreeType(view)) store.setActiveTreeType(view);
    // モバイルはリストビューを既定にする
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      store.setViewMode("list");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) void redo();
        else void undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        void redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const selectedNode = useMemo(
    () => nodes?.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const countByType = useMemo(() => {
    const m: Record<IssueTreeType, number> = { issue: 0, logic: 0, kpi: 0, process: 0 };
    for (const n of nodes ?? []) m[n.treeType] += 1;
    return m;
  }, [nodes]);

  function switchTreeType(t: IssueTreeType) {
    setActiveTreeType(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", t);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleCreate(parentId: string | null, title: string) {
    createNode.mutate(
      { treeType: activeTreeType, parentId, title },
      { onSuccess: (node) => selectNode(node.id) },
    );
  }

  /** 削除: 子や連携タスクがあれば確認し、Undo トーストを出す */
  function handleRequestDelete(node: IssueTreeNode) {
    const hasChildren = (nodes ?? []).some((n) => n.parentId === node.id);
    if (hasChildren || node.linkedTaskIds.length > 0) {
      const reasons = [
        hasChildren ? "子ノード" : null,
        node.linkedTaskIds.length > 0 ? "連携タスク" : null,
      ]
        .filter(Boolean)
        .join("と");
      if (!window.confirm(`「${node.title}」には${reasons}があります。削除しますか？`)) {
        return;
      }
    }
    deleteNode.mutate(node.id, {
      onSuccess: () => {
        if (selectedNodeId === node.id) selectNode(null);
        pushToast({
          message: `「${node.title}」を削除しました`,
          actionLabel: "元に戻す",
          onAction: () => void undo(),
          durationMs: 6000,
        });
      },
    });
  }

  if (isLoading) {
    return <div className="h-[70vh] rounded-2xl bg-surface border border-line animate-pulse" />;
  }
  if (!project) {
    return (
      <div className="data-card rounded-2xl p-10 text-center">
        <p className="text-ink-soft">プロジェクトが見つかりませんでした。</p>
        <Link href="/issue-tree" className="mt-2 inline-block text-sm text-brand-600">
          ← 一覧へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[540px] flex-col">
      {/* ヘッダー */}
      <div className="mb-3 flex items-center gap-3">
        <Link
          href="/issue-tree"
          aria-label="一覧へ戻る"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-soft">
            {project.clientName}
            <span className="mx-1.5 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-1.5 py-px text-[10px] font-semibold text-brand-700 align-middle">
              {project.category}
            </span>
          </p>
          <h1 className="truncate text-lg font-bold leading-snug text-ink">{project.name}</h1>
        </div>
        <SaveStatusBadge />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void undo()}
            disabled={!canUndo}
            aria-label="元に戻す (Ctrl+Z)"
            title="元に戻す (Ctrl+Z)"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void redo()}
            disabled={!canRedo}
            aria-label="やり直す (Ctrl+Shift+Z)"
            title="やり直す (Ctrl+Shift+Z)"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="size-4" />
          </button>
        </div>
      </div>

      {/* ツールバー: タブ + ビュー切替 + フィルタ + 追加 */}
      <div className="mb-3 flex items-center gap-2">
        <div
          role="tablist"
          aria-label="ツリーの種類"
          className="flex min-w-0 items-center gap-1 overflow-x-auto no-scrollbar"
        >
          {TREE_TYPES.map((t) => {
            const active = activeTreeType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTreeType(t.key)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-300 bg-brand-50 font-semibold text-brand-700"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
              >
                {t.label}
                <span className={cn("text-xs", active ? "text-brand-600" : "text-ink-muted")}>
                  {countByType[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            aria-pressed={filterPanelOpen}
            className={cn(
              "xl:hidden inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
              filterPanelOpen
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">フィルタ</span>
          </button>

          <div className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              title="マップ表示"
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                viewMode === "map" ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              <Network className="size-3.5" />
              <span className="hidden sm:inline">マップ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              title="リスト表示"
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">リスト</span>
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setCreatorOpen((v) => !v)}
              className="primary-button inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">ノード追加</span>
            </button>
            {creatorOpen && (
              <div className="absolute right-0 top-11 z-30 w-72">
                <InlineNodeCreator
                  placeholder={
                    selectedNode
                      ? `「${selectedNode.title}」の子ノードを追加…`
                      : "ルートノードを追加…"
                  }
                  onConfirm={(title) => {
                    handleCreate(selectedNode?.id ?? null, title);
                    setCreatorOpen(false);
                  }}
                  onCancel={() => setCreatorOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 本体 3 カラム */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface">
        {/* フィルタ (xl 以上は常設 240px) */}
        <aside className="hidden xl:block w-[240px] shrink-0 overflow-y-auto border-r border-line bg-surface-muted/30">
          <FilterPanel />
        </aside>

        {/* 中央 */}
        <div className="relative min-w-0 flex-1">
          {viewMode === "map" ? (
            <FlowCanvas
              nodes={(nodes ?? []).filter((n) => n.treeType === activeTreeType)}
              edges={edges ?? []}
              treeType={activeTreeType}
              filters={filters}
              selectedId={selectedNodeId}
              onSelect={selectNode}
              onMovePersist={({ id, position }) => movePersist.mutate({ id, position })}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <ListView
                nodes={nodes ?? []}
                treeType={activeTreeType}
                filters={filters}
                selectedId={selectedNodeId}
                onSelect={(id) => selectNode(id === selectedNodeId ? null : id)}
                onCreate={handleCreate}
                onDelete={handleRequestDelete}
              />
            </div>
          )}
        </div>

        {/* 右パネル (xl 以上は常設 360px) */}
        <aside className="hidden xl:block w-[360px] shrink-0 overflow-y-auto border-l border-line bg-surface-muted/30">
          {selectedNode ? (
            <NodeDetailPanel
              key={selectedNode.id}
              node={selectedNode}
              project={project}
              onRequestDelete={handleRequestDelete}
            />
          ) : (
            <ProjectSummaryPanel project={project} nodes={nodes ?? []} />
          )}
        </aside>
      </div>

      {/* フィルタドロワー (xl 未満) */}
      {filterPanelOpen && (
        <div className="xl:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="フィルタを閉じる"
            onClick={() => setFilterPanelOpen(false)}
            className="absolute inset-0 bg-[rgba(15,23,42,0.35)]"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] overflow-y-auto border-r border-line bg-surface shadow-pop">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <span className="text-sm font-semibold text-ink">フィルタ</span>
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                aria-label="閉じる"
                className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      {/* ノード詳細オーバーレイ (xl 未満: モバイルはフルスクリーン) */}
      {detailPanelOpen && selectedNode && (
        <div className="xl:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="詳細を閉じる"
            onClick={() => selectNode(null)}
            className="absolute inset-0 bg-[rgba(15,23,42,0.35)]"
          />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] overflow-y-auto border-l border-line bg-surface shadow-pop">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <span className="text-sm font-semibold text-ink">ノード詳細</span>
              <button
                type="button"
                onClick={() => selectNode(null)}
                aria-label="閉じる"
                className="inline-flex size-8 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <NodeDetailPanel
              key={selectedNode.id}
              node={selectedNode}
              project={project}
              onRequestDelete={handleRequestDelete}
            />
          </div>
        </div>
      )}

      {/* 詳細パネル非表示時の再オープン導線 (xl 未満で選択中のみ) */}
      {selectedNode && !detailPanelOpen && (
        <button
          type="button"
          onClick={() => setDetailPanelOpen(true)}
          className="xl:hidden fixed bottom-5 right-5 z-30 primary-button inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white shadow-pop"
        >
          ノード詳細
        </button>
      )}
    </div>
  );
}

function SaveStatusBadge() {
  const status = useIssueTreeStore((s) => s.saveStatus);
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
        status === "saving" && "border-line bg-surface text-ink-soft",
        status === "saved" && "border-[#ccefe4] bg-[#eafaf5] text-[#0f766e]",
        status === "error" && "border-[#fde2e7] bg-[#fff0f2] text-[#B91C1C]",
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" />
          保存中
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="size-3" />
          保存済み
        </>
      )}
      {status === "error" && (
        <>
          <TriangleAlert className="size-3" />
          保存エラー
        </>
      )}
    </span>
  );
}
