import type { Priority, TaskStatus } from "@/types/domain";

export interface BoardTaskPatchInput {
  title?: string;
  currentTitle?: string;
  priority?: Priority;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  description?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
}

export interface NormalizedBoardTaskPatch {
  title?: string;
  priority?: Priority;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  description?: string | null;
  projectId?: string | null;
  assigneeIds?: string[];
}

export function columnIdToTaskStatus(columnId: string): TaskStatus {
  if (columnId === "col-done") return "done";
  if (columnId === "col-doing") return "in_progress";
  return "todo";
}

export function normalizeBoardTaskPatch(
  input: BoardTaskPatchInput,
): NormalizedBoardTaskPatch {
  const patch: NormalizedBoardTaskPatch = {};

  if (input.title !== undefined) {
    patch.title =
      input.title.trim() || input.currentTitle?.trim() || "無題のTodo";
  }

  if (input.priority !== undefined) patch.priority = input.priority;

  if (input.progress !== undefined) {
    const progress = Number.isFinite(input.progress) ? input.progress : 0;
    patch.progress = Math.min(100, Math.max(0, Math.round(progress)));
  }

  if (input.startDate !== undefined) {
    patch.startDate = input.startDate?.trim() || null;
  }

  if (input.dueDate !== undefined) {
    patch.dueDate = input.dueDate?.trim() || null;
  }

  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }

  if (input.projectId !== undefined) {
    patch.projectId = input.projectId?.trim() || null;
  }

  if (input.assigneeId !== undefined) {
    const assigneeId = input.assigneeId?.trim();
    patch.assigneeIds = assigneeId ? [assigneeId] : [];
  }

  return patch;
}
