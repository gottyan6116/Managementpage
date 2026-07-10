/**
 * LocalStorageIssueTreeRepository — アプリ実装。
 * ストレージ可用性チェック / スキーマ読込 / マイグレーション / エラー正規化を担う。
 * ストレージはコンストラクタ注入 (テストはブラウザグローバル不要)。
 */
import {
  collectDescendantIds,
  type IssueTreeEdge,
  type IssueTreeNode,
  type IssueTreeNodeStatus,
  type IssueTreeProject,
  defaultNodeType,
} from "./domain.ts";
import {
  IssueTreeRepositoryError,
  type IssueTreeEdgeInit,
  type IssueTreeNodeInit,
  type IssueTreeNodePatch,
  type IssueTreeProjectInit,
  type IssueTreeProjectPatch,
  type IssueTreeRepository,
} from "./repository.ts";
import { seedEdges, seedNodes, seedProjects } from "./seeds.ts";

export const ISSUE_TREE_STORAGE_KEY = "promanage-issue-tree-v1";
/** 旧モーダル実装 (mock repo) の保存キー。初回ロード時に移行する */
export const LEGACY_MOCK_STORAGE_KEY = "promanage-mock-v2";

export interface IssueTreeStorageV1 {
  version: 1;
  projects: IssueTreeProject[];
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
}

/** localStorage 互換の最小インターフェイス (テスト注入用) */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface State {
  projects: IssueTreeProject[];
  nodes: IssueTreeNode[];
  edges: IssueTreeEdge[];
}

function nowISO(): string {
  return new Date().toISOString();
}

let idSeq = 0;
function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  idSeq += 1;
  return `${prefix}-${Date.now()}-${idSeq}`;
}

/** ブラウザ実行時のみ localStorage を返す (SSR では null) */
export function resolveBrowserStorage(): StorageAdapter | null {
  if (typeof window === "undefined") return null;
  try {
    const probeKey = "__promanage_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    // プライベートモード等で localStorage が使えない環境
    return null;
  }
}

/* ===== マイグレーション ===== */

const VALID_STATUSES: IssueTreeNodeStatus[] = [
  "unverified",
  "testing",
  "supported",
  "rejected",
  "actionized",
];

/** 旧 "validating" を "testing" へ正規化 */
function migrateStatus(value: unknown): IssueTreeNodeStatus {
  if (value === "validating") return "testing";
  if (VALID_STATUSES.includes(value as IssueTreeNodeStatus)) {
    return value as IssueTreeNodeStatus;
  }
  return "unverified";
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** 保存ペイロード (unknown) を検証しつつ V1 へ移行。復元不能なら null */
export function migrateStoredPayload(raw: unknown): IssueTreeStorageV1 | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Partial<IssueTreeStorageV1>;
  if (!Array.isArray(data.projects) || !Array.isArray(data.nodes)) return null;

  const projects = data.projects.filter(
    (p): p is IssueTreeProject =>
      typeof p === "object" && p !== null && typeof (p as IssueTreeProject).id === "string",
  );
  const projectIds = new Set(projects.map((p) => p.id));

  // 不正参照の除去: 存在しないプロジェクトのノードは捨て、親が消えたノードはルート化
  const rawNodes = (data.nodes as unknown[]).filter(
    (n): n is IssueTreeNode =>
      typeof n === "object" && n !== null && typeof (n as IssueTreeNode).id === "string",
  );
  const scopedNodes = rawNodes.filter((n) => projectIds.has(n.projectId));
  const nodeIds = new Set(scopedNodes.map((n) => n.id));
  const nodes: IssueTreeNode[] = scopedNodes.map((n) => ({
    ...n,
    parentId: n.parentId && nodeIds.has(n.parentId) ? n.parentId : null,
    status: migrateStatus(n.status),
    evidenceItems: Array.isArray(n.evidenceItems) ? n.evidenceItems : [],
    linkedTaskIds: Array.isArray(n.linkedTaskIds) ? n.linkedTaskIds : [],
    validationData: {
      dataNeeded: asString(n.validationData?.dataNeeded),
      method: asString(n.validationData?.method),
    },
    position:
      n.position && typeof n.position.x === "number" && typeof n.position.y === "number"
        ? n.position
        : null,
  }));

  const edges: IssueTreeEdge[] = (Array.isArray(data.edges) ? data.edges : [])
    .filter(
      (e): e is IssueTreeEdge =>
        typeof e === "object" && e !== null && typeof (e as IssueTreeEdge).id === "string",
    )
    .filter(
      (e) =>
        projectIds.has(e.projectId) &&
        nodeIds.has(e.sourceNodeId) &&
        nodeIds.has(e.targetNodeId),
    );

  return { version: 1, projects, nodes, edges };
}

