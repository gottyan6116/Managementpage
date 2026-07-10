import { create } from "zustand";
import {
  EMPTY_FILTERS,
  type IssueTreeEdge,
  type IssueTreeFilters,
  type IssueTreeNode,
  type IssueTreeNodeStatus,
  type IssueTreePriority,
  type IssueTreeType,
} from "../lib/issue-tree/domain.ts";

/**
 * Issue Tree ワークスペースの UI 状態。
 * 永続化されるエンティティ (project/nodes/edges) は TanStack Query が正本であり、
 * ここには複製しない。Undo/Redo の履歴はセッション内のみ (localStorage へ保存しない)。
 */

export type IssueTreeViewMode = "map" | "list";
export type IssueTreeSaveStatus = "idle" | "saving" | "saved" | "error";

/** Undo/Redo のスナップショット (ドメインエンティティのみ) */
export interface IssueTreeSnapshot {
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
}

const HISTORY_LIMIT = 50;

interface IssueTreeUiState {
  selectedNodeId: string | null;
  activeTreeType: IssueTreeType;
  viewMode: IssueTreeViewMode;
  filters: IssueTreeFilters;
  filterPanelOpen: boolean;
  detailPanelOpen: boolean;
  saveStatus: IssueTreeSaveStatus;
  saveError: string | null;

  past: IssueTreeSnapshot[];
  future: IssueTreeSnapshot[];

  selectNode: (id: string | null) => void;
  setActiveTreeType: (t: IssueTreeType) => void;
  setViewMode: (v: IssueTreeViewMode) => void;
  toggleStatusFilter: (s: IssueTreeNodeStatus) => void;
  togglePriorityFilter: (p: IssueTreePriority) => void;
  setQueryFilter: (q: string) => void;
  clearFilters: () => void;
  setFilterPanelOpen: (open: boolean) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setSaveStatus: (status: IssueTreeSaveStatus, error?: string | null) => void;

  /** 変更前に呼び、現在のグラフを履歴へ積む */
  pushHistory: (snapshot: IssueTreeSnapshot) => void;
  /** 現在のグラフと引き換えに直前のスナップショットを取り出す */
  popUndo: (current: IssueTreeSnapshot) => IssueTreeSnapshot | null;
  popRedo: (current: IssueTreeSnapshot) => IssueTreeSnapshot | null;
  clearHistory: () => void;
  /** ワークスペースを跨いだ状態の持ち越しを防ぐ */
  resetForProject: () => void;
}

const cloneSnapshot = (s: IssueTreeSnapshot): IssueTreeSnapshot => ({
  nodes: s.nodes.map((n) => ({
    ...n,
    evidenceItems: n.evidenceItems.map((e) => ({ ...e })),
    validationData: { ...n.validationData },
    linkedTaskIds: [...n.linkedTaskIds],
    position: n.position ? { ...n.position } : null,
  })),
  edges: s.edges.map((e) => ({ ...e })),
});

export const useIssueTreeStore = create<IssueTreeUiState>((set, get) => ({
  selectedNodeId: null,
  activeTreeType: "issue",
  viewMode: "map",
  filters: EMPTY_FILTERS,
  filterPanelOpen: false,
  detailPanelOpen: false,
  saveStatus: "idle",
  saveError: null,
  past: [],
  future: [],

  selectNode: (id) =>
    set({ selectedNodeId: id, detailPanelOpen: id !== null }),
  setActiveTreeType: (t) =>
    set({ activeTreeType: t, selectedNodeId: null, detailPanelOpen: false }),
  setViewMode: (v) => set({ viewMode: v }),

  toggleStatusFilter: (s) =>
    set((state) => ({
      filters: {
        ...state.filters,
        statuses: state.filters.statuses.includes(s)
          ? state.filters.statuses.filter((x) => x !== s)
          : [...state.filters.statuses, s],
      },
    })),
  togglePriorityFilter: (p) =>
    set((state) => ({
      filters: {
        ...state.filters,
        priorities: state.filters.priorities.includes(p)
          ? state.filters.priorities.filter((x) => x !== p)
          : [...state.filters.priorities, p],
      },
    })),
  setQueryFilter: (q) =>
    set((state) => ({ filters: { ...state.filters, query: q } })),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
  setSaveStatus: (status, error = null) =>
    set({ saveStatus: status, saveError: error }),

  pushHistory: (snapshot) =>
    set((state) => ({
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), cloneSnapshot(snapshot)],
      future: [],
    })),

  popUndo: (current) => {
    const { past } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, cloneSnapshot(current)],
    }));
    return previous;
  },

  popRedo: (current) => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[future.length - 1];
    set((state) => ({
      future: state.future.slice(0, -1),
      past: [...state.past, cloneSnapshot(current)],
    }));
    return next;
  },

  clearHistory: () => set({ past: [], future: [] }),

  resetForProject: () =>
    set({
      selectedNodeId: null,
      activeTreeType: "issue",
      filters: EMPTY_FILTERS,
      filterPanelOpen: false,
      detailPanelOpen: false,
      saveStatus: "idle",
      saveError: null,
      past: [],
      future: [],
    }),
}));
