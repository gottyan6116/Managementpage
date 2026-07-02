"use client";

import { useState } from "react";
import { LayoutGrid, List, Milestone } from "lucide-react";
import { TaskTable } from "./task-table";
import { BoardPreview } from "./board-preview";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { self } from "@/lib/repositories";
import type { TaskTab } from "@/lib/repositories";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "list", label: "リスト", icon: List },
  { key: "board", label: "ボード", icon: LayoutGrid },
  { key: "timeline", label: "タイムライン", icon: Milestone },
] as const;
type WorkTabKey = (typeof TABS)[number]["key"];

export function WorkTabs({ initialTab }: { initialTab?: TaskTab }) {
  const [tab, setTab] = useState<WorkTabKey>("list");

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "list" && <TaskTable limit={8} initialTab={initialTab} />}
      {tab === "board" && <BoardPreview perColumn={3} />}
      {tab === "timeline" && (
        <GanttChart variant="preview" assigneeId={self().id} height={280} />
      )}
    </div>
  );
}
