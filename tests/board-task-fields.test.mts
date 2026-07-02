import test from "node:test";
import assert from "node:assert/strict";
import {
  columnIdToTaskStatus,
  normalizeBoardTaskPatch,
} from "../src/lib/board-task-fields.ts";

test("columnIdToTaskStatus maps board columns to task statuses", () => {
  assert.equal(columnIdToTaskStatus("col-todo"), "todo");
  assert.equal(columnIdToTaskStatus("col-doing"), "in_progress");
  assert.equal(columnIdToTaskStatus("col-done"), "done");
  assert.equal(columnIdToTaskStatus("unknown"), "todo");
});

test("normalizeBoardTaskPatch trims title and clamps progress", () => {
  assert.deepEqual(
    normalizeBoardTaskPatch({
      title: "  要件定義レビュー  ",
      priority: "high",
      progress: 124,
      startDate: "",
      dueDate: "2026-07-15",
      projectId: "",
      assigneeId: "m-yamada",
    }),
    {
      title: "要件定義レビュー",
      priority: "high",
      progress: 100,
      startDate: null,
      dueDate: "2026-07-15",
      projectId: null,
      assigneeIds: ["m-yamada"],
    },
  );
});

test("normalizeBoardTaskPatch keeps an existing title when input is blank", () => {
  assert.deepEqual(
    normalizeBoardTaskPatch({
      title: "   ",
      currentTitle: "既存タスク",
      progress: -8,
      assigneeId: "",
    }),
    {
      title: "既存タスク",
      progress: 0,
      assigneeIds: [],
    },
  );
});

test("normalizeBoardTaskPatch keeps free-form details as nullable text", () => {
  assert.equal(
    normalizeBoardTaskPatch({ description: "  追加メモ  " }).description,
    "追加メモ",
  );
  assert.equal(normalizeBoardTaskPatch({ description: "   " }).description, null);
});
