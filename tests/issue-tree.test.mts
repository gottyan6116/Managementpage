import test from "node:test";
import assert from "node:assert/strict";
import {
  dimmedNodeIds,
  matchesFilters,
  collectDescendantIds,
  EMPTY_FILTERS,
  type IssueTreeNode,
} from "../src/lib/issue-tree/domain.ts";
import {
  ISSUE_TREE_STORAGE_KEY,
  LEGACY_MOCK_STORAGE_KEY,
  LocalStorageIssueTreeRepository,
  migrateLegacyMockPayload,
  migrateStoredPayload,
  type StorageAdapter,
} from "../src/lib/issue-tree/local-storage-repository.ts";
import { InMemoryIssueTreeRepository } from "../src/lib/issue-tree/in-memory-repository.ts";
import { IssueTreeRepositoryError } from "../src/lib/issue-tree/repository.ts";
import {
  computeAutoLayout,
  fromDragStop,
  toFlowEdges,
  toFlowNodes,
} from "../src/lib/issue-tree/react-flow-adapter.ts";
import { useIssueTreeStore } from "../src/stores/issue-tree-store.ts";

/** テスト用のメモリ StorageAdapter (ブラウザグローバル不要) */
function fakeStorage(initial: Record<string, string> = {}): StorageAdapter & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function makeNode(partial: Partial<IssueTreeNode> & Pick<IssueTreeNode, "id">): IssueTreeNode {
  return {
    projectId: "p",
    treeType: "issue",
    parentId: null,
    order: 1,
    title: partial.id,
    description: "",
    nodeType: "question",
    status: "unverified",
    priority: "medium",
    hypothesis: "",
    evidenceItems: [],
    validationData: { dataNeeded: "", method: "" },
    conclusion: "",
    ownerId: null,
    deadline: null,
    linkedTaskIds: [],
    collapsed: false,
    position: null,
    createdAt: "2026-07-10",
    updatedAt: "2026-07-10",
    ...partial,
  };
}

/* ===== リポジトリ CRUD (LocalStorage 実装 / 注入ストレージ) ===== */

test("repository CRUD: project → node → edge の作成・更新・削除", async () => {
  const repo = new LocalStorageIssueTreeRepository({ storage: fakeStorage() });

  const project = await repo.createProject({
    clientName: "テスト社",
    name: "CVR改善",
    category: "Webマーケ",
  });
  assert.equal(project.status, "active");

  const updated = await repo.updateProject(project.id, { nextAction: "来週レビュー" });
  assert.equal(updated.nextAction, "来週レビュー");

  const node = await repo.createNode({
    projectId: project.id,
    treeType: "issue",
    parentId: null,
    title: "なぜ低いのか",
  });
  assert.equal(node.nodeType, "question");

  const child = await repo.createNode({
    projectId: project.id,
    treeType: "issue",
    parentId: node.id,
    title: "仮説A",
  });

  const edge = await repo.createEdge({
    projectId: project.id,
    treeType: "issue",
    sourceNodeId: node.id,
    targetNodeId: child.id,
  });
  assert.equal(edge.relationType, "relates");

  assert.equal((await repo.listNodes(project.id)).length, 2);
  assert.equal((await repo.listEdges(project.id)).length, 1);

  await repo.deleteProject(project.id);
  assert.equal(await repo.getProject(project.id), null);
  assert.equal((await repo.listNodes(project.id)).length, 0);
  assert.equal((await repo.listEdges(project.id)).length, 0);
});

test("repository: 存在しない id の更新は not_found の正規化エラー", async () => {
  const repo = new LocalStorageIssueTreeRepository({ storage: fakeStorage() });
  await assert.rejects(
    () => repo.updateNode("missing", { title: "x" }),
    (err: unknown) =>
      err instanceof IssueTreeRepositoryError && err.code === "not_found",
  );
});

