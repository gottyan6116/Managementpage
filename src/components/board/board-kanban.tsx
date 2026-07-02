"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  Check,
  ChevronDown,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import {
  useBoardColumns,
  useCreateTask,
  useDeleteTask,
  useMembers,
  useMoveTask,
  useProjects,
  useTasks,
  useUpdateTaskDetails,
} from "@/lib/queries/hooks";
import { PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Member, Priority, Project, Task } from "@/types/domain";

const COLUMN_DOT: Record<string, string> = {
  "col-todo": "#94A3B8",
  "col-doing": "#2563EB",
  "col-done": "#16A34A",
};

type Grouped = Record<string, Task[]>;

export function BoardKanban({ projectId }: { projectId?: string }) {
  const { data: columns } = useBoardColumns();
  const { data: tasks } = useTasks({ tab: "all", projectId });
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");
  const move = useMoveTask();
  const createTask = useCreateTask({ tab: "all", projectId });
  const updateTask = useUpdateTaskDetails({ tab: "all", projectId });
  const deleteTask = useDeleteTask({ tab: "all", projectId });

  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);
  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  const buildGrouped = (): Grouped => {
    const next: Grouped = {};
    if (!columns || !tasks) return next;
    for (const c of columns) next[c.id] = [];
    for (const t of tasks) {
      const col = t.boardColumnId && next[t.boardColumnId] ? t.boardColumnId : "col-todo";
      (next[col] ??= []).push(t);
    }
    for (const c of columns) next[c.id].sort((a, b) => a.boardPosition - b.boardPosition);
    return next;
  };

  const [grouped, setGrouped] = useState<Grouped>(buildGrouped);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // クエリ結果が更新されたらローカル状態を再同期 (effect ではなくレンダー中に調整)
  const [syncedSrc, setSyncedSrc] = useState<{ c: typeof columns; t: typeof tasks }>({
    c: columns,
    t: tasks,
  });
  if (syncedSrc.c !== columns || syncedSrc.t !== tasks) {
    setSyncedSrc({ c: columns, t: tasks });
    setGrouped(buildGrouped());
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findContainer = (id: string): string | undefined => {
    if (grouped[id]) return id; // 列そのもの
    return Object.keys(grouped).find((col) => grouped[col].some((t) => t.id === id));
  };

  const activeTask = activeId
    ? Object.values(grouped).flat().find((t) => t.id === activeId)
    : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = findContainer(String(active.id));
    const overCol = findContainer(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setGrouped((prev) => {
      const activeItems = prev[activeCol];
      const overItems = prev[overCol];
      const moving = activeItems.find((t) => t.id === active.id);
      if (!moving) return prev;
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeCol]: activeItems.filter((t) => t.id !== active.id),
        [overCol]: [
          ...overItems.slice(0, insertAt),
          moving,
          ...overItems.slice(insertAt),
        ],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const overCol = findContainer(String(over.id));
    if (!overCol) return;
    const position = grouped[overCol].findIndex((t) => t.id === active.id);
    move.mutate({ id: String(active.id), columnId: overCol, position: Math.max(0, position) });
  }

  function createInColumn(input: {
    columnId: string;
    title: string;
    projectId: string | null;
    dueDate?: string | null;
  }) {
    createTask.mutate(
      {
        title: input.title,
        projectId: projectId ?? input.projectId,
        dueDate: input.dueDate,
        columnId: input.columnId,
      },
      {
        onSuccess: (task) => setExpandedId(task.id),
      },
    );
  }

  function updateDetails(id: string, patch: Parameters<typeof updateTask.mutate>[0]["patch"]) {
    updateTask.mutate({ id, patch });
  }

  function removeTask(id: string) {
    setGrouped((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([col, items]) => [
          col,
          items.filter((task) => task.id !== id),
        ]),
      ),
    );
    if (expandedId === id) setExpandedId(null);
    deleteTask.mutate(id);
  }

  if (!columns) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            name={col.name}
            dot={COLUMN_DOT[col.id] ?? "#94A3B8"}
            tasks={grouped[col.id] ?? []}
            memberMap={memberMap}
            projectMap={projectMap}
            members={members ?? []}
            projects={projects ?? []}
            lockedProjectId={projectId}
            adding={createTask.isPending}
            onCreate={createInColumn}
            expandedId={expandedId}
            onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
            onUpdate={updateDetails}
            onDelete={removeTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card
            task={activeTask}
            project={activeTask.projectId ? projectMap.get(activeTask.projectId) : undefined}
            assignee={activeTask.assigneeIds[0] ? memberMap.get(activeTask.assigneeIds[0]) : undefined}
            members={members ?? []}
            projects={projects ?? []}
            lockedProjectId={projectId}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  id,
  name,
  dot,
  tasks,
  memberMap,
  projectMap,
  members,
  projects,
  lockedProjectId,
  adding,
  onCreate,
  expandedId,
  onToggle,
  onUpdate,
  onDelete,
}: {
  id: string;
  name: string;
  dot: string;
  tasks: Task[];
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  members: Member[];
  projects: Project[];
  lockedProjectId?: string;
  adding?: boolean;
  onCreate: (input: {
    columnId: string;
    title: string;
    projectId: string | null;
    dueDate?: string | null;
  }) => void;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: {
    title?: string;
    priority?: Priority;
    progress?: number;
    startDate?: string | null;
    dueDate?: string | null;
    projectId?: string | null;
    assigneeId?: string | null;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [addingOpen, setAddingOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [draftProjectId, setDraftProjectId] = useState(lockedProjectId ?? "");
  const [dueDate, setDueDate] = useState("");

  function submit() {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onCreate({
      columnId: id,
      title: nextTitle,
      projectId: (lockedProjectId ?? draftProjectId) || null,
      dueDate: dueDate || null,
    });
    setTitle("");
    setDueDate("");
    setAddingOpen(false);
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span className="text-xs text-ink-muted">{tasks.length}</span>
        <button
          type="button"
          onClick={() => setAddingOpen((v) => !v)}
          aria-label={`${name}にタスクを追加`}
          className="ml-auto inline-flex items-center gap-1 h-7 rounded-md px-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <Plus className="size-4" />
          追加
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-40 rounded-xl bg-app p-2.5 space-y-2.5 transition-colors",
          isOver && "ring-2 ring-brand-300",
        )}
      >
        {addingOpen && (
          <div className="rounded-xl border border-brand-100 bg-surface p-3 shadow-sm">
            <label className="block text-[11px] font-semibold text-ink-soft">
              新規Todo
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") setAddingOpen(false);
                }}
                placeholder="タスク名を入力"
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink outline-none focus:border-brand-300"
                autoFocus
              />
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {!lockedProjectId && (
                <label className="block text-[11px] font-semibold text-ink-soft">
                  プロジェクト
                  <select
                    value={draftProjectId}
                    onChange={(e) => setDraftProjectId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                  >
                    <option value="">未設定</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-[11px] font-semibold text-ink-soft">
                期限
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingOpen(false)}
                className="inline-flex items-center justify-center size-8 rounded-lg text-ink-muted hover:bg-surface-muted"
                aria-label="追加を閉じる"
              >
                <X className="size-4" />
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!title.trim() || adding}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
              >
                <Check className="size-3.5" />
                作成
              </button>
            </div>
          </div>
        )}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              project={task.projectId ? projectMap.get(task.projectId) : undefined}
              assignee={task.assigneeIds[0] ? memberMap.get(task.assigneeIds[0]) : undefined}
              members={members}
              projects={projects}
              lockedProjectId={lockedProjectId}
              expanded={expandedId === task.id}
              onToggle={() => onToggle(task.id)}
              onUpdate={(patch) => onUpdate(task.id, patch)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-center text-xs text-ink-muted py-6">タスクなし</p>
        )}
      </div>
    </div>
  );
}

