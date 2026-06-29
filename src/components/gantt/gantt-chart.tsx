"use client";

import { useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/badges";
import {
  useDependencies,
  useGanttRows,
  useMembers,
} from "@/lib/queries/hooks";
import { APP_TODAY } from "@/lib/date";
import {
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  barGeometry,
  buildWeeks,
  computeRange,
  dateToX,
} from "@/lib/gantt";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { GanttRow } from "@/types/domain";

export function GanttChart({
  variant = "full",
  projectId,
  height,
}: {
  variant?: "full" | "preview";
  projectId?: string;
  height?: number;
}) {
  const { data: rows } = useGanttRows(projectId);
  const { data: deps } = useDependencies();
  const { data: members } = useMembers();
  const storeDayWidth = useUiStore((s) => s.ganttDayWidth);
  const dayWidth = variant === "preview" ? 22 : storeDayWidth;

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);

  const range = useMemo(() => {
    const dates = (rows ?? []).flatMap((r) => [r.bar?.start, r.bar?.due]);
    return computeRange(dates);
  }, [rows]);

  const weeks = useMemo(() => buildWeeks(range.start, range.end), [range]);
  const timelineWidth = range.totalDays * dayWidth;
  const showLeftCols = variant === "full";
  const leftWidth = variant === "full" ? 340 : 190;

  function syncScroll(from: "left" | "right") {
    if (syncing.current) return;
    syncing.current = true;
    const src = from === "left" ? leftRef.current : rightRef.current;
    const dst = from === "left" ? rightRef.current : leftRef.current;
    if (src && dst) dst.scrollTop = src.scrollTop;
    requestAnimationFrame(() => (syncing.current = false));
  }

  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    rows?.forEach((r, i) => m.set(r.id, i));
    return m;
  }, [rows]);

  const bodyHeight = (rows?.length ?? 0) * GANTT_ROW_HEIGHT;
  const todayX = dateToX(APP_TODAY, range.start, dayWidth) + dayWidth / 2;
  const paneHeight = height ?? (variant === "preview" ? 260 : 560);

  // 「今日にフィット」: 右ペインを今日が中央に来るようスクロール
  useEffect(() => {
    function fit() {
      const el = rightRef.current;
      if (el) el.scrollLeft = Math.max(0, todayX - el.clientWidth / 2);
    }
    window.addEventListener("gantt:fit-today", fit);
    return () => window.removeEventListener("gantt:fit-today", fit);
  }, [todayX]);

  // 初回マウント時に今日付近へスクロール
  useEffect(() => {
    const el = rightRef.current;
    if (el) el.scrollLeft = Math.max(0, todayX - el.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <div className="flex rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
      {/* ===== 左: ツリー ===== */}
      <div className="shrink-0 border-r border-line" style={{ width: leftWidth }}>
        {/* 左ヘッダ */}
        <div
          className="flex items-center gap-2 px-4 text-xs font-medium text-ink-muted border-b border-line bg-surface"
          style={{ height: GANTT_HEADER_HEIGHT }}
        >
          <span className="flex-1">タスク名</span>
          {showLeftCols && (
            <>
              <span className="w-14 text-center">担当</span>
              <span className="w-12 text-center">進捗</span>
              <span className="w-20 text-center">ステータス</span>
            </>
          )}
        </div>
        {/* 左ボディ (縦スクロール元) */}
        <div
          ref={leftRef}
          onScroll={() => syncScroll("left")}
          className="overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{ height: paneHeight }}
        >
          {rows?.map((row) => (
            <LeftRow
              key={row.id}
              row={row}
              showCols={showLeftCols}
              member={memberMap.get(row.assigneeIds[0] ?? "")}
            />
          ))}
        </div>
      </div>

      {/* ===== 右: タイムライン ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 右ヘッダ (週 + 曜日) */}
        <div
          className="overflow-hidden border-b border-line bg-surface"
          style={{ height: GANTT_HEADER_HEIGHT }}
        >
          <div className="flex" style={{ width: timelineWidth }}>
            {weeks.map((wk, i) => (
              <div key={i} className="border-r border-line" style={{ width: dayWidth * 7 }}>
                <div className="h-6 flex items-center justify-center text-[11px] font-medium text-ink-soft border-b border-line/60">
                  {wk.label}
                </div>
                <div className="flex">
                  {wk.days.map((day, j) => (
                    <div
                      key={j}
                      className={cn(
                        "flex items-center justify-center text-[10px]",
                        day.isWeekend ? "text-ink-muted bg-surface-muted/50" : "text-ink-soft",
                      )}
                      style={{ width: dayWidth, height: GANTT_HEADER_HEIGHT - 24 }}
                    >
                      {day.dow}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右ボディ (縦スクロール元 + 横スクロール) */}
        <div
          ref={rightRef}
          onScroll={() => syncScroll("right")}
          className="overflow-auto"
          style={{ height: paneHeight }}
        >
          <div className="relative" style={{ width: timelineWidth, height: Math.max(bodyHeight, paneHeight) }}>
            {/* 日グリッド背景 */}
            <div className="absolute inset-0 flex pointer-events-none">
              {weeks.flatMap((wk) => wk.days).map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "border-r border-line/50",
                    day.isWeekend && "bg-surface-muted/40",
                  )}
                  style={{ width: dayWidth }}
                />
              ))}
            </div>

            {/* 行の横罫 */}
            <div className="absolute inset-0 pointer-events-none">
              {rows?.map((_, i) => (
                <div
                  key={i}
                  className="border-b border-line/40"
                  style={{ height: GANTT_ROW_HEIGHT }}
                />
              ))}
            </div>

            {/* 今日ライン */}
            <div
              className="absolute top-0 bottom-0 w-px bg-brand-600/70 pointer-events-none z-20"
              style={{ left: todayX }}
            >
              <span className="absolute -top-0 -translate-x-1/2 -translate-y-0 whitespace-nowrap rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                今日 {format(APP_TODAY, "M/d", { locale: ja })}
              </span>
            </div>

            {/* 依存矢印 */}
            <svg className="absolute inset-0 pointer-events-none z-10" width={timelineWidth} height={Math.max(bodyHeight, paneHeight)}>
              {deps?.map((dep) => {
                const from = rows?.find((r) => r.id === dep.predecessorId);
                const to = rows?.find((r) => r.id === dep.successorId);
                const fi = rowIndex.get(dep.predecessorId);
                const ti = rowIndex.get(dep.successorId);
                if (!from?.bar || !to?.bar || fi == null || ti == null) return null;
                const fg = barGeometry(from.bar.start, from.bar.due, range.start, dayWidth);
                const tg = barGeometry(to.bar.start, to.bar.due, range.start, dayWidth);
                const x1 = fg.left + fg.width;
                const y1 = fi * GANTT_ROW_HEIGHT + GANTT_ROW_HEIGHT / 2;
                const x2 = tg.left;
                const y2 = ti * GANTT_ROW_HEIGHT + GANTT_ROW_HEIGHT / 2;
                const midX = Math.max(x1 + 8, x2 - 8);
                return (
                  <g key={dep.id} stroke="#94A3B8" strokeWidth={1.5} fill="none">
                    <path d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`} />
                    <path
                      d={`M ${x2} ${y2} l -5 -3 l 0 6 z`}
                      fill="#94A3B8"
                      stroke="none"
                    />
                  </g>
                );
              })}
            </svg>

            {/* バー / マイルストーン */}
            {rows?.map((row, i) => (
              <BarRow key={row.id} row={row} index={i} rangeStart={range.start} dayWidth={dayWidth} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftRow({
  row,
  showCols,
  member,
}: {
  row: GanttRow;
  showCols: boolean;
  member?: { id: string; name: string; color: string; avatarUrl: string | null };
}) {
  const isProject = row.type === "project";
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 border-b border-line/40",
        isProject ? "bg-surface-muted/40" : "bg-surface",
      )}
      style={{ height: GANTT_ROW_HEIGHT }}
    >
      <div
        className="flex items-center gap-1.5 flex-1 min-w-0"
        style={{ paddingLeft: row.depth * 16 }}
      >
        {isProject ? (
          <ChevronDown className="size-3.5 text-ink-muted shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
        <span
          className={cn(
            "truncate text-sm",
            isProject ? "font-semibold text-ink" : "text-ink-soft",
          )}
        >
          {row.label}
        </span>
      </div>
      {showCols && (
        <>
          <span className="w-14 flex justify-center">
            {member && <Avatar member={member} size="sm" />}
          </span>
          <span className="w-12 text-center text-xs font-semibold text-ink-soft tabular-nums">
            {row.progress}%
          </span>
          <span className="w-20 flex justify-center">
            <StatusBadge status={row.status} />
          </span>
        </>
      )}
    </div>
  );
}

function BarRow({
  row,
  index,
  rangeStart,
  dayWidth,
}: {
  row: GanttRow;
  index: number;
  rangeStart: Date;
  dayWidth: number;
}) {
  const top = index * GANTT_ROW_HEIGHT;

  if (row.milestone) {
    const x = dateToX(row.milestone.date, rangeStart, dayWidth) + dayWidth / 2;
    return (
      <div className="absolute" style={{ top: top + GANTT_ROW_HEIGHT / 2, left: x }}>
        <div className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
          <span
            className="block size-3 rotate-45 rounded-[2px]"
            style={{ backgroundColor: row.color }}
          />
          <span className="text-[10px] font-medium text-ink-soft whitespace-nowrap">
            {format(new Date(row.milestone.date), "M/d", { locale: ja })}
          </span>
        </div>
      </div>
    );
  }

  if (!row.bar) return null;
  const { left, width } = barGeometry(row.bar.start, row.bar.due, rangeStart, dayWidth);
  const isProject = row.type === "project";
  const barH = isProject ? 18 : 16;

  return (
    <div
      className="absolute flex items-center"
      style={{ top: top + (GANTT_ROW_HEIGHT - barH) / 2, left, width, height: barH }}
    >
      <div
        className="relative h-full w-full rounded-full overflow-hidden"
        style={{ backgroundColor: isProject ? row.color : `${row.color}40` }}
        title={`${row.label} (${row.progress}%)`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${row.progress}%`, backgroundColor: row.color }}
        />
      </div>
      <span className="ml-1.5 text-[10px] text-ink-muted whitespace-nowrap tabular-nums">
        {format(new Date(row.bar.due), "M/d", { locale: ja })}
      </span>
    </div>
  );
}
