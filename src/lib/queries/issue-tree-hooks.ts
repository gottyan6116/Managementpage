"use client";

/**
 * Issue Tree ワークスペースのデータアクセス層。
 * TanStack Query が project/nodes/edges の正本を持ち、
 * Zustand (issue-tree-store) は UI 状態と Undo/Redo 履歴のみを持つ。
 * ミューテーション結果が saveStatus (saving/saved/error) を駆動する。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { LocalStorageIssueTreeRepository } from "@/lib/issue-tree/local-storage-repository";
import {
  IssueTreeRepositoryError,
  type IssueTreeEdgeInit,
  type IssueTreeNodeInit,
  type IssueTreeNodePatch,
  type IssueTreeProjectInit,
  type IssueTreeProjectPatch,
  type IssueTreeRepository,
} from "@/lib/issue-tree/repository";
import type {
  IssueTreeEdge,
  IssueTreeNode,
  IssueTreeProject,
} from "@/lib/issue-tree/domain";
import { useIssueTreeStore, type IssueTreeSnapshot } from "@/stores/issue-tree-store";

/** アプリ実装のバインディング。フェーズ4で Supabase 実装へ差し替える */
export const issueTreeRepository: IssueTreeRepository =
  new LocalStorageIssueTreeRepository();

export const itk = {
  summaries: ["issue-tree", "summaries"] as const,
  project: (id: string) => ["issue-tree", "project", id] as const,
  nodes: (projectId: string) => ["issue-tree", "nodes", projectId] as const,
  edges: (projectId: string) => ["issue-tree", "edges", projectId] as const,
};

export interface IssueTreeProjectSummary extends IssueTreeProject {
  nodeCount: number;
  testingCount: number;
  actionizedCount: number;
}

export function useIssueTreeProjectSummaries() {
  return useQuery({
    queryKey: itk.summaries,
    queryFn: async (): Promise<IssueTreeProjectSummary[]> => {
      const projects = await issueTreeRepository.listProjects();
      return Promise.all(
        projects.map(async (p) => {
          const nodes = await issueTreeRepository.listNodes(p.id);
          return {
            ...p,
            nodeCount: nodes.length,
            testingCount: nodes.filter((n) => n.status === "testing").length,
            actionizedCount: nodes.filter((n) => n.status === "actionized").length,
          };
        }),
      );
    },
  });
}

export function useIssueTreeProject(id: string) {
  return useQuery({
    queryKey: itk.project(id),
    queryFn: () => issueTreeRepository.getProject(id),
  });
}

export function useIssueTreeNodes(projectId: string) {
  return useQuery({
    queryKey: itk.nodes(projectId),
    queryFn: () => issueTreeRepository.listNodes(projectId),
  });
}

export function useIssueTreeEdges(projectId: string) {
  return useQuery({
    queryKey: itk.edges(projectId),
    queryFn: () => issueTreeRepository.listEdges(projectId),
  });
}

/* ===== ミューテーション共通 ===== */

export function repositoryErrorMessage(error: unknown): string {
  if (error instanceof IssueTreeRepositoryError) {
    switch (error.code) {
      case "quota_exceeded":
        return "保存容量の上限に達しました。不要なデータを削除してください。";
      case "storage_unavailable":
        return "ブラウザのストレージにアクセスできません。";
      case "not_found":
        return "対象が見つかりませんでした。再読み込みしてください。";
      default:
        return "保存に失敗しました。";
    }
  }
  return "保存に失敗しました。";
}

function snapshotFromCache(qc: QueryClient, projectId: string): IssueTreeSnapshot {
  return {
    nodes: qc.getQueryData<IssueTreeNode[]>(itk.nodes(projectId)) ?? [],
    edges: qc.getQueryData<IssueTreeEdge[]>(itk.edges(projectId)) ?? [],
  };
}

function invalidateProject(qc: QueryClient, projectId: string) {
  qc.invalidateQueries({ queryKey: itk.nodes(projectId) });
  qc.invalidateQueries({ queryKey: itk.edges(projectId) });
  qc.invalidateQueries({ queryKey: itk.project(projectId) });
  qc.invalidateQueries({ queryKey: itk.summaries });
}

