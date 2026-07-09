"use client";

import { motion } from "framer-motion";
import { GitBranch, FlaskConical, Rocket } from "lucide-react";
import { formatDue } from "@/lib/date";
import type { IssueBoardSummary } from "@/lib/repositories";

/** 一覧のボードカード。layoutId で詳細ビューへモーフする。 */
export function IssueBoardCard({
  board,
  onOpen,
}: {
  board: IssueBoardSummary;
  onOpen: () => void;
}) {
  return (
    <motion.button
      layoutId={`issue-board-${board.id}`}
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="glass-card rounded-2xl p-5 text-left flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-ink-soft truncate">{board.clientName}</p>
          <h3 className="mt-0.5 text-base font-bold text-ink leading-snug">{board.name}</h3>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
          {board.category}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="text-ink-soft line-clamp-2 leading-relaxed">{board.objective}</p>
        <p className="text-xs text-ink-soft">
          <span className="font-semibold text-ink">主要KPI:</span> {board.kpi}
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-line/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3.5 text-ink-muted" />
            論点 <span className="font-bold text-ink tabular-nums">{board.nodeCount}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <FlaskConical className="size-3.5 text-[#2563EB]" />
            検証中 <span className="font-bold text-ink tabular-nums">{board.validatingCount}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Rocket className="size-3.5 text-[#7C3AED]" />
            施策化 <span className="font-bold text-ink tabular-nums">{board.actionizedCount}</span>
          </span>
        </div>
        <span className="text-[11px] text-ink-soft whitespace-nowrap">
          更新 {formatDue(board.updatedAt)}
        </span>
      </div>
    </motion.button>
  );
}
