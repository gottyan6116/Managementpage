/**
 * ドメイン型 (表示用に整形した型)
 * docs/03_data_model.md のスキーマを TS のドメイン型として表現する。
 * フェーズ2で Supabase 生成型 (database.ts) からマッピングして埋める。
 */

export type TaskStatus = "todo" | "in_progress" | "done" | "on_hold" | "canceled";
export type ProjectStatus =
  | "in_progress"
  | "final_check"
  | "done"
  | "on_hold"
  | "canceled";
export type Priority = "low" | "medium" | "high";

export interface Member {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  color: string;
  isSelf: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string | null;
  color: string;
  phase: string | null;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  nextDue: string | null;
  sortOrder: number;
  memberIds: string[];
}

export interface Task {
  id: string;
  projectId: string | null;
  parentTaskId: string | null;
  boardColumnId: string | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  isMilestone: boolean;
  sortOrder: number;
  boardPosition: number;
  assigneeIds: string[];
}

export interface Milestone {
  id: string;
  projectId: string | null;
  title: string;
  dueDate: string;
  isDone: boolean;
}

export interface TaskDependency {
  id: string;
  predecessorId: string;
  successorId: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
}

export interface ActionItem {
  id: string;
  projectId: string | null;
  title: string;
  dueDate: string | null;
  isDone: boolean;
}

export interface AppNotification {
  id: string;
  type: "due_soon" | "overdue" | "mention" | string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** ダッシュボード KPI 集計 (docs/03 §6) */
export interface DashboardKpi {
  activeProjects: number;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
}

export interface DocumentItem {
  id: string;
  projectId: string | null;
  title: string;
  body: string; // Markdown
  updatedAt: string;
}

export interface FileItem {
  id: string;
  projectId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface NoteSection {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  sectionId: string;
  title: string | null;
  body: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
}

/** ガント1行 (docs/04 §2 実装メモ) */
export interface GanttRow {
  id: string;
  type: "project" | "task";
  depth: number;
  label: string;
  assigneeIds: string[];
  progress: number;
  status: TaskStatus | ProjectStatus;
  color: string;
  bar: { start: string; due: string } | null;
  milestone?: { date: string; title: string };
}