function SortableCard({
  task,
  project,
  assignee,
  members,
  projects,
  lockedProjectId,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  task: Task;
  project?: Project;
  assignee?: Member;
  members: Member[];
  projects: Project[];
  lockedProjectId?: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: {
    title?: string;
    priority?: Priority;
    progress?: number;
    startDate?: string | null;
    dueDate?: string | null;
    projectId?: string | null;
    assigneeId?: string | null;
  }) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <Card
        task={task}
        project={project}
        assignee={assignee}
        members={members}
        projects={projects}
        lockedProjectId={lockedProjectId}
        expanded={expanded}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`${task.title}をドラッグして移動`}
            className="mt-0.5 inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

function Card({
  task,
  project,
  assignee,
  members,
  projects,
  lockedProjectId,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  dragHandle,
  dragging,
}: {
  task: Task;
  project?: Project;
  assignee?: Member;
  members: Member[];
  projects: Project[];
  lockedProjectId?: string;
  expanded?: boolean;
  onToggle?: () => void;
  onUpdate?: (patch: {
    title?: string;
    priority?: Priority;
    progress?: number;
    startDate?: string | null;
    dueDate?: string | null;
    projectId?: string | null;
    assigneeId?: string | null;
  }) => void;
  onDelete?: () => void;
  dragHandle?: React.ReactNode;
  dragging?: boolean;
}) {
  const [draft, setDraft] = useState({
    title: task.title,
    priority: task.priority,
    progress: String(task.progress),
    startDate: task.startDate ?? "",
    dueDate: task.dueDate ?? "",
    projectId: task.projectId ?? "",
    assigneeId: task.assigneeIds[0] ?? "",
  });

  function resetDraftFromTask() {
    setDraft({
      title: task.title,
      priority: task.priority,
      progress: String(task.progress),
      startDate: task.startDate ?? "",
      dueDate: task.dueDate ?? "",
      projectId: task.projectId ?? "",
      assigneeId: task.assigneeIds[0] ?? "",
    });
  }

  function save() {
    onUpdate?.({
      title: draft.title,
      priority: draft.priority,
      progress: Number(draft.progress),
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
      projectId: (lockedProjectId ?? draft.projectId) || null,
      assigneeId: draft.assigneeId || null,
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-surface border border-line p-3 shadow-sm transition-shadow",
        expanded && "shadow-card ring-1 ring-brand-100",
        dragging && "shadow-pop rotate-2",
      )}
    >
      <div className="flex items-start gap-2">
        {dragHandle}
        <span
          className="mt-1.5 size-2 rounded-full shrink-0"
          style={{ backgroundColor: PRIORITY_STYLE[task.priority].fg }}
        />
        <button
          type="button"
          onClick={() => {
            if (!expanded) resetDraftFromTask();
            onToggle?.();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-sm font-medium text-ink leading-snug">
            {task.title}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
            詳細
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        {project && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            <span className="text-xs text-ink-muted truncate max-w-[140px]">{project.name}</span>
          </span>
        )}
        {assignee && <Avatar member={assignee} size="sm" />}
      </div>
      {expanded && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="grid grid-cols-1 gap-2">
            <label className="text-[11px] font-semibold text-ink-soft">
              タイトル
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand-300"
              />
            </label>
            {!lockedProjectId && (
              <label className="text-[11px] font-semibold text-ink-soft">
                プロジェクト
                <select
                  value={draft.projectId}
                  onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                >
                  <option value="">未設定</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold text-ink-soft">
                開始日
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                />
              </label>
              <label className="text-[11px] font-semibold text-ink-soft">
                期限
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-semibold text-ink-soft">
                優先度
                <select
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, priority: e.target.value as Priority }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-ink-soft">
                進捗
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.progress}
                  onChange={(e) => setDraft((d) => ({ ...d, progress: e.target.value }))}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
                />
              </label>
            </div>
            <label className="text-[11px] font-semibold text-ink-soft">
              担当者
              <select
                value={draft.assigneeId}
                onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-brand-300"
              >
                <option value="">未設定</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
              削除
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700"
            >
              <Save className="size-3.5" />
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
