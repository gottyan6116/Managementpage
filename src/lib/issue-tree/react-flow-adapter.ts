/**
 * React Flow アダプタ。
 * ドメイン (IssueTreeNode/IssueTreeEdge) と React Flow の Node/Edge を相互変換する
 * 唯一のレイヤー。ドメイン層は @xyflow/react を一切 import しない。
 */
import type { Edge as FlowEdge, Node as FlowNode } from "@xyflow/react";
import {
  buildHierarchy,
  type IssueTreeEdge,
  type IssueTreeHierarchyNode,
  type IssueTreeNode,
  type IssueTreeNodePosition,
  type IssueTreeType,
} from "./domain.ts";

export const ISSUE_NODE_TYPE = "issueNode";

export interface IssueFlowNodeData {
  node: IssueTreeNode;
  dimmed: boolean;
  selected: boolean;
  [key: string]: unknown;
}

export type IssueFlowNode = FlowNode<IssueFlowNodeData>;

const COL_WIDTH = 320;
const ROW_HEIGHT = 120;

/**
 * position が未設定 (null) のノードに階層ベースの自動レイアウト座標を与える。
 * 葉から順に行を割り当て、親は子の中央に置く単純な tidy レイアウト。
 */
export function computeAutoLayout(
  nodes: IssueTreeNode[],
  treeType: IssueTreeType,
): Map<string, IssueTreeNodePosition> {
  const roots = buildHierarchy(nodes, treeType);
  const positions = new Map<string, IssueTreeNodePosition>();
  let nextRow = 0;

  function place(node: IssueTreeHierarchyNode, depth: number): number {
    if (node.children.length === 0) {
      const y = nextRow * ROW_HEIGHT;
      nextRow += 1;
      positions.set(node.id, { x: depth * COL_WIDTH, y });
      return y;
    }
    const childYs = node.children.map((c) => place(c, depth + 1));
    const y = (Math.min(...childYs) + Math.max(...childYs)) / 2;
    positions.set(node.id, { x: depth * COL_WIDTH, y });
    return y;
  }

  for (const root of roots) place(root, 0);
  return positions;
}

/** ドメインノード → React Flow ノード */
export function toFlowNodes(
  nodes: IssueTreeNode[],
  treeType: IssueTreeType,
  options?: { dimmedIds?: Set<string>; selectedId?: string | null },
): IssueFlowNode[] {
  const scoped = nodes.filter((n) => n.treeType === treeType);
  const auto = computeAutoLayout(scoped, treeType);
  return scoped.map((node) => ({
    id: node.id,
    type: ISSUE_NODE_TYPE,
    position: node.position ?? auto.get(node.id) ?? { x: 0, y: 0 },
    data: {
      node,
      dimmed: options?.dimmedIds?.has(node.id) ?? false,
      selected: options?.selectedId === node.id,
    },
  }));
}

/**
 * 階層 (parentId) とリレーションエッジ → React Flow エッジ。
 * 階層エッジは `h-` プレフィクス、リレーションは永続化された id を使う。
 */
export function toFlowEdges(
  nodes: IssueTreeNode[],
  edges: IssueTreeEdge[],
  treeType: IssueTreeType,
  options?: { dimmedIds?: Set<string> },
): FlowEdge[] {
  const scoped = nodes.filter((n) => n.treeType === treeType);
  const nodeIds = new Set(scoped.map((n) => n.id));
  const dimmed = options?.dimmedIds ?? new Set<string>();

  const hierarchyEdges: FlowEdge[] = scoped
    .filter((n) => n.parentId && nodeIds.has(n.parentId))
    .map((n) => {
      const isDimmed = dimmed.has(n.id) || dimmed.has(n.parentId as string);
      return {
        id: `h-${n.parentId}-${n.id}`,
        source: n.parentId as string,
        target: n.id,
        type: "smoothstep",
        style: {
          stroke: "#c7d4e8",
          strokeWidth: 1.5,
          opacity: isDimmed ? 0.25 : 1,
        },
      };
    });

  const relationEdges: FlowEdge[] = edges
    .filter(
      (e) =>
        e.treeType === treeType &&
        nodeIds.has(e.sourceNodeId) &&
        nodeIds.has(e.targetNodeId),
    )
    .map((e) => {
      const isDimmed = dimmed.has(e.sourceNodeId) || dimmed.has(e.targetNodeId);
      return {
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        label: e.label || undefined,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "#94a3b8",
          strokeDasharray: "4 4",
          strokeWidth: 1.2,
          opacity: isDimmed ? 0.25 : 1,
        },
        labelStyle: { fontSize: 10, fill: "#475569" },
      };
    });

  return [...hierarchyEdges, ...relationEdges];
}

/** ドラッグ終了時の React Flow ノード → ドメインの位置更新ペイロード */
export function fromDragStop(flowNode: {
  id: string;
  position: { x: number; y: number };
}): { id: string; position: IssueTreeNodePosition } {
  return {
    id: flowNode.id,
    position: {
      x: Math.round(flowNode.position.x),
      y: Math.round(flowNode.position.y),
    },
  };
}
