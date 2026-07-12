/**
 * React Flow アダプタ。
 * ドメイン (IssueTreeNode/IssueTreeEdge) と React Flow の Node/Edge を相互変換する
 * 唯一のレイヤー。ドメイン層は @xyflow/react を一切 import しない。
 */
import dagre from "dagre";
import type { Edge as FlowEdge, Node as FlowNode } from "@xyflow/react";
import {
  buildHierarchy,
  type IssueTreeEdge,
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

// カードの概算サイズ (dagre は正確な実測ではなく概算サイズで間隔を計算する)
const NODE_WIDTH = 240;
const NODE_HEIGHT = 104;
const RANK_SEP = 96; // 階層 (列) 間の間隔
const NODE_SEP = 28; // 兄弟 (行) 間の間隔

/**
 * position が未設定 (null) のノードに階層ベースの自動レイアウト座標を与える。
 * dagre (tidy tree アルゴリズム) を使い、親は必ず子の縦方向の中央に、
 * 幹/枝の接続線がカードの中心からズレないことを保証する。
 * 独自実装だと「子ノード追加のたびに全体が再配置されズレる」問題が起きやすいため、
 * 実績のあるレイアウトエンジンに委譲する。
 */
export function computeAutoLayout(
  nodes: IssueTreeNode[],
  treeType: IssueTreeType,
): Map<string, IssueTreeNodePosition> {
  const roots = buildHierarchy(nodes, treeType);
  const positions = new Map<string, IssueTreeNodePosition>();
  if (roots.length === 0) return positions;

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: RANK_SEP, nodesep: NODE_SEP });
  g.setDefaultEdgeLabel(() => ({}));

  const scoped = nodes.filter((n) => n.treeType === treeType);
  for (const n of scoped) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const n of scoped) {
    if (n.parentId) g.setEdge(n.parentId, n.id);
  }

  dagre.layout(g);

  // dagre は中心座標を返すため、React Flow の左上原点座標へ変換する
  for (const n of scoped) {
    const pos = g.node(n.id);
    if (!pos) continue;
    positions.set(n.id, {
      x: Math.round(pos.x - NODE_WIDTH / 2),
      y: Math.round(pos.y - NODE_HEIGHT / 2),
    });
  }
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
