import type { IssueNode, IssueNodeStatus, IssueTreeKind } from "@/types/domain";

/** タブの表示順とラベル */
export const TREE_KINDS: { key: IssueTreeKind; label: string }[] = [
  { key: "issue", label: "論点ツリー" },
  { key: "logic", label: "ロジックツリー" },
  { key: "kpi", label: "KPIツリー" },
  { key: "process", label: "業務プロセスツリー" },
];

/** ステータスのラベルと配色 (WCAG AA を満たす fg/bg、docs/02 §2 の流儀に合わせる) */
export const ISSUE_STATUS_META: Record<
  IssueNodeStatus,
  { label: string; fg: string; bg: string; dot: string }
> = {
  unverified: { label: "未検証", fg: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
  validating: { label: "検証中", fg: "#1D4ED8", bg: "#DBEAFE", dot: "#2563EB" },
  supported: { label: "支持", fg: "#15803D", bg: "#DCFCE7", dot: "#16A34A" },
  rejected: { label: "棄却", fg: "#B91C1C", bg: "#FEE2E2", dot: "#DC2626" },
  actionized: { label: "施策化済み", fg: "#6D28D9", bg: "#EDE9FE", dot: "#7C3AED" },
};

export const ISSUE_STATUS_ORDER: IssueNodeStatus[] = [
  "unverified",
  "validating",
  "supported",
  "rejected",
  "actionized",
];

export interface IssueTreeNode extends IssueNode {
  children: IssueTreeNode[];
}

/**
 * フラットな nodes[] を階層ツリーへ変換する純関数。
 * ツリー描画コンポーネントはこの構造だけに依存させ、
 * 将来 React Flow に差し替える場合も同じ入力から edges/nodes を導出する。
 */
export function buildTree(nodes: IssueNode[], treeKind: IssueTreeKind): IssueTreeNode[] {
  const scoped = nodes
    .filter((n) => n.treeKind === treeKind)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const map = new Map<string, IssueTreeNode>(
    scoped.map((n) => [n.id, { ...n, children: [] }]),
  );
  const roots: IssueTreeNode[] = [];
  for (const node of map.values()) {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
