"use client";

import { RotateCcw, SlidersHorizontal, User } from "lucide-react";
import type { Member, TaskStatus } from "@/types/domain";
import { TASK_STATUS_LABEL } from "@/lib/labels";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "done", "on_hold", "canceled"];

export function GanttFilterBar({
  members,
  assigneeId,
  onAssigneeChange,
  status,
  onStatusChange,
  onReset,
}: {
  members: Member[];
  assigneeId: string;
  onAssigneeChange: (id: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}) {
  const hasFilter = assigneeId !== "" || status !== "";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface border border-line shadow-card px-4 py-3">
      <label className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs text-ink-soft">
        <User className="size-3.5 text-ink-muted" />
        <span className="text-ink-muted">担当者</span>
        <select
          value={assigneeId}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className="bg-transparent font-medium text-ink outline-none"
        >
          <option value="">すべて</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs text-ink-soft">
        <SlidersHorizontal className="size-3.5 text-ink-muted" />
        <span className="text-ink-muted">ステータス</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-transparent font-medium text-ink outline-none"
        >
          <option value="">すべて</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      {hasFilter && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 h-9 rounded-lg px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <RotateCcw className="size-3.5" />
          リセット
        </button>
      )}
    </div>
  );
}
