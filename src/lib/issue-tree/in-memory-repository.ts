/**
 * InMemoryIssueTreeRepository — テスト用の独立実装。
 * LocalStorage 実装に依存せず、同じインターフェイス契約を満たす。
 */
import {
  collectDescendantIds,
  defaultNodeType,
  type IssueTreeEdge,
  type IssueTreeNode,
  type IssueTreeProject,
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

let seq = 0;
const nextId = (prefix: string) => `${prefix}-mem-${++seq}`;
const nowISO = () => new Date().toISOString();

export class InMemoryIssueTreeRepository implements IssueTreeRepository {
  private projects: IssueTreeProject[] = [];
  private nodes: IssueTreeNode[] = [];
  private edges: IssueTreeEdge[] = [];

  constructor(initial?: {
    projects?: IssueTreeProject[];
    nodes?: IssueTreeNode[];
    edges?: IssueTreeEdge[];
  }) {
    this.projects = initial?.projects?.map((p) => ({ ...p })) ?? [];
    this.nodes = initial?.nodes?.map((n) => ({ ...n })) ?? [];
    this.edges = initial?.edges?.map((e) => ({ ...e })) ?? [];
  }

  async listProjects(): Promise<IssueTreeProject[]> {
    return [...this.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(id: string): Promise<IssueTreeProject | null> {
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async createProject(init: IssueTreeProjectInit): Promise<IssueTreeProject> {
    const now = nowISO();
    const project: IssueTreeProject = {
      id: nextId("itp"),
      clientName: init.clientName,
      name: init.name,
      category: init.category,
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
    this.projects.push(project);
    return project;
  }

  async updateProject(id: string, patch: IssueTreeProjectPatch): Promise<IssueTreeProject> {
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new IssueTreeRepositoryError("not_found", `project ${id} not found`);
    Object.assign(project, patch, { updatedAt: nowISO() });
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.nodes = this.nodes.filter((n) => n.projectId !== id);
    this.edges = this.edges.filter((e) => e.projectId !== id);
  }

  async listNodes(projectId: string): Promise<IssueTreeNode[]> {
    return this.nodes
      .filter((n) => n.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  async createNode(init: IssueTreeNodeInit): Promise<IssueTreeNode> {
    const now = nowISO();
    const siblings = this.nodes.filter(
      (n) =>
        n.projectId === init.projectId &&
        n.treeType === init.treeType &&
        n.parentId === (init.parentId ?? null),
    );
    const node: IssueTreeNode = {
      id: nextId("itn"),
      projectId: init.projectId,
      treeType: init.treeType,
      parentId: init.parentId ?? null,
      order: init.order ?? siblings.length + 1,
      title: init.title,
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
    this.nodes.push(node);
    return node;
  }

  async updateNode(id: string, patch: IssueTreeNodePatch): Promise<IssueTreeNode> {
    const node = this.nodes.find((n) => n.id === id);
    if (!node) throw new IssueTreeRepositoryError("not_found", `node ${id} not found`);
    Object.assign(node, patch, { updatedAt: nowISO() });
    return node;
  }

  async deleteNode(id: string): Promise<string[]> {
    if (!this.nodes.some((n) => n.id === id)) return [];
    const ids = new Set(collectDescendantIds(this.nodes, id));
    this.nodes = this.nodes.filter((n) => !ids.has(n.id));
    this.edges = this.edges.filter(
      (e) => !ids.has(e.sourceNodeId) && !ids.has(e.targetNodeId),
    );
    return [...ids];
  }

  async listEdges(projectId: string): Promise<IssueTreeEdge[]> {
    return this.edges.filter((e) => e.projectId === projectId);
  }

  async createEdge(init: IssueTreeEdgeInit): Promise<IssueTreeEdge> {
    const now = nowISO();
    const edge: IssueTreeEdge = {
      id: nextId("ite"),
      projectId: init.projectId,
      treeType: init.treeType,
      sourceNodeId: init.sourceNodeId,
      targetNodeId: init.targetNodeId,
      relationType: init.relationType ?? "relates",
      label: init.label ?? "",
      createdAt: now,
      updatedAt: now,
    };
    this.edges.push(edge);
    return edge;
  }

  async deleteEdge(id: string): Promise<void> {
    this.edges = this.edges.filter((e) => e.id !== id);
  }

  async replaceProjectGraph(
    projectId: string,
    nodes: IssueTreeNode[],
    edges: IssueTreeEdge[],
  ): Promise<void> {
    this.nodes = [
      ...this.nodes.filter((n) => n.projectId !== projectId),
      ...nodes.map((n) => ({ ...n })),
    ];
    this.edges = [
      ...this.edges.filter((e) => e.projectId !== projectId),
      ...edges.map((e) => ({ ...e })),
    ];
  }
}
