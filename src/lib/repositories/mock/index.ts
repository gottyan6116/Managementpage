/**
 * モックリポジトリ。docs/05 §2 のリポジトリ層。
 * フェーズ2で同じ関数シグネチャの Supabase 実装へ差し替える (UI 改修ゼロ)。
 * デモ操作 (完了トグル等) はモジュール内配列をその場で更新し、セッション中は永続する。
 */
import { daysUntil } from "@/lib/date";
import {
  columnIdToTaskStatus,
  normalizeBoardTaskPatch,
  type BoardTaskPatchInput,
} from "@/lib/board-task-fields";
import type {
  ActionItem,
  AppNotification,
  BoardColumn,
  DashboardKpi,
  GanttRow,
  Member,
  Milestone,
  Project,
  ProjectStatus,
  Task,
} from "@/types/domain";
import type { DocumentItem, FileItem, Note, NoteSection } from "@/types/domain";
import {
  actions,
  boardColumns,
  dashboardKpi,
  dependencies,
  documents,
  files,
  kpiSeries,
  members,
  milestones,
  noteSections,
  notes,
  notifications,
  projects,
  tasks,
} from "./data";

const delay = () => new Promise((r) => setTimeout(r, 0));

/* ===== Members ===== */
export async function listMembers(): Promise<Member[]> {
  await delay();
  return members;
}
export function memberById(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}
export function self(): Member {
  return members.find((m) => m.isSelf) ?? members[0];
}

/* ===== Projects ===== */
export type ProjectTab = "all" | "in_progress" | "done" | "on_hold";
export async function listProjects(tab: ProjectTab = "all"): Promise<Project[]> {
  await delay();
  const list = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
  if (tab === "all") return list;
  if (tab === "in_progress")
    return list.filter((p) => p.status === "in_progress" || p.status === "final_check");
  if (tab === "done") return list.filter((p) => p.status === "done");
  return list.filter((p) => p.status === "on_hold");
}
export function projectById(id: string | null): Project | undefined {
  return id ? projects.find((p) => p.id === id) : undefined;
}

/* ===== Tasks ===== */
export type TaskTab = "all" | "mine" | "overdue" | "done";
export interface TaskListParams {
  tab?: TaskTab;
  projectId?: string;
}
export async function listTasks(params: TaskListParams = {}): Promise<Task[]> {
  await delay();
  let list = tasks.filter((t) => !t.isMilestone);
  if (params.projectId) list = list.filter((t) => t.projectId === params.projectId);
  const tab = params.tab ?? "all";
  if (tab === "mine") list = list.filter((t) => t.assigneeIds.includes(self().id));
  else if (tab === "overdue")
    list = list.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "done");
  else if (tab === "done") list = list.filter((t) => t.status === "done");
  return list;
}

export async function toggleTaskDone(id: string): Promise<void> {
  await delay();
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  if (t.status === "done") {
    t.status = "todo";
    t.progress = 0;
    t.boardColumnId = "col-todo";
  } else {
    t.status = "done";
    t.progress = 100;
    t.boardColumnId = "col-done";
  }
}

export async function createTask(init: {
  projectId: string | null;
  title: string;
  dueDate?: string | null;
  columnId?: string;
  priority?: Task["priority"];
  assigneeId?: string | null;
}): Promise<Task> {
  await delay();
  const columnId = init.columnId ?? "col-todo";
  const status = columnIdToTaskStatus(columnId);
  const task: Task = {
    id: `t-${Date.now()}`,
    projectId: init.projectId,
    parentTaskId: null,
    boardColumnId: columnId,
    title: init.title.trim() || "無題のTodo",
    status,
    priority: init.priority ?? "medium",
    progress: status === "done" ? 100 : 0,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: init.dueDate ?? null,
    isMilestone: false,
    sortOrder: tasks.length + 1,
    boardPosition: tasks.filter((t) => t.boardColumnId === columnId).length,
    assigneeIds: [init.assigneeId || self().id],
  };
  tasks.push(task);
  return task;
}

/** ガント: バーのドラッグで開始日/終了日を更新 */
export async function updateTaskSchedule(
  id: string,
  startDate: string,
  dueDate: string,
): Promise<void> {
  await delay();
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.startDate = startDate;
  t.dueDate = dueDate;
}

/** ボード: 列移動でステータス更新 */
export async function moveTask(
  id: string,
  columnId: string,
  position: number,
): Promise<void> {
  await delay();
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.boardColumnId = columnId;
  t.boardPosition = position;
  t.status = columnIdToTaskStatus(columnId);
  if (columnId === "col-done") t.progress = 100;
}

export type TaskDetailsPatch = BoardTaskPatchInput;

