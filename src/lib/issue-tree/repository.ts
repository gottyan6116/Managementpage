/**
 * Issue Tree の永続化は必ずこのインターフェイス経由でアクセスする。
 * - アプリ実装: LocalStorageIssueTreeRepository
 * - テスト実装: InMemoryIssueTreeRepository
 * - フェーズ4: SupabaseIssueTreeRepository (docs/07_issue_tree.md 参照)
 */
import type {
  IssueTreeEdge,
  IssueTreeNode,
  IssueTreeProject,
} from "./domain.ts";

/* ===== 正規化エラー ===== */

export type IssueTreeRepositoryErrorCode =
  | "storage_unavailable"
  | "parse_error"
  | "quota_exceeded"
  | "write_failed"
  | "not_found";

export class IssueTreeRepositoryError extends Error {
  readonly code: IssueTreeRepositoryErrorCode;

  constructor(code: IssueTreeRepositoryErrorCode, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "IssueTreeRepositoryError";
    this.code = code;
  }
}

/* ===== 入力型 ===== */

export type IssueTreeProjectInit = Pick<
  IssueTreeProject,
  "clientName" | "name" | "category"
> &
  Partial<
    Pick<
      IssueTreeProject,
      "objective" | "kpis" | "nextAction" | "status" | "linkedProjectId" | "ownerId" | "deadline"
    >
  >;

export type IssueTreeProjectPatch = Partial<
  Omit<IssueTreeProject, "id" | "createdAt" | "updatedAt">
>;

export type IssueTreeNodeInit = Pick<
  IssueTreeNode,
  "projectId" | "treeType" | "parentId" | "title"
> &
  Partial<
    Omit<IssueTreeNode, "id" | "projectId" | "treeType" | "parentId" | "title" | "createdAt" | "updatedAt">
  >;

export type IssueTreeNodePatch = Partial<
  Omit<IssueTreeNode, "id" | "projectId" | "createdAt" | "updatedAt">
>;

export type IssueTreeEdgeInit = Pick<
  IssueTreeEdge,
  "projectId" | "treeType" | "sourceNodeId" | "targetNodeId"
> &
  Partial<Pick<IssueTreeEdge, "relationType" | "label">>;

/* ===== リポジトリ ===== */

export interface IssueTreeRepository {
  listProjects(): Promise<IssueTreeProject[]>;
  getProject(id: string): Promise<IssueTreeProject | null>;
  createProject(init: IssueTreeProjectInit): Promise<IssueTreeProject>;
  updateProject(id: string, patch: IssueTreeProjectPatch): Promise<IssueTreeProject>;
  /** プロジェクトと配下のノード・エッジをまとめて削除 */
  deleteProject(id: string): Promise<void>;

  listNodes(projectId: string): Promise<IssueTreeNode[]>;
  createNode(init: IssueTreeNodeInit): Promise<IssueTreeNode>;
  updateNode(id: string, patch: IssueTreeNodePatch): Promise<IssueTreeNode>;
  /** ノードと子孫、および参照するエッジを削除。削除した id 一覧を返す */
  deleteNode(id: string): Promise<string[]>;

  listEdges(projectId: string): Promise<IssueTreeEdge[]>;
  createEdge(init: IssueTreeEdgeInit): Promise<IssueTreeEdge>;
  deleteEdge(id: string): Promise<void>;

  /**
   * Undo/Redo 用: プロジェクト配下のノード・エッジをスナップショットで置き換える。
   * 履歴自体は Zustand (セッション内) が持ち、永続化はしない。
   */
  replaceProjectGraph(
    projectId: string,
    nodes: IssueTreeNode[],
    edges: IssueTreeEdge[],
  ): Promise<void>;
}