test("repository: 書込失敗は write_failed / quota は quota_exceeded に正規化", async () => {
  const failing: StorageAdapter = {
    getItem: () => null,
    setItem: () => {
      throw new Error("boom");
    },
  };
  const repo = new LocalStorageIssueTreeRepository({ storage: failing });
  await assert.rejects(
    () => repo.createProject({ clientName: "a", name: "b", category: "c" }),
    (err: unknown) =>
      err instanceof IssueTreeRepositoryError && err.code === "write_failed",
  );

  const quotaErr = new Error("full");
  quotaErr.name = "QuotaExceededError";
  const quota: StorageAdapter = {
    getItem: () => null,
    setItem: () => {
      throw quotaErr;
    },
  };
  const repo2 = new LocalStorageIssueTreeRepository({ storage: quota });
  await assert.rejects(
    () => repo2.createProject({ clientName: "a", name: "b", category: "c" }),
    (err: unknown) =>
      err instanceof IssueTreeRepositoryError && err.code === "quota_exceeded",
  );
});

/* ===== 復元・マイグレーション・破損フォールバック ===== */

test("localStorage 復元: 別インスタンスで書いた内容を読み戻せる", async () => {
  const storage = fakeStorage();
  const repo1 = new LocalStorageIssueTreeRepository({ storage });
  const project = await repo1.createProject({
    clientName: "永続社",
    name: "復元テスト",
    category: "その他",
  });
  await repo1.createNode({
    projectId: project.id,
    treeType: "kpi",
    parentId: null,
    title: "KPIルート",
  });

  const repo2 = new LocalStorageIssueTreeRepository({ storage });
  const restored = await repo2.getProject(project.id);
  assert.equal(restored?.name, "復元テスト");
  assert.equal((await repo2.listNodes(project.id)).length, 1);
});

test("マイグレーション: validating は testing へ正規化される", () => {
  const payload = {
    version: 1,
    projects: [{ id: "p1", updatedAt: "2026-07-01" }],
    nodes: [makeNode({ id: "n1", projectId: "p1", status: "validating" as never })],
    edges: [],
  };
  const migrated = migrateStoredPayload(payload);
  assert.equal(migrated?.nodes[0].status, "testing");
});

test("マイグレーション: 不正参照 (孤児ノード・宙吊りエッジ) を除去する", () => {
  const payload = {
    version: 1,
    projects: [{ id: "p1", updatedAt: "2026-07-01" }],
    nodes: [
      makeNode({ id: "n1", projectId: "p1" }),
      makeNode({ id: "n2", projectId: "p1", parentId: "ghost" }),
      makeNode({ id: "orphan", projectId: "deleted-project" }),
    ],
    edges: [
      { id: "e1", projectId: "p1", treeType: "issue", sourceNodeId: "n1", targetNodeId: "n2", relationType: "relates", label: "", createdAt: "", updatedAt: "" },
      { id: "e2", projectId: "p1", treeType: "issue", sourceNodeId: "n1", targetNodeId: "orphan", relationType: "relates", label: "", createdAt: "", updatedAt: "" },
    ],
  };
  const migrated = migrateStoredPayload(payload);
  assert.deepEqual(migrated?.nodes.map((n) => n.id), ["n1", "n2"]);
  assert.equal(migrated?.nodes[1].parentId, null); // 親消失はルート化
  assert.deepEqual(migrated?.edges.map((e) => e.id), ["e1"]);
});

test("破損 JSON はシードへフォールバックする", async () => {
  const storage = fakeStorage({ [ISSUE_TREE_STORAGE_KEY]: "{broken json!!" });
  const repo = new LocalStorageIssueTreeRepository({ storage });
  const projects = await repo.listProjects();
  assert.ok(projects.length >= 1); // シードで起動
});

test("旧モーダル実装 (issueBoards/issueNodes) から移行できる", async () => {
  const legacy = {
    issueBoards: [
      { id: "ib-1", clientName: "旧社", name: "旧案件", category: "Webマーケ", objective: "目的", kpi: "CVR / CPA", projectId: "p4", updatedAt: "2026-07-08" },
    ],
    issueNodes: [
      { id: "in-1", boardId: "ib-1", treeKind: "issue", parentId: null, title: "旧論点", status: "validating", priority: "high", sortOrder: 1, evidence: "証拠テキスト", dataNeeded: "GA4", method: "AB", createdTaskId: "t-99", updatedAt: "2026-07-08" },
    ],
  };
  const storage = fakeStorage({ [LEGACY_MOCK_STORAGE_KEY]: JSON.stringify(legacy) });
  const repo = new LocalStorageIssueTreeRepository({ storage });

  const projects = await repo.listProjects();
  assert.equal(projects[0].id, "ib-1");
  assert.deepEqual(projects[0].kpis.map((k) => k.label), ["CVR", "CPA"]);

  const nodes = await repo.listNodes("ib-1");
  assert.equal(nodes[0].status, "testing"); // validating → testing
  assert.deepEqual(nodes[0].linkedTaskIds, ["t-99"]);
  assert.equal(nodes[0].evidenceItems[0].text, "証拠テキスト");
  // 移行結果は新キーへ保存される
  assert.ok(storage.data.has(ISSUE_TREE_STORAGE_KEY));
});

