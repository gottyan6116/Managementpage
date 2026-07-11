"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type NodeMouseHandler,
  useReactFlow,
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
  fullscreen: boolean;
}) {
  const dimmed = useMemo(() => dimmedNodeIds(nodes, filters), [nodes, filters]);

  const flowNodes = useMemo(
    () => toFlowNodes(nodes, treeType, { dimmedIds: dimmed, selectedId }),
    [nodes, treeType, dimmed, selectedId],
  );
  const flowEdges = useMemo(
    () => toFlowEdges(nodes, edges, treeType, { dimmedIds: dimmed }),
    [nodes, edges, treeType, dimmed],
  );

  const handleNodeClick: NodeMouseHandler<IssueFlowNode> = (_, node) => {
    onSelect(node.id);
  };

  return (
    <ReactFlowProvider>
      <CanvasBody
        flowNodes={flowNodes}
        flowEdges={flowEdges}
        selectedId={selectedId}
        onSelect={onSelect}
        onMovePersist={onMovePersist}
        actions={actions}
        fullscreen={fullscreen}
      />
    </ReactFlowProvider>
  );
}

function CanvasBody({ flowNodes, flowEdges, selectedId, onSelect, onMovePersist, actions, fullscreen }: {
  flowNodes: IssueFlowNode[]; flowEdges: ReturnType<typeof toFlowEdges>; selectedId: string | null;
  onSelect: (id: string | null) => void; onMovePersist: (payload: { id: string; position: { x: number; y: number } }) => void;
  actions: IssueFlowActions; fullscreen: boolean;
}) {
  const { fitView, updateNodeInternals } = useReactFlow();
  useEffect(() => {
    const id = requestAnimationFrame(() => { flowNodes.forEach((node) => updateNodeInternals(node.id)); fitView({ padding: 0.16, maxZoom: 1.1, duration: 180 }); });
    return () => cancelAnimationFrame(id);
  }, [fitView, flowNodes, fullscreen, updateNodeInternals]);
  return <IssueFlowActionsContext.Provider value={actions}>
        <ReactFlow<IssueFlowNode>
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onPaneClick={() => onSelect(null)}
          onNodeDragStop={(_, node) => onMovePersist(fromDragStop(node))}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          deleteKeyCode={null}
          className="bg-transparent"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#d8e2f0" />
          {!fullscreen && <Controls showInteractive={false} position="bottom-right" />}
        </ReactFlow>
      </IssueFlowActionsContext.Provider>;
}

export default FlowCanvas;