/* 旧モーダル実装 (issueBoards/issueNodes) からの移行 */

interface LegacyBoard {
  id: string;
  clientName?: string;
  projectId?: string | null;
  name?: string;
  category?: string;
  objective?: string;
  kpi?: string;
  updatedAt?: string;
}

interface LegacyNode {
  id: string;
  boardId?: string;
  treeKind?: string;
  parentId?: string | null;
  title?: string;
  hypothesis?: string;
  evidence?: string;
  dataNeeded?: string;
  method?: string;
  status?: string;
  priority?: string;
  sortOrder?: number;
  createdTaskId?: string | null;
  updatedAt?: string;
}

export function migrateLegacyMockPayload(raw: unknown): IssueTreeStorageV1 | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as { issueBoards?: unknown; issueNodes?: unknown };
  if (!Array.isArray(data.issueBoards) || data.issueBoards.length === 0) return null;

  const boards = data.issueBoards as LegacyBoard[];
  const legacyNodes = (Array.isArray(data.issueNodes) ? data.issueNodes : []) as LegacyNode[];

  const projects: IssueTreeProject[] = boards
    .filter((b) => typeof b.id === "string")
    .map((b) => ({
      id: b.id,
      clientName: asString(b.clientName, "未設定クライアント"),
      name: asString(b.name, "無題の案件"),
      category: asString(b.category, "その他"),
      objective: asString(b.objective),
      kpis: asString(b.kpi)
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label, i) => ({ id: `${b.id}-kpi-${i}`, label, target: "", current: "" })),
      nextAction: "",
      status: "active" as const,
      linkedProjectId: b.projectId ?? null,
      ownerId: null,
      deadline: null,
      createdAt: asString(b.updatedAt, nowISO()),
      updatedAt: asString(b.updatedAt, nowISO()),
    }));
  const projectIds = new Set(projects.map((p) => p.id));

  const scoped = legacyNodes.filter(
    (n) => typeof n.id === "string" && n.boardId && projectIds.has(n.boardId),
  );
  const nodeIds = new Set(scoped.map((n) => n.id));
  const nodes: IssueTreeNode[] = scoped.map((n) => {
    const treeType =
      n.treeKind === "logic" || n.treeKind === "kpi" || n.treeKind === "process"
        ? n.treeKind
        : "issue";
    return {
      id: n.id,
      projectId: n.boardId as string,
      treeType,
      parentId: n.parentId && nodeIds.has(n.parentId) ? n.parentId : null,
      order: typeof n.sortOrder === "number" ? n.sortOrder : 0,
      title: asString(n.title, "無題の論点"),
      description: "",
      nodeType: defaultNodeType(treeType),
      status: migrateStatus(n.status),
      priority: n.priority === "high" || n.priority === "low" ? n.priority : "medium",
      hypothesis: asString(n.hypothesis),
      evidenceItems: asString(n.evidence)
        ? [
            {
              id: `${n.id}-ev-1`,
              text: asString(n.evidence),
              source: "",
              createdAt: asString(n.updatedAt, nowISO()),
            },
          ]
        : [],
      validationData: { dataNeeded: asString(n.dataNeeded), method: asString(n.method) },
      conclusion: "",
      ownerId: null,
      deadline: null,
      linkedTaskIds: n.createdTaskId ? [n.createdTaskId] : [],
      collapsed: false,
      position: null,
      createdAt: asString(n.updatedAt, nowISO()),
      updatedAt: asString(n.updatedAt, nowISO()),
    };
  });

  return { version: 1, projects, nodes, edges: [] };
}

/* ===== リポジトリ本体 ===== */

export class LocalStorageIssueTreeRepository implements IssueTreeRepository {
  private storage: StorageAdapter | null;
  private state: State | null = null;