/**
 * saveStatus の駆動と Undo 履歴の積み込みを共通化したグラフ変更ミューテーション。
 * pushHistory=false は位置移動の連続保存など履歴に積みたくない操作用。
 */
function useGraphMutation<TInput, TResult>(
  projectId: string,
  mutationFn: (input: TInput) => Promise<TResult>,
  options?: { pushHistory?: boolean },
) {
  const qc = useQueryClient();
  const setSaveStatus = useIssueTreeStore((s) => s.setSaveStatus);
  const pushHistory = useIssueTreeStore((s) => s.pushHistory);

  return useMutation({
    mutationFn,
    onMutate: () => {
      if (options?.pushHistory !== false) {
        pushHistory(snapshotFromCache(qc, projectId));
      }
      setSaveStatus("saving");
    },
    onSuccess: () => setSaveStatus("saved"),
    onError: (error) => setSaveStatus("error", repositoryErrorMessage(error)),
    onSettled: () => invalidateProject(qc, projectId),
  });
}

export function useCreateIssueTreeNode(projectId: string) {
  return useGraphMutation(projectId, (init: Omit<IssueTreeNodeInit, "projectId">) =>
    issueTreeRepository.createNode({ ...init, projectId }),
  );
}

export function useUpdateIssueTreeNode(projectId: string, opts?: { history?: boolean }) {
  return useGraphMutation(
    projectId,
    ({ id, ...patch }: { id: string } & IssueTreeNodePatch) =>
      issueTreeRepository.updateNode(id, patch),
    { pushHistory: opts?.history !== false },
  );
}

export function useDeleteIssueTreeNode(projectId: string) {
  return useGraphMutation(projectId, (id: string) => issueTreeRepository.deleteNode(id));
}

export function useCreateIssueTreeEdge(projectId: string) {
  return useGraphMutation(projectId, (init: Omit<IssueTreeEdgeInit, "projectId">) =>
    issueTreeRepository.createEdge({ ...init, projectId }),
  );
}

export function useDeleteIssueTreeEdge(projectId: string) {
  return useGraphMutation(projectId, (id: string) => issueTreeRepository.deleteEdge(id));
}

/* ===== プロジェクト CRUD ===== */

export function useCreateIssueTreeProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (init: IssueTreeProjectInit) => issueTreeRepository.createProject(init),
    onSettled: () => qc.invalidateQueries({ queryKey: itk.summaries }),
  });
}

export function useUpdateIssueTreeProject(projectId: string) {
  const qc = useQueryClient();
  const setSaveStatus = useIssueTreeStore((s) => s.setSaveStatus);
  return useMutation({
    mutationFn: (patch: IssueTreeProjectPatch) =>
      issueTreeRepository.updateProject(projectId, patch),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: () => setSaveStatus("saved"),
    onError: (error) => setSaveStatus("error", repositoryErrorMessage(error)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: itk.project(projectId) });
      qc.invalidateQueries({ queryKey: itk.summaries });
    },
  });
}

export function useDeleteIssueTreeProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issueTreeRepository.deleteProject(id),
    onSettled: () => qc.invalidateQueries({ queryKey: itk.summaries }),
  });
}

/* ===== Undo / Redo ===== */

export function useIssueTreeUndoRedo(projectId: string) {
  const qc = useQueryClient();
  const setSaveStatus = useIssueTreeStore((s) => s.setSaveStatus);
  const canUndo = useIssueTreeStore((s) => s.past.length > 0);
  const canRedo = useIssueTreeStore((s) => s.future.length > 0);

  async function applySnapshot(snapshot: IssueTreeSnapshot) {
    setSaveStatus("saving");
    try {
      await issueTreeRepository.replaceProjectGraph(
        projectId,
        snapshot.nodes,
        snapshot.edges,
      );
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus("error", repositoryErrorMessage(error));
    } finally {
      invalidateProject(qc, projectId);
    }
  }

  async function undo() {
    const current = snapshotFromCache(qc, projectId);
    const previous = useIssueTreeStore.getState().popUndo(current);
    if (previous) await applySnapshot(previous);
  }

  async function redo() {
    const current = snapshotFromCache(qc, projectId);
    const next = useIssueTreeStore.getState().popRedo(current);
    if (next) await applySnapshot(next);
  }

  return { undo, redo, canUndo, canRedo };
}