test("migrateLegacyMockPayload: ボードがなければ null", () => {
  assert.equal(migrateLegacyMockPayload({ tasks: [] }), null);
});

/* ===== ノード操作 (InMemory 実装 = 独立実装の契約テスト) ===== */

test("InMemory: 削除は子孫とエッジをカスケードし、削除 id を返す", async () => {
  const repo = new InMemoryIssueTreeRepository({
    projects: [
      { id: "p", clientName: "c", name: "n", category: "k", objective: "", kpis: [], nextAction: "", status: "active", linkedProjectId: null, ownerId: null, deadline: null, createdAt: "", updatedAt: "" },
    ],
    nodes: [
      makeNode({ id: "root" }),
      makeNode({ id: "child", parentId: "root" }),
      makeNode({ id: "grand", parentId: "child" }),
      makeNode({ id: "other" }),
    ],
    edges: [
      { id: "e1", projectId: "p", treeType: "issue", sourceNodeId: "grand", targetNodeId: "other", relationType: "relates", label: "", createdAt: "", updatedAt: "" },
    ],
  });

  const deleted = await repo.deleteNode("root");
  assert.deepEqual(deleted.sort(), ["child", "grand", "root"]);
  assert.deepEqual((await repo.listNodes("p")).map((n) => n.id), ["other"]);
  assert.equal((await repo.listEdges("p")).length, 0);
});

test("InMemory: parentId の付け替え (階層化) ができる", async () => {
  const repo = new InMemoryIssueTreeRepository({
    nodes: [makeNode({ id: "a" }), makeNode({ id: "b" })],
  });
  await repo.updateNode("b", { parentId: "a" });
  const nodes = await repo.listNodes("p");
  assert.equal(nodes.find((n) => n.id === "b")?.parentId, "a");
});

test("collectDescendantIds は自身+子孫のみを返す", () => {
  const nodes = [
    makeNode({ id: "a" }),
    makeNode({ id: "b", parentId: "a" }),
    makeNode({ id: "c", parentId: "b" }),
    makeNode({ id: "x" }),
  ];
  assert.deepEqual(collectDescendantIds(nodes, "a").sort(), ["a", "b", "c"]);
});

/* ===== Undo/Redo (Zustand・セッション内のみ) ===== */

test("undo/redo: pushHistory → popUndo → popRedo が往復する", () => {
  const store = useIssueTreeStore.getState();
  store.clearHistory();

  const v1 = { nodes: [makeNode({ id: "n1", title: "v1" })], edges: [] };
  const v2 = { nodes: [makeNode({ id: "n1", title: "v2" })], edges: [] };

  useIssueTreeStore.getState().pushHistory(v1); // v1 を積んで v2 へ変更した想定
  const undone = useIssueTreeStore.getState().popUndo(v2);
  assert.equal(undone?.nodes[0].title, "v1");

  const redone = useIssueTreeStore.getState().popRedo(v1);
  assert.equal(redone?.nodes[0].title, "v2");

  // スナップショットは複製であり、元配列の変更に影響されない
  v1.nodes[0].title = "mutated";
  const undoneAgain = useIssueTreeStore.getState().popUndo(v2);
  assert.equal(undoneAgain?.nodes[0].title, "v1");
});

test("undo/redo: 新しい変更で future はクリアされる", () => {
  useIssueTreeStore.getState().clearHistory();
  const snap = (t: string) => ({ nodes: [makeNode({ id: "n", title: t })], edges: [] });

  useIssueTreeStore.getState().pushHistory(snap("a"));
  useIssueTreeStore.getState().popUndo(snap("b")); // future: [b]
  useIssueTreeStore.getState().pushHistory(snap("a")); // 新規変更
  assert.equal(useIssueTreeStore.getState().future.length, 0);
});

/* ===== フィルタ ===== */

