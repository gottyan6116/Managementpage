"use client";

import { useState } from "react";
import { Crosshair, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { GanttChart } from "./gantt-chart";
import { GanttFilterBar } from "./gantt-filter-bar";
import { GANTT_DAY_WIDTH_DEFAULT, useUiStore } from "@/stores/ui-store";

export function GanttBoard() {
  const [fullscreen, setFullscreen] = useState(false);
  const dayWidth = useUiStore((s) => s.ganttDayWidth);
  const setDayWidth = useUiStore((s) => s.setGanttDayWidth);

  return (
    <div className="space-y-4">
      <GanttFilterBar />

      <div>
        {/* チャート右上のツールバー */}
        <div className="flex items-center justify-end gap-1.5 mb-2.5">
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

        <GanttChart variant="full" height={fullscreen ? 720 : 540} />
      </div>
    </div>
  );
}
