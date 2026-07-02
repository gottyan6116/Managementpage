"use client";

import { useState } from "react";
import { Crosshair, Maximize2, Minimize2, Minus, MoveHorizontal, Plus } from "lucide-react";
import { GanttChart } from "./gantt-chart";
import { GanttFilterBar } from "./gantt-filter-bar";
import { useGanttRows } from "@/lib/queries/hooks";
import { GANTT_DAY_WIDTH_DEFAULT, useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function GanttBoard() {
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const dayWidth = useUiStore((s) => s.ganttDayWidth);
  const setDayWidth = useUiStore((s) => s.setGanttDayWidth);

  // タブ用にプロジェクト一覧 (ガントに表示される案件) を取得
  const { data: allRows } = useGanttRows();
  const projects = (allRows ?? []).filter((r) => r.type === "project");

  return (
    <div className="space-y-4">
      <GanttFilterBar />

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
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-ink-muted mr-1">
            <MoveHorizontal className="size-3.5" />
            バーをドラッグで期間編集
          </span>
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

      <GanttChart
        key={selectedProject ?? "all"}
        variant="full"
        projectId={selectedProject}
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
