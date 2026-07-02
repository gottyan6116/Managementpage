"use client";

import { useState } from "react";
import {
  Check,
  Crosshair,
  FolderPlus,
  ListPlus,
  Maximize2,
  Minimize2,
  Minus,
  MoveHorizontal,
  Plus,
  X,
} from "lucide-react";
import { GanttChart } from "./gantt-chart";
import { GanttFilterBar } from "./gantt-filter-bar";
import { useCreateProject, useCreateTask, useGanttRows, useMembers } from "@/lib/queries/hooks";
import { GANTT_DAY_WIDTH_DEFAULT, useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function GanttBoard() {
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const dayWidth = useUiStore((s) => s.ganttDayWidth);
  const setDayWidth = useUiStore((s) => s.setGanttDayWidth);

  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const { data: members } = useMembers();

  // タブ用にプロジェクト一覧 (ガントに表示される案件) を取得
  const { data: allRows } = useGanttRows();
  const projects = (allRows ?? []).filter((r) => r.type === "project");

  function submitNewProject() {
    const name = newProjectName.trim();
    if (!name) return;
    createProject.mutate(
      { name },
      {
        onSuccess: (project) => {
          setSelectedProject(project.id);
          setNewProjectName("");
          setAddingProject(false);
        },
      },
    );
  }

  function openTaskForm() {
    setNewTaskProjectId(selectedProject ?? projects[0]?.id ?? "");
    setNewTaskTitle("");
    setNewTaskDue("");
    setTaskFormOpen(true);
  }

  function submitNewTask() {
    const title = newTaskTitle.trim();
    if (!title || !newTaskProjectId) return;
    createTask.mutate(
      { projectId: newTaskProjectId, title, dueDate: newTaskDue || undefined },
      { onSuccess: () => setTaskFormOpen(false) },
    );
  }

  return (
    <div className="space-y-4">
      <GanttFilterBar
        members={members ?? []}
        assigneeId={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={() => {
          setAssigneeFilter("");
          setStatusFilter("");
        }}
      />

      {/* プロジェクトタブ + ツールバー */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
          <TabButton
            active={selectedProject === undefined}
            onClick={() => setSelectedProject(undefined)}
            label="すべて"
          />
          {projects.map((p) => (
            <TabButton
              key={p.id}
              active={selectedProject === p.id}
              onClick={() => setSelectedProject(p.id)}
              label={p.label}
              color={p.color}
            />
          ))}
          {addingProject ? (
            <div className="inline-flex items-center gap-1 shrink-0">
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewProject();
                  if (e.key === "Escape") {
                    setAddingProject(false);
                    setNewProjectName("");
                  }
                }}
                placeholder="新規プロジェクト名"
                className="h-8 w-40 rounded-full border border-brand-300 bg-surface px-3 text-xs text-ink outline-none"
              />
              <button
                type="button"
                onClick={submitNewProject}
                disabled={!newProjectName.trim() || createProject.isPending}
                aria-label="プロジェクトを作成"
                className="inline-flex items-center justify-center size-8 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingProject(false);
                  setNewProjectName("");
                }}
                aria-label="キャンセル"
                className="inline-flex items-center justify-center size-8 rounded-full text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingProject(true)}
              className="inline-flex items-center gap-1 h-8 shrink-0 rounded-full border border-dashed border-line px-3 text-xs font-medium text-ink-soft hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <FolderPlus className="size-3.5" />
              新規プロジェクト
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-ink-muted mr-1">
            <MoveHorizontal className="size-3.5" />
            バーをドラッグで期間編集
          </span>
          <button
            type="button"
            onClick={openTaskForm}
            className="inline-flex items-center gap-1 h-9 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <ListPlus className="size-3.5" />
            新規タスク
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("gantt:fit-today"))}
            className="inline-flex items-center gap-1 h-9 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <Crosshair className="size-3.5" />
            今日にフィット
          </button>
          <div className="inline-flex items-center rounded-lg border border-line bg-surface">
            <button
              type="button"
              aria-label="ズームアウト"
              onClick={() => setDayWidth(dayWidth - 4)}
              className="inline-flex items-center justify-center size-9 text-ink-soft hover:bg-surface-muted transition-colors rounded-l-lg"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDayWidth(GANTT_DAY_WIDTH_DEFAULT)}
              className="px-1.5 text-[11px] tabular-nums text-ink-muted hover:text-ink min-w-11 text-center"
              title="ズームをリセット"
            >
              {Math.round((dayWidth / GANTT_DAY_WIDTH_DEFAULT) * 100)}%
            </button>
            <button
              type="button"
              aria-label="ズームイン"
              onClick={() => setDayWidth(dayWidth + 4)}
              className="inline-flex items-center justify-center size-9 text-ink-soft hover:bg-surface-muted transition-colors rounded-r-lg"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            aria-label={fullscreen ? "全画面を解除" : "全画面表示"}
            onClick={() => setFullscreen((v) => !v)}
            className="inline-flex items-center justify-center size-9 rounded-lg border border-line bg-surface text-ink-soft hover:bg-surface-muted transition-colors"
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {taskFormOpen && (
        <div className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-brand-100 bg-surface shadow-card px-4 py-3.5">
          <label className="text-[11px] font-semibold text-ink-soft">
            プロジェクト
            <select
              value={newTaskProjectId}
              onChange={(e) => setNewTaskProjectId(e.target.value)}
              className="mt-1 h-9 w-48 rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
            >
              <option value="">選択してください</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[180px] text-[11px] font-semibold text-ink-soft">
            タスク名
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewTask();
                if (e.key === "Escape") setTaskFormOpen(false);
              }}
              placeholder="タスク名を入力"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-300"
            />
          </label>
          <label className="text-[11px] font-semibold text-ink-soft">
            期限
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className="mt-1 h-9 rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTaskFormOpen(false)}
              className="inline-flex items-center justify-center size-9 rounded-lg text-ink-muted hover:bg-surface-muted"
              aria-label="キャンセル"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={submitNewTask}
              disabled={!newTaskTitle.trim() || !newTaskProjectId || createTask.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <Check className="size-4" />
              作成
            </button>
          </div>
        </div>
      )}

      <GanttChart
        key={selectedProject ?? "all"}
        variant="full"
        projectId={selectedProject}
        assigneeId={assigneeFilter || undefined}
        status={statusFilter || undefined}
        editable
        height={fullscreen ? 760 : 560}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors border",
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-surface text-ink-soft border-line hover:bg-surface-muted",
      )}
    >
      {color && (
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: active ? "rgba(255,255,255,0.9)" : color }}
        />
      )}
      <span className="truncate max-w-[160px]">{label}</span>
    </button>
  );
}