  constructor(options?: { storage?: StorageAdapter | null }) {
    this.storage =
      options && "storage" in options ? (options.storage ?? null) : resolveBrowserStorage();
  }

  /* ---- 読込 / 保存 ---- */

  private load(): State {
    if (this.state) return this.state;

    if (!this.storage) {
      // SSR / ストレージ利用不可: メモリ上のシードで動作する
      this.state = { projects: seedProjects(), nodes: seedNodes(), edges: seedEdges() };
      return this.state;
    }

    const raw = this.readKey(ISSUE_TREE_STORAGE_KEY);
    if (raw !== null) {
      try {
        const migrated = migrateStoredPayload(JSON.parse(raw));
        if (migrated) {
          this.state = {
            projects: migrated.projects,
            nodes: migrated.nodes,
            edges: migrated.edges,
          };
          return this.state;
        }
      } catch {
        // JSON 破損はシードへフォールバック (下へ続く)
      }
    }

    // 自前キーがない/壊れている場合: 旧モーダル実装のデータからの移行を試す
    const legacyRaw = this.readKey(LEGACY_MOCK_STORAGE_KEY);
    if (legacyRaw !== null) {
      try {
        const migrated = migrateLegacyMockPayload(JSON.parse(legacyRaw));
        if (migrated) {
          this.state = {
            projects: migrated.projects,
            nodes: migrated.nodes,
            edges: migrated.edges,
          };
          this.persist();
          return this.state;
        }
      } catch {
        // 旧データも壊れていればシードへ
      }
    }

    this.state = { projects: seedProjects(), nodes: seedNodes(), edges: seedEdges() };
    this.persist();
    return this.state;
  }

  private readKey(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch (cause) {
      throw new IssueTreeRepositoryError(
        "storage_unavailable",
        "ストレージへアクセスできませんでした",
        cause,
      );
    }
  }

