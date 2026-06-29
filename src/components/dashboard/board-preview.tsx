"use client";

import { useMemo } from "react";
import { SectionCard } from "@/components/shared/section-card";
import { Avatar } from "@/components/shared/avatar";
import { useMembers, useProjects, useTasks } from "@/lib/queries/hooks";
import { PRIORITY_STYLE } from "@/lib/labels";
import type { Task } from "@/types/domain";

const COLUMNS = [
  { key: "col-todo", label: "未着手", status: "todo" as const, dot: "#94A3B8" },
  { key: "col-doing", label: "進行中", status: "in_progress" as const, dot: "#2563EB" },
  { key: "col-done", label: "完了", status: "done" as const, dot: "#16A34A" },
];

export function BoardPreview({ perColumn = 2 }: { perColumn?: number }) {
  const { data: tasks } = useTasks({ tab: "all" });
  const { data: members } = useMembers();
  const { data: projects } = useProjects("all");

  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);
  const projectMap = useMemo(() => new Map(projects?.map((p) => [p.id, p])), [projects]);

  const byStatus = (s: Task["status"]) => tasks?.filter((t) => t.status === s) ?? [];

  return (
    <SectionCard title="ボード" actionHref="/board" actionLabel="ボードへ">
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((col) => {
          const list = byStatus(col.status);
          return (
            <div key={col.key} className="rounded-xl bg-app p-2.5">
              <div className="flex items-center gap-1.5 px-1 pb-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: col.dot }} />
                <span className="text-xs font-semibold text-ink">{col.label}</span>
                <span className="text-xs text-ink-muted">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.slice(0, perColumn).map((task) => {
                  const project = task.projectId ? projectMap.get(task.projectId) : undefined;
                  const assignee = task.assigneeIds[0]
                    ? memberMap.get(task.assigneeIds[0])
                    : undefined;
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg bg-surface border border-line p-2.5 shadow-sm"
                    >
                      <div className="flex items-start gap-1.5">
                        <span
                          className="mt-1 size-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_STYLE[task.priority].fg }}
                        />
                        <p className="text-xs font-medium text-ink leading-snug line-clamp-2">
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-ink-muted truncate max-w-[80px]">
                          {project?.name}
                        </span>
                        {assignee && <Avatar member={assignee} size="sm" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
