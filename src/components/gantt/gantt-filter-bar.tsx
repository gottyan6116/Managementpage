"use client";

import {
  Calendar,
  ChevronDown,
  FolderKanban,
  LayoutPanelTop,
  RotateCcw,
  SlidersHorizontal,
  User,
  type LucideIcon,
} from "lucide-react";

function FilterPill({
  icon: Icon,
  label,
  value,
  chevron = true,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  chevron?: boolean;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs text-ink-soft hover:bg-surface-muted transition-colors"
    >
      <Icon className="size-3.5 text-ink-muted" />
      <span className="text-ink-muted">{label}</span>
      {value && <span className="font-medium text-ink">{value}</span>}
      {chevron && <ChevronDown className="size-3.5 text-ink-muted" />}
    </button>
  );
}

export function GanttFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface border border-line shadow-card px-4 py-3">
      <FilterPill icon={FolderKanban} label="プロジェクト" value="すべて" />
      <FilterPill icon={User} label="担当者" value="すべて" />
      <FilterPill icon={SlidersHorizontal} label="ステータス" value="すべて" />
      <FilterPill icon={Calendar} label="期間" value="2025/05/01 - 2025/05/31" />
      <FilterPill icon={LayoutPanelTop} label="ビュー" chevron={false} />
      <button
        type="button"
        className="inline-flex items-center gap-1 h-9 rounded-lg px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
      >
        <RotateCcw className="size-3.5" />
        リセット
      </button>
    </div>
  );
}