  private persist(): void {
    if (!this.storage || !this.state) return;
    const payload: IssueTreeStorageV1 = { version: 1, ...this.state };
    try {
      this.storage.setItem(ISSUE_TREE_STORAGE_KEY, JSON.stringify(payload));
    } catch (cause) {
      const name = (cause as { name?: string } | null)?.name ?? "";
      if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
        throw new IssueTreeRepositoryError(
          "quota_exceeded",
          "保存容量の上限に達しました",
          cause,
        );
      }
      throw new IssueTreeRepositoryError("write_failed", "保存に失敗しました", cause);
    }
  }

  /* ---- Projects ---- */

  async listProjects(): Promise<IssueTreeProject[]> {
    return [...this.load().projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(id: string): Promise<IssueTreeProject | null> {
    return this.load().projects.find((p) => p.id === id) ?? null;
  }

  async createProject(init: IssueTreeProjectInit): Promise<IssueTreeProject> {
    const state = this.load();
    const now = nowISO();
    const project: IssueTreeProject = {
      id: newId("itp"),
      clientName: init.clientName.trim() || "未設定クライアント",
      name: init.name.trim() || "無題の案件",
      category: init.category.trim() || "その他",
      objective: init.objective ?? "",
      kpis: init.kpis ?? [],
      nextAction: init.nextAction ?? "",
      status: init.status ?? "active",
      linkedProjectId: init.linkedProjectId ?? null,
      ownerId: init.ownerId ?? null,
      deadline: init.deadline ?? null,
      createdAt: now,
      updatedAt: now,
    };
    state.projects.push(project);
    this.persist();
    return project;
  }

  async updateProject(id: string, patch: IssueTreeProjectPatch): Promise<IssueTreeProject> {
    const state = this.load();
    const project = state.projects.find((p) => p.id === id);
    if (!project) {
      throw new IssueTreeRepositoryError("not_found", `プロジェクト ${id} が見つかりません`);
    }
    Object.assign(project, patch, { updatedAt: nowISO() });
    this.persist();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    const state = this.load();
    state.projects = state.projects.filter((p) => p.id !== id);
    state.nodes = state.nodes.filter((n) => n.projectId !== id);
    state.edges = state.edges.filter((e) => e.projectId !== id);
    this.persist();
  }

  /* ---- Nodes ---- */

  async listNodes(projectId: string): Promise<IssueTreeNode[]> {
    return this.load()
      .nodes.filter((n) => n.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  async createNode(init: IssueTreeNodeInit): Promise<IssueTreeNode> {
    const state = this.load();
    const siblings = state.nodes.filter(
      (n) =>
        n.projectId === init.projectId &&
        n.treeType === init.treeType &&
        n.parentId === (init.parentId ?? null),
    );
    const now = nowISO();
    const node: IssueTreeNode = {
      id: newId("itn"),
      projectId: init.projectId,
      treeType: init.treeType,
      parentId: init.parentId ?? null,
      order: init.order ?? siblings.length + 1,
      title: init.title.trim() || "新しい論点",
      description: init.description ?? "",
      nodeType: init.nodeType ?? defaultNodeType(init.treeType),
      status: init.status ?? "unverified",
      priority: init.priority ?? "medium",
      hypothesis: init.hypothesis ?? "",
      evidenceItems: init.evidenceItems ?? [],
      validationData: init.validationData ?? { dataNeeded: "", method: "" },
      conclusion: init.conclusion ?? "",
      ownerId: init.ownerId ?? null,
      deadline: init.deadline ?? null,
      linkedTaskIds: init.linkedTaskIds ?? [],
      collapsed: init.collapsed ?? false,
      position: init.position ?? null,
      createdAt: now,
      updatedAt: now,
    };
    state.nodes.push(node);
    this.touchProject(init.projectId);
    this.persist();
    return node;
  }

  async updateNode(id: string, patch: IssueTreeNodePatch): Promise<IssueTreeNode> {
    const state = this.load();
    const node = state.nodes.find((n) => n.id === id);
    if (!node) {
      throw new IssueTreeRepositoryError("not_found", `ノード ${id} が見つかりません`);
    }
    Object.assign(node, patch, { updatedAt: nowISO() });
    this.touchProject(node.projectId);
    this.persist();
    return node;
  }

  async deleteNode(id: string): Promise<string[]> {
    const state = this.load();
    const target = state.nodes.find((n) => n.id === id);
    if (!target) return [];
    const ids = new Set(collectDescendantIds(state.nodes, id));
    state.nodes = state.nodes.filter((n) => !ids.has(n.id));
    state.edges = state.edges.filter(
      (e) => !ids.has(e.sourceNodeId) && !ids.has(e.targetNodeId),
    );
    this.touchProject(target.projectId);
    this.persist();
    return [...ids];
  }

  /* ---- Edges ---- */

  async listEdges(projectId: string): Promise<IssueTreeEdge[]> {
    return this.load().edges.filter((e) => e.projectId === projectId);
  }

  async createEdge(init: IssueTreeEdgeInit): Promise<IssueTreeEdge> {
    const state = this.load();
    const now = nowISO();
    const edge: IssueTreeEdge = {
      id: newId("ite"),
      projectId: init.projectId,
      treeType: init.treeType,
      sourceNodeId: init.sourceNodeId,
      targetNodeId: init.targetNodeId,
      relationType: init.relationType ?? "relates",
      label: init.label ?? "",
      createdAt: now,
      updatedAt: now,
    };
    state.edges.push(edge);
    this.touchProject(init.projectId);
    this.persist();
    return edge;
  }

  async deleteEdge(id: string): Promise<void> {
    const state = this.load();
    state.edges = state.edges.filter((e) => e.id !== id);
    this.persist();
  }

  /* ---- Undo/Redo ---- */

  async replaceProjectGraph(
    projectId: string,
    nodes: IssueTreeNode[],
    edges: IssueTreeEdge[],
  ): Promise<void> {
    const state = this.load();
    state.nodes = [
      ...state.nodes.filter((n) => n.projectId !== projectId),
      ...nodes.map((n) => ({ ...n })),
    ];
    state.edges = [
      ...state.edges.filter((e) => e.projectId !== projectId),
      ...edges.map((e) => ({ ...e })),
    ];
    this.touchProject(projectId);
    this.persist();
  }

  private touchProject(projectId: string): void {
    const project = this.state?.projects.find((p) => p.id === projectId);
    if (project) project.updatedAt = nowISO();
  }
}
