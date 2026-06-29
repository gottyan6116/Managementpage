"use client";

import { useState } from "react";
import { GanttChart } from "./gantt-chart";
import { GanttFilterBar } from "./gantt-filter-bar";

export function GanttBoard() {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="space-y-4">
      <GanttFilterBar
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
      />
      <GanttChart variant="full" height={fullscreen ? 720 : 540} />
    </div>
  );
}
