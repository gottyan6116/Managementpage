import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveProjectBar,
  visibleGanttRows,
} from "../src/lib/gantt-derived.ts";
import type { GanttRow, Project, Task } from "../src/types/domain.ts";

const project: Project = {
  id: "p1",
  name: "新規業務改革プロジェクト",
  client: "Demo",
  color: "#2563EB",
  phase: "要件定義",
  status: "in_progress",
  priority: "high",
  progress: 65,
  startDate: "2026-06-22",
  endDate: "2026-07-29",
  nextDue: "2026-07-03",
  sortOrder: 1,
  memberIds: ["m-yamada"],
};

const tasks: Task[] = [
  {
    id: "t1",
    projectId: "p1",
    parentTaskId: null,
    boardColumnId: "col-done",
    title: "現状分析",
    status: "done",
    priority: "high",
    progress: 100,
    startDate: "2026-06-24",
    dueDate: "2026-06-26",
    isMilestone: false,
    sortOrder: 1,
    boardPosition: 0,
    assigneeIds: ["m-yamada"],
  },
  {
    id: "t2",
    projectId: "p1",
    parentTaskId: null,
    boardColumnId: "col-todo",
    title: "ユーザートレーニング",
    status: "todo",
    priority: "medium",
    progress: 0,
    startDate: "2026-07-29",
    dueDate: "2026-08-06",
    isMilestone: false,
    sortOrder: 2,
    boardPosition: 1,
    assigneeIds: ["m-yamada"],
  },
];

test("deriveProjectBar extends the project bar to the latest child task due date", () => {
  assert.deepEqual(deriveProjectBar(project, tasks), {
    start: "2026-06-22",
    due: "2026-08-06",
  });
});

test("visibleGanttRows hides child tasks under collapsed project rows", () => {
  const rows: GanttRow[] = [
    {
      id: "p1",
      type: "project",
      depth: 0,
      label: "新規業務改革プロジェクト",
      assigneeIds: ["m-yamada"],
      progress: 65,
      status: "in_progress",
      color: "#2563EB",
      bar: { start: "2026-06-22", due: "2026-08-06" },
    },
    {
      id: "t1",
      type: "task",
      depth: 1,
      label: "現状分析",
      assigneeIds: ["m-yamada"],
      progress: 100,
      status: "done",
      color: "#2563EB",
      bar: { start: "2026-06-24", due: "2026-06-26" },
    },
  ];

  assert.deepEqual(visibleGanttRows(rows, new Set(["p1"])).map((row) => row.id), ["p1"]);
});
