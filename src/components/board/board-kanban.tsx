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
import { Plus } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import {
  useBoardColumns,
  useMembers,
  useMoveTask,
  useProjects,
  useTasks,
} from "@/lib/queries/hooks";
import { PRIORITY_STYLE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Member, Project, Task } from "@/types/domain";

const COLUMN_DOT: Record<string, string> = {
  "col-todo": "#94A3B8",
  "col-doing": "#2563EB",
  "col-done": "#16A34A",
};

type Grouped = Record<string, Task[]>;

export function BoardKanban() {
  const { data: columns } = useBoardColumns();
  const { data: tasks } = useTasks({ tab: "all" });
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");
  const move = useMoveTask();

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
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card
            task={activeTask}
            project={activeTask.projectId ? projectMap.get(activeTask.projectId) : undefined}
            assignee={activeTask.assigneeIds[0] ? memberMap.get(activeTask.assigneeIds[0]) : undefined}
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
}: {
  id: string;
  name: string;
  dot: string;
  tasks: Task[];
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span className="text-xs text-ink-muted">{tasks.length}</span>
        <button
          type="button"
          aria-label={`${name}にタスクを追加`}
          className="ml-auto inline-flex items-center justify-center size-6 rounded-md text-ink-muted hover:bg-surface-muted transition-colors"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-40 rounded-2xl bg-app p-2.5 space-y-2.5 transition-colors",
          isOver && "ring-2 ring-brand-300",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              project={task.projectId ? projectMap.get(task.projectId) : undefined}
              assignee={task.assigneeIds[0] ? memberMap.get(task.assigneeIds[0]) : undefined}
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
}: {
  task: Task;
  project?: Project;
  assignee?: Member;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <Card task={task} project={project} assignee={assignee} />
    </div>
  );
}

function Card({
  task,
  project,
  assignee,
  dragging,
}: {
  task: Task;
  project?: Project;
  assignee?: Member;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface border border-line p-3 shadow-sm cursor-grab active:cursor-grabbing",
        dragging && "shadow-pop rotate-2",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 size-2 rounded-full shrink-0"
          style={{ backgroundColor: PRIORITY_STYLE[task.priority].fg }}
        />
        <p className="text-sm font-medium text-ink leading-snug">{task.title}</p>
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
    </div>
  );
}