test("フィルタ: ステータス・優先度・クエリの AND 条件で一致判定", () => {
  const node = makeNode({
    id: "n",
    status: "testing",
    priority: "high",
    title: "フォームが長い",
  });
  assert.ok(matchesFilters(node, { statuses: ["testing"], priorities: [], query: "" }));
  assert.ok(!matchesFilters(node, { statuses: ["supported"], priorities: [], query: "" }));
  assert.ok(matchesFilters(node, { statuses: [], priorities: ["high"], query: "フォーム" }));
  assert.ok(!matchesFilters(node, { statuses: [], priorities: ["high"], query: "存在しない" }));
});

test("フィルタ: 不一致ノードは削除ではなく dimmed 集合に入る", () => {
  const nodes = [
    makeNode({ id: "hit", status: "testing" }),
    makeNode({ id: "miss", status: "rejected" }),
  ];
  const dimmed = dimmedNodeIds(nodes, { statuses: ["testing"], priorities: [], query: "" });
  assert.deepEqual([...dimmed], ["miss"]);
  assert.equal(dimmedNodeIds(nodes, EMPTY_FILTERS).size, 0); // フィルタ無効時は空
});

/* ===== React Flow アダプタ ===== */

test("adapter: ドメイン → Flow ノード変換 (自動レイアウト + dimmed/selected)", () => {
  const nodes = [
    makeNode({ id: "root" }),
    makeNode({ id: "c1", parentId: "root", order: 1 }),
    makeNode({ id: "c2", parentId: "root", order: 2 }),
    makeNode({ id: "fixed", position: { x: 999, y: 5 } }),
  ];
  const flow = toFlowNodes(nodes, "issue", {
    dimmedIds: new Set(["c2"]),
    selectedId: "c1",
  });
  assert.equal(flow.length, 4);
  const byId = new Map(flow.map((n) => [n.id, n]));
  // 明示 position はそのまま、未設定は dagre による自動レイアウト
  assert.deepEqual(byId.get("fixed")?.position, { x: 999, y: 5 });
  assert.ok((byId.get("c1")?.position.x ?? 0) > (byId.get("root")?.position.x ?? 0)); // depth 1 は root より右
  const rootY = byId.get("root")?.position.y ?? 0;
  const c1Y = byId.get("c1")?.position.y ?? 0;
  const c2Y = byId.get("c2")?.position.y ?? 0;
  // 親は必ず子の縦方向レンジの中央に来る (トップ/ツリー線ズレ防止の要件)
  assert.ok(rootY >= Math.min(c1Y, c2Y) - 1 && rootY <= Math.max(c1Y, c2Y) + 1);
  assert.equal(byId.get("c2")?.data.dimmed, true);
  assert.equal(byId.get("c1")?.data.selected, true);
  assert.equal(byId.get("c1")?.type, "issueNode");
});

test("adapter: 階層エッジ + リレーションエッジを生成し、UI 型をドメインへ漏らさない", () => {
  const nodes = [makeNode({ id: "a" }), makeNode({ id: "b", parentId: "a" })];
  const edges = [
    { id: "rel-1", projectId: "p", treeType: "issue" as const, sourceNodeId: "a", targetNodeId: "b", relationType: "supports" as const, label: "補強", createdAt: "", updatedAt: "" },
  ];
  const flow = toFlowEdges(nodes, edges, "issue", { dimmedIds: new Set(["b"]) });
  assert.equal(flow.length, 2);
  const hierarchy = flow.find((e) => e.id.startsWith("h-"));
  assert.equal(hierarchy?.source, "a");
  assert.equal(hierarchy?.style?.opacity, 0.25); // dimmed 側は淡色
  const rel = flow.find((e) => e.id === "rel-1");
  assert.equal(rel?.label, "補強");
});

test("adapter: fromDragStop は座標を丸めてドメイン更新ペイロードにする", () => {
  assert.deepEqual(fromDragStop({ id: "n", position: { x: 10.6, y: -3.2 } }), {
    id: "n",
    position: { x: 11, y: -3 },
  });
});

test("adapter: computeAutoLayout は葉に行を割り当て衝突しない", () => {
  const nodes = [
    makeNode({ id: "r" }),
    makeNode({ id: "l1", parentId: "r", order: 1 }),
    makeNode({ id: "l2", parentId: "r", order: 2 }),
  ];
  const layout = computeAutoLayout(nodes, "issue");
  assert.notEqual(layout.get("l1")?.y, layout.get("l2")?.y);
});