export async function updateTaskDetails(
  id: string,
  patch: TaskDetailsPatch,
): Promise<void> {
  await delay();
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  const next = normalizeBoardTaskPatch({ ...patch, currentTitle: t.title });
  if (next.title !== undefined) t.title = next.title;
  if (next.priority !== undefined) t.priority = next.priority;
  if (next.progress !== undefined) t.progress = next.progress;
  if (next.startDate !== undefined) t.startDate = next.startDate;
  if (next.dueDate !== undefined) t.dueDate = next.dueDate;
  if (next.projectId !== undefined) t.projectId = next.projectId;
  if (next.assigneeIds !== undefined) t.assigneeIds = next.assigneeIds;
}

/* ===== Board ===== */
export async function listBoardColumns(): Promise<BoardColumn[]> {
  await delay();
  return [...boardColumns].sort((a, b) => a.position - b.position);
}

/* ===== Milestones ===== */
export async function listMilestones(): Promise<Milestone[]> {
  await delay();
  return [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* ===== Dashboard KPI ===== */
export async function getDashboardKpi(): Promise<DashboardKpi> {
  await delay();
  return dashboardKpi;
}
export function getKpiSeries() {
  return kpiSeries;
}

/* ===== 今後の期限 (milestones + tasks.due_date 近い順) ===== */
export interface UpcomingItem {
  id: string;
  title: string;
  projectId: string | null;
  dueDate: string;
  color: string;
  kind: "task" | "milestone";
}
export async function listUpcoming(limit = 6): Promise<UpcomingItem[]> {
  await delay();
  const fromTasks: UpcomingItem[] = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      dueDate: t.dueDate as string,
      color: projectById(t.projectId)?.color ?? "#3B82F6",
      kind: t.isMilestone ? "milestone" : "task",
    }));
  const fromMs: UpcomingItem[] = milestones
    .filter((m) => !m.isDone)
    .map((m) => ({
      id: m.id,
      title: m.title,
      projectId: m.projectId,
      dueDate: m.dueDate,
      color: projectById(m.projectId)?.color ?? "#3B82F6",
      kind: "milestone",
    }));
  return [...fromMs, ...fromTasks]
    .filter((i) => daysUntil(i.dueDate) >= -3)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

/* ===== ガント行 (docs/04 §2) ===== */
export async function listGanttRows(projectId?: string): Promise<GanttRow[]> {
  await delay();
  const rows: GanttRow[] = [];
  const ps = (projectId ? projects.filter((p) => p.id === projectId) : projects)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  for (const p of ps) {
    const children = tasks
      .filter((t) => t.projectId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (children.length === 0) continue;
    rows.push({
      id: p.id,
      type: "project",
      depth: 0,
      label: p.name,
      assigneeIds: p.memberIds,
      progress: p.progress,
      status: p.status,
      color: p.color,
      bar:
        p.startDate && p.endDate ? { start: p.startDate, due: p.endDate } : null,
    });
    for (const t of children) {
      rows.push({
        id: t.id,
        type: "task",
        depth: 1,
        label: t.title,
        assigneeIds: t.assigneeIds,
        progress: t.progress,
        status: t.status,
        color: p.color,
        bar: t.startDate && t.dueDate ? { start: t.startDate, due: t.dueDate } : null,
        milestone: t.isMilestone && t.dueDate ? { date: t.dueDate, title: t.title } : undefined,
      });
    }
  }
  return rows;
}

export async function listDependencies() {
  await delay();
  return dependencies;
}

/* ===== Projects 右ペイン ===== */
export async function listAtRiskProjects(): Promise<Project[]> {
  await delay();
  return projects
    .filter(
      (p) =>
        p.status !== "done" &&
        p.status !== "canceled" &&
        p.nextDue &&
        daysUntil(p.nextDue) <= 2,
    )
    .sort((a, b) => (a.nextDue ?? "").localeCompare(b.nextDue ?? ""));
}

export interface StatusSlice {
  status: ProjectStatus;
  count: number;
}
export async function getProjectStatusDistribution(): Promise<StatusSlice[]> {
  await delay();
  const order: ProjectStatus[] = ["in_progress", "final_check", "done", "on_hold", "canceled"];
  return order.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));
}

/* ===== Actions ===== */
export async function listActions(): Promise<ActionItem[]> {
  await delay();
  return [...actions].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}
export async function toggleAction(id: string): Promise<void> {
  await delay();
  const a = actions.find((x) => x.id === id);
  if (a) a.isDone = !a.isDone;
}

/* ===== Notifications ===== */
export async function listNotifications(): Promise<AppNotification[]> {
  await delay();
  return notifications;
}

