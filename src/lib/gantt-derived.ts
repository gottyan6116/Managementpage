import type { GanttRow, Project, Task } from "@/types/domain";

export function deriveProjectBar(
  project: Project,
  children: Task[],
): { start: string; due: string } | null {
  const starts = [
    project.startDate,
    ...children.map((task) => task.startDate),
  ].filter((date): date is string => Boolean(date));
  const dues = [
    project.endDate,
    ...children.map((task) => task.dueDate),
  ].filter((date): date is string => Boolean(date));

  if (starts.length === 0 || dues.length === 0) return null;
  return {
    start: starts.sort()[0],
    due: dues.sort()[dues.length - 1],
  };
}

export function visibleGanttRows(
  rows: GanttRow[],
  collapsedProjectIds: Set<string>,
): GanttRow[] {
  let hiddenProjectId: string | null = null;

  return rows.filter((row) => {
    if (row.type === "project") {
      hiddenProjectId = collapsedProjectIds.has(row.id) ? row.id : null;
      return true;
    }

    if (hiddenProjectId && row.depth > 0) return false;
    return true;
  });
}
