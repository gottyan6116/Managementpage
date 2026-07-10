/**
 * Issue Tree ワークスペースのドメインモデル。
 * このモジュールは UI ライブラリ (@xyflow/react 等) に一切依存しない。
 * React Flow との変換は react-flow-adapter.ts のみが行う。
 */

export type IssueTreeType = "issue" | "logic" | "kpi" | "process";

/** 旧 "validating" は移行時に "testing" へ正規化する */
export type IssueTreeNodeStatus =
  | "unverified"
  | "testing"
  | "supported"
  | "rejected"
  | "actionized";

export type IssueTreePriority = "low" | "medium" | "high";

export type IssueTreeNodeType =
  | "question"
  | "hypothesis"
  | "driver"
  | "metric"
  | "process"
  | "action";

export type IssueTreeProjectStatus = "active" | "on_hold" | "done";

export type IssueTreeRelationType = "breakdown" | "supports" | "contradicts" | "relates";

export interface IssueTreeKpiEntry {
  id: string;
  label: string;
  target: string;
  current: string;
}

export interface IssueTreeEvidenceItem {
  id: string;
  text: string;
  source: string;
  createdAt: string;
}

export interface IssueTreeProject {
  id: string;
  clientName: string;
  name: string;
  category: string;
  objective: string;
  kpis: IssueTreeKpiEntry[];
  nextAction: string;
  status: IssueTreeProjectStatus;
  /** 既存タスク管理の担当案件 (projects) との連携先 */
  linkedProjectId: string | null;
  ownerId: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueTreeNodePosition {
  x: number;
  y: number;
}

export interface IssueTreeNode {
  id: string;
  projectId: string;
  treeType: IssueTreeType;
  parentId: string | null;
  /** 兄弟間の並び順 (階層は parentId が持つ) */
  order: number;
  title: string;
  description: string;
  nodeType: IssueTreeNodeType;
  status: IssueTreeNodeStatus;
  priority: IssueTreePriority;
  hypothesis: string;
  evidenceItems: IssueTreeEvidenceItem[];
  validationData: {
    dataNeeded: string;
    method: string;
  };
  conclusion: string;
  ownerId: string | null;
  deadline: string | null;
  /** 連携タスクの id 群 (先頭が「この論点からタスク作成」で作られたもの) */
  linkedTaskIds: string[];
  collapsed: boolean;
  /** キャンバス上の位置。null は自動レイアウト対象 */
  position: IssueTreeNodePosition | null;
  createdAt: string;
  updatedAt: string;
}

/** 階層 (parentId) 以外の関係線。React Flow の型はここに漏らさない */
export interface IssueTreeEdge {
  id: string;
  projectId: string;
  treeType: IssueTreeType;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: IssueTreeRelationType;
  label: string;
  createdAt: string;
  updatedAt: string;
}

/* ===== 表示メタ ===== */

export const TREE_TYPES: { key: IssueTreeType; label: string }[] = [
  { key: "issue", label: "論点ツリー" },
  { key: "logic", label: "ロジックツリー" },
  { key: "kpi", label: "KPIツリー" },
  { key: "process", label: "業務プロセスツリー" },
];

export const NODE_STATUS_META: Record<
  IssueTreeNodeStatus,
  { label: string; fg: string; bg: string; dot: string }
> = {
  unverified: { label: "未検証", fg: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
  testing: { label: "検証中", fg: "#1D4ED8", bg: "#DBEAFE", dot: "#2563EB" },
  supported: { label: "支持", fg: "#15803D", bg: "#DCFCE7", dot: "#16A34A" },
  rejected: { label: "棄却", fg: "#B91C1C", bg: "#FEE2E2", dot: "#DC2626" },
  actionized: { label: "施策化済み", fg: "#6D28D9", bg: "#EDE9FE", dot: "#7C3AED" },
};

export const NODE_STATUS_ORDER: IssueTreeNodeStatus[] = [
  "unverified",
  "testing",
  "supported",
  "rejected",
  "actionized",
];

export const NODE_TYPE_LABEL: Record<IssueTreeNodeType, string> = {
  question: "論点",
  hypothesis: "仮説",
  driver: "ドライバー",
  metric: "指標",
  process: "プロセス",
  action: "アクション",
};

export const PROJECT_STATUS_LABEL: Record<IssueTreeProjectStatus, string> = {
  active: "進行中",
  on_hold: "保留",
  done: "完了",
};

/** treeType ごとの既定 nodeType */
export function defaultNodeType(treeType: IssueTreeType): IssueTreeNodeType {
  switch (treeType) {
    case "kpi":
      return "metric";
    case "process":
      return "process";
    case "logic":
      return "driver";
    default:
      return "question";
  }
}

/* ===== フィルタ (純関数) ===== */

export interface IssueTreeFilters {
  statuses: IssueTreeNodeStatus[];
  priorities: IssueTreePriority[];
  query: string;
}

export const EMPTY_FILTERS: IssueTreeFilters = {
  statuses: [],
  priorities: [],
  query: "",
};

export function isFilterActive(filters: IssueTreeFilters): boolean {
  return (
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.query.trim().length > 0
  );
}

/** ノードがフィルタに一致するか (不一致は削除せず「淡色表示」に使う) */
export function matchesFilters(node: IssueTreeNode, filters: IssueTreeFilters): boolean {
  if (filters.statuses.length > 0 && !filters.statuses.includes(node.status)) return false;
  if (filters.priorities.length > 0 && !filters.priorities.includes(node.priority)) {
    return false;
  }
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const haystack = `${node.title}\n${node.hypothesis}\n${node.conclusion}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

/** フィルタ不一致で淡色表示にするノード id 集合を返す */
export function dimmedNodeIds(
  nodes: IssueTreeNode[],
  filters: IssueTreeFilters,
): Set<string> {
  if (!isFilterActive(filters)) return new Set();
  return new Set(nodes.filter((n) => !matchesFilters(n, filters)).map((n) => n.id));
}

/* ===== 階層ヘルパ (純関数) ===== */

export interface IssueTreeHierarchyNode extends IssueTreeNode {
  children: IssueTreeHierarchyNode[];
}

export function buildHierarchy(
  nodes: IssueTreeNode[],
  treeType: IssueTreeType,
): IssueTreeHierarchyNode[] {
  const scoped = nodes
    .filter((n) => n.treeType === treeType)
    .sort((a, b) => a.order - b.order);
  const map = new Map<string, IssueTreeHierarchyNode>(
    scoped.map((n) => [n.id, { ...n, children: [] }]),
  );
  const roots: IssueTreeHierarchyNode[] = [];
  for (const node of map.values()) {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** 指定ノードと子孫の id 一覧 (削除カスケード用) */
export function collectDescendantIds(nodes: IssueTreeNode[], rootId: string): string[] {
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = childrenOf.get(n.parentId) ?? [];
    list.push(n.id);
    childrenOf.set(n.parentId, list);
  }
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    result.push(id);
    for (const child of childrenOf.get(id) ?? []) stack.push(child);
  }
  return result;
}