/* ===== グローバル検索 ===== */
export interface SearchHit {
  id: string;
  type: "project" | "task" | "document" | "file";
  title: string;
  subtitle: string;
  href: string;
}
export async function searchAll(query: string): Promise<SearchHit[]> {
  await delay();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const p of projects) {
    if (`${p.name}${p.client ?? ""}`.toLowerCase().includes(q)) {
      hits.push({ id: p.id, type: "project", title: p.name, subtitle: p.client ?? "案件", href: `/projects/${p.id}` });
    }
  }
  for (const t of tasks) {
    if (t.title.toLowerCase().includes(q)) {
      const p = projectById(t.projectId);
      hits.push({ id: t.id, type: "task", title: t.title, subtitle: p?.name ?? "タスク", href: "/todo" });
    }
  }
  for (const d of documents) {
    if (`${d.title}${d.body}`.toLowerCase().includes(q)) {
      hits.push({ id: d.id, type: "document", title: d.title, subtitle: projectById(d.projectId)?.name ?? "ドキュメント", href: `/documents/${d.id}` });
    }
  }
  for (const f of files) {
    if (f.name.toLowerCase().includes(q)) {
      hits.push({ id: f.id, type: "file", title: f.name, subtitle: projectById(f.projectId)?.name ?? "ファイル", href: "/files" });
    }
  }
  return hits;
}

/* ===== Documents ===== */
export async function listDocuments(): Promise<DocumentItem[]> {
  await delay();
  return [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDocument(id: string): Promise<DocumentItem | null> {
  await delay();
  return documents.find((d) => d.id === id) ?? null;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; body?: string; projectId?: string | null },
): Promise<void> {
  await delay();
  const d = documents.find((x) => x.id === id);
  if (!d) return;
  if (patch.title !== undefined) d.title = patch.title;
  if (patch.body !== undefined) d.body = patch.body;
  if (patch.projectId !== undefined) d.projectId = patch.projectId;
  d.updatedAt = new Date().toISOString().slice(0, 10);
}

export async function createDocument(
  init?: { title?: string; body?: string; projectId?: string | null },
): Promise<DocumentItem> {
  await delay();
  const doc: DocumentItem = {
    id: `doc-${Date.now()}`,
    projectId: init?.projectId ?? null,
    title: init?.title ?? "無題のドキュメント",
    body: init?.body ?? "",
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  documents.unshift(doc);
  return doc;
}

/* ===== Files ===== */
export async function listFiles(): Promise<FileItem[]> {
  await delay();
  return [...files].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ===== Notes ===== */
export async function listNotes(): Promise<Note[]> {
  await delay();
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function toggleNotePin(id: string): Promise<void> {
  await delay();
  const n = notes.find((x) => x.id === id);
  if (n) n.isPinned = !n.isPinned;
}

export async function listNoteSections(): Promise<NoteSection[]> {
  await delay();
  return noteSections;
}

export async function updateNote(
  id: string,
  patch: { title?: string | null; body?: string },
): Promise<void> {
  await delay();
  const n = notes.find((x) => x.id === id);
  if (!n) return;
  if (patch.title !== undefined) n.title = patch.title;
  if (patch.body !== undefined) n.body = patch.body;
  n.updatedAt = new Date().toISOString().slice(0, 10);
}

export async function createNote(sectionId: string): Promise<Note> {
  await delay();
  const note: Note = {
    id: `note-${Date.now()}`,
    sectionId,
    title: "無題のページ",
    body: "",
    color: "#FFFFFF",
    isPinned: false,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  notes.unshift(note);
  return note;
}

/* ===== ガント: タイトル編集・削除 ===== */
export async function updateTaskTitle(id: string, title: string): Promise<void> {
  await delay();
  const t = tasks.find((x) => x.id === id);
  if (t) t.title = title;
}

export async function updateProjectName(id: string, name: string): Promise<void> {
  await delay();
  const p = projects.find((x) => x.id === id);
  if (p) p.name = name;
}

export async function deleteTask(id: string): Promise<void> {
  await delay();
  const i = tasks.findIndex((t) => t.id === id);
  if (i >= 0) tasks.splice(i, 1);
  for (let k = dependencies.length - 1; k >= 0; k--) {
    if (dependencies[k].predecessorId === id || dependencies[k].successorId === id) {
      dependencies.splice(k, 1);
    }
  }
}

export async function deleteProject(id: string): Promise<void> {
  await delay();
  const childIds = tasks.filter((t) => t.projectId === id).map((t) => t.id);
  for (let k = tasks.length - 1; k >= 0; k--) {
    if (tasks[k].projectId === id) tasks.splice(k, 1);
  }
  for (let k = dependencies.length - 1; k >= 0; k--) {
    if (
      childIds.includes(dependencies[k].predecessorId) ||
      childIds.includes(dependencies[k].successorId)
    ) {
      dependencies.splice(k, 1);
    }
  }
  const pi = projects.findIndex((p) => p.id === id);
  if (pi >= 0) projects.splice(pi, 1);
}
