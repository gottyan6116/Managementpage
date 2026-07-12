"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  dimmedNodeIds,
  type IssueTreeEdge,
  type IssueTreeFilters,
  type IssueTreeNode,
  type IssueTreeType,
} from "@/lib/issue-tree/domain";
import {
  ISSUE_NODE_TYPE,
  fromDragStop,
  toFlowEdges,
  toFlowNodes,
  type IssueFlowNode,
} from "@/lib/issue-tree/react-flow-adapter";
import { IssueFlowNodeCard } from "./node-card";
import { IssueFlowActionsContext, type IssueFlowActions } from "./flow-actions";

const nodeTypes = { [ISSUE_NODE_TYPE]: IssueFlowNodeCard };

/**
 * React Flow キャンバス。ドメイン→Flow の変換はアダプタに委譲し、
 * このコンポーネントは表示とイベント配線のみを担う。
 * ノード位置の永続化はドラッグ終了時 (onNodeDragStop) のみ行う。
 */
export function FlowCanvas({
  nodes,
  edges,
  treeType,
  filters,
  selectedId,
  onSelect,
  onMovePersist,
  actions,
  fullscreen,
}: {
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
  treeType: IssueTreeType;
  filters: IssueTreeFilters;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMovePersist: (payload: { id: string; position: { x: number; y: number } }) => void;
  actions: IssueFlowActions;
  fullscreen?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <IssueFlowActionsContext.Provider value={actions}>
        <FlowCanvasInner
          nodes={nodes}
          edges={edges}
          treeType={treeType}
          filters={filters}
          selectedId={selectedId}
          onSelect={onSelect}
          onMovePersist={onMovePersist}
          fullscreen={fullscreen}
        />
      </IssueFlowActionsContext.Provider>
    </ReactFlowProvider>
  );
}

function FlowCanvasInner({
  nodes,
  edges,
  treeType,
  filters,
  selectedId,
  onSelect,
  onMovePersist,
  fullscreen,
}: {
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
  treeType: IssueTreeType;
  filters: IssueTreeFilters;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMovePersist: (payload: { id: string; position: { x: number; y: number } }) => void;
  fullscreen?: boolean;
}) {
  const { fitView } = useReactFlow();
  const dimmed = useMemo(() => dimmedNodeIds(nodes, filters), [nodes, filters]);

  const flowNodes = useMemo(
    () => toFlowNodes(nodes, treeType, { dimmedIds: dimmed, selectedId }),
    [nodes, treeType, dimmed, selectedId],
  );
  const flowEdges = useMemo(
    () => toFlowEdges(nodes, edges, treeType, { dimmedIds: dimmed }),
    [nodes, edges, treeType, dimmed],
  );

  // 構造 (ノード集合・階層) が変わったとき、または全画面切替時に
  // 常に「一番見やすい縮尺」へ自動調整する。ドラッグ中の一時的な座標変化では発火しない。
  const structureSignature = useMemo(
    () =>
      nodes
        .filter((n) => n.treeType === treeType)
        .map((n) => `${n.id}:${n.parentId ?? ""}`)
        .sort()
        .join("|"),
    [nodes, treeType],
  );
  const prevSignature = useRef<string | null>(null);
  useEffect(() => {
    // ノード寸法の計測 (ResizeObserver) が終わってからフィットさせるため一呼吸置く
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 300, maxZoom: 1.1 });
    }, 60);
    prevSignature.current = structureSignature;
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureSignature, treeType, fullscreen]);

  const handleNodeClick: NodeMouseHandler<IssueFlowNode> = (_, node) => {
    onSelect(node.id);
  };

  return (
    <ReactFlow<IssueFlowNode>
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelect(null)}
      onNodeDragStop={(_, node) => onMovePersist(fromDragStop(node))}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
      minZoom={0.15}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      deleteKeyCode={null}
      className="bg-transparent"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#d8e2f0" />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}

export default FlowCanvas;
