"use client";

import {
  Calendar,
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  GANTT_DAY_WIDTH_DEFAULT,
  useUiStore,
} from "@/stores/ui-store";

function Select({ label, value }: { label: string; value: string }) {
  return (
    <label className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs text-ink-soft">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </label>
  );
}

export function GanttFilterBar({
  fullscreen,
  onToggleFullscreen,
}: {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const dayWidth = useUiStore((s) => s.ganttDayWidth);
  const setDayWidth = useUiStore((s) => s.setGanttDayWidth);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface border border-line shadow-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select label="プロジェクト" value="すべて" />
        <Select label="担当者" value="すべて" />
        <Select label="ステータス" value="すべて" />
        <label className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line bg-surface px-3 text-xs">
          <Calendar className="size-3.5 text-ink-muted" />
          <span className="font-medium text-ink">2025/05/01 – 2025/05/31</span>
        </label>
        <button
          type="button"
          className="inline-flex items-center gap-1 h-9 rounded-lg px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <RotateCcw className="size-3.5" />
          リセット
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("gantt:fit-today"))}
          className="inline-flex items-center gap-1 h-9 rounded-lg border border-line px-2.5 text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <Crosshair className="size-3.5" />
          今日にフィット
        </button>
        <div className="inline-flex items-center rounded-lg border border-line">
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
            className="px-1.5 text-[11px] tabular-nums text-ink-muted hover:text-ink"
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
          onClick={onToggleFullscreen}
          className="inline-flex items-center justify-center size-9 rounded-lg border border-line text-ink-soft hover:bg-surface-muted transition-colors"
        >
          {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}
