"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown, Trash2 } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { AssigneeCombobox } from "@/components/shared/assignee-combobox";
import { StatusBadge } from "@/components/shared/badges";
import {
  useDeleteGanttRow,
  useDependencies,
  useGanttRows,
  useMembers,
  useRenameGanttRow,
  useUpdateGanttAssignee,
  useUpdateTaskSchedule,
} from "@/lib/queries/hooks";
import { appToday } from "@/lib/date";
import { visibleGanttRows } from "@/lib/gantt-derived";
import {
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  addDaysISO,
  barGeometry,
  buildWeeks,
  computePreviewRange,
  computeRange,
  dateToX,
} from "@/lib/gantt";
import { useUiStore } from "@/stores/ui-store";
import { useToastStore } from "@/stores/toast-store";
import { scheduleUndoableDelete } from "@/lib/undo-delete";
import { cn } from "@/lib/utils";
import type { GanttRow, Member } from "@/types/domain";

type DragMode = "move" | "start" | "end";
interface DragState {
  id: string;
  mode: DragMode;
  origStart: string;
  origDue: string;
  deltaDays: number;
}

function applyDrag(d: DragState): { start: string; due: string } {
  if (d.mode === "move") {
    return {
      start: addDaysISO(d.origStart, d.deltaDays),
      due: addDaysISO(d.origDue, d.deltaDays),
    };
  }
  if (d.mode === "start") {
    let start = addDaysISO(d.origStart, d.deltaDays);
    if (start > d.origDue) start = d.origDue;
    return { start, due: d.origDue };
  }
  let due = addDaysISO(d.origDue, d.deltaDays);
  if (due < d.origStart) due = d.origStart;
  return { start: d.origStart, due };
}

export function GanttChart({
  variant = "full",
  projectId,
  assigneeId,
  status,
  height,
  editable = false,
}: {
  variant?: "full" | "preview";
  projectId?: string;
  assigneeId?: string;
  status?: string;
  height?: number;
  editable?: boolean;
}) {
  const { data: rows } = useGanttRows(projectId);
  const { data: deps } = useDependencies();
  const { data: members } = useMembers();
  const editSchedule = useUpdateTaskSchedule();
  const renameRow = useRenameGanttRow();
  const deleteRow = useDeleteGanttRow();
  const updateAssignee = useUpdateGanttAssignee();
  const storeDayWidth = useUiStore((s) => s.ganttDayWidth);
  const dayWidth = variant === "preview" ? 22 : storeDayWidth;
  const pendingDeleteIds = useToastStore((s) => s.pendingDeleteIds);
  const liveRows = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => !pendingDeleteIds.has(r.id))
        .filter((r) => {
          if (r.type === "project") return true;
          if (assigneeId && !r.assigneeIds.includes(assigneeId)) return false;
          if (status && r.status !== status) return false;
          return true;
        }),
    [rows, pendingDeleteIds, assigneeId, status],
  );

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const dragStartX = useRef(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [manualCollapsedProjects, setManualCollapsedProjects] =
    useState<Set<string> | null>(null);

  const memberMap = useMemo(() => new Map(members?.map((m) => [m.id, m])), [members]);

  const range = useMemo(() => {
    if (variant === "preview") return computePreviewRange(appToday());
    const dates = liveRows.flatMap((r) => [r.bar?.start, r.bar?.due]);
    return computeRange(dates);
  }, [liveRows, variant]);

  // プレビューは表示範囲に重なる行だけに絞る (行のないプロジェクトは落とす)
  const scopedRows = useMemo(() => {
    if (variant !== "preview") return liveRows;
    const s = format(range.start, "yyyy-MM-dd");
    const e = format(range.end, "yyyy-MM-dd");
    const overlaps = (row: GanttRow) => {
      if (row.milestone) return row.milestone.date >= s && row.milestone.date <= e;
      if (row.bar) return row.bar.start <= e && row.bar.due >= s;
      return false;
    };
    const result: GanttRow[] = [];
    let pendingProject: GanttRow | null = null;
    let pendingChildren: GanttRow[] = [];
    const flush = () => {
      if (pendingProject && (pendingChildren.length > 0 || overlaps(pendingProject))) {
        result.push(pendingProject, ...pendingChildren);
      }
      pendingProject = null;
      pendingChildren = [];
    };
    for (const row of liveRows) {
      if (row.type === "project") {
        flush();
        pendingProject = row;
      } else if (overlaps(row)) {
        pendingChildren.push(row);
      }
    }
    flush();
    return result;
  }, [liveRows, variant, range]);

  const defaultCollapsedProjects = useMemo(() => {
    if (projectId || variant !== "full") return new Set<string>();
    return new Set(scopedRows.filter((row) => row.type === "project").map((row) => row.id));
  }, [projectId, scopedRows, variant]);
  const collapsedProjects = manualCollapsedProjects ?? defaultCollapsedProjects;
  const visibleRows = useMemo(
    () => visibleGanttRows(scopedRows, collapsedProjects),
    [scopedRows, collapsedProjects],
  );

  function childTaskIds(projectRowId: string): string[] {
    const idx = liveRows.findIndex((r) => r.id === projectRowId);
    if (idx === -1) return [];
    const ids: string[] = [];
    for (let i = idx + 1; i < liveRows.length; i++) {
      if (liveRows[i].type === "project") break;
      ids.push(liveRows[i].id);
    }
    return ids;
  }

  function handleDeleteRow(row: GanttRow) {
    const ids = row.type === "project" ? [row.id, ...childTaskIds(row.id)] : [row.id];
    scheduleUndoableDelete({
      ids,
      message:
        row.type === "project"
          ? `「${row.label}」と配下のタスクを削除しました`
          : `「${row.label}」を削除しました`,
      onCommit: () => deleteRow.mutate({ id: row.id, type: row.type }),
    });
  }

  const weeks = useMemo(() => buildWeeks(range.start, range.end), [range]);
  const timelineWidth = range.totalDays * dayWidth;
  const showLeftCols = variant === "full";
  const leftWidth = variant === "full" ? 440 : 190;

  function syncScroll(from: "left" | "right") {
    // 週ヘッダーはボディの横スクロールに常に追従させる (日付とバーの対応を保証)
    if (from === "right" && headerRef.current && rightRef.current) {
      headerRef.current.scrollLeft = rightRef.current.scrollLeft;
    }
    if (syncing.current) return;
    syncing.current = true;
    const src = from === "left" ? leftRef.current : rightRef.current;
    const dst = from === "left" ? rightRef.current : leftRef.current;
    if (src && dst) dst.scrollTop = src.scrollTop;
    requestAnimationFrame(() => (syncing.current = false));
  }

  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    visibleRows.forEach((r, i) => m.set(r.id, i));
    return m;
  }, [visibleRows]);

  const bodyHeight = visibleRows.length * GANTT_ROW_HEIGHT;
  const today = appToday();
  const todayX = dateToX(today, range.start, dayWidth) + dayWidth / 2;
  const paneHeight = height ?? (variant === "preview" ? 260 : 560);

  function scrollToToday() {
    const el = rightRef.current;
    if (!el) return;
    const left = Math.max(0, todayX - el.clientWidth / 2);
    el.scrollLeft = left;
    if (headerRef.current) headerRef.current.scrollLeft = el.scrollLeft;
  }

  // 「今日にフィット」: 右ペインを今日が中央に来るようスクロール
  useEffect(() => {
    function fit() {
      scrollToToday();
    }
    window.addEventListener("gantt:fit-today", fit);
    return () => window.removeEventListener("gantt:fit-today", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayX]);

  // 初回マウント/データ変化時に今日付近へスクロール (ヘッダーも同位置へ)
  useEffect(() => {
    scrollToToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, todayX]);

  // バードラッグ (移動 / リサイズ) のグローバルリスナ
  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const delta = Math.round((e.clientX - dragStartX.current) / dayWidth);
      setDrag((prev) => (prev && prev.deltaDays !== delta ? { ...prev, deltaDays: delta } : prev));
    }
    function onUp() {
      setDrag((prev) => {
        if (prev) {
          const { start, due } = applyDrag(prev);
          if (start !== prev.origStart || due !== prev.origDue) {
            editSchedule.mutate({ id: prev.id, startDate: start, dueDate: due });
          }
        }
        return null;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id, dayWidth]);

  function beginDrag(e: React.PointerEvent, row: GanttRow, mode: DragMode) {
    if (!editable || row.type !== "task" || !row.bar) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartX.current = e.clientX;
    setDrag({ id: row.id, mode, origStart: row.bar.start, origDue: row.bar.due, deltaDays: 0 });
  }

  function effBar(row: GanttRow): { start: string; due: string } | null {
    if (!row.bar) return null;
    if (drag && drag.id === row.id) return applyDrag(drag);
    return row.bar;
  }

  return (
    <div className="data-card flex rounded-2xl overflow-hidden">
      {/* ===== 左: ツリー ===== */}
      <div className="shrink-0 border-r border-line" style={{ width: leftWidth }}>
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
        <div
          ref={leftRef}
          onScroll={() => syncScroll("left")}
          className="overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{ height: paneHeight }}
        >
          {visibleRows.map((row) => (
            <LeftRow
              key={row.id}
              row={row}
              showCols={showLeftCols}
              editable={editable}
              members={members ?? []}
              member={memberMap.get(row.assigneeIds[0] ?? "")}
              collapsed={collapsedProjects.has(row.id)}
              onToggleCollapse={() => {
                if (row.type !== "project") return;
                setManualCollapsedProjects((current) => {
                  const next = new Set(current ?? collapsedProjects);
                  if (next.has(row.id)) next.delete(row.id);
                  else next.add(row.id);
                  return next;
                });
              }}
              onRename={(title) => renameRow.mutate({ id: row.id, type: row.type, title })}
              onDelete={() => handleDeleteRow(row)}
              onAssigneeChange={(memberId) =>
                updateAssignee.mutate({ id: row.id, type: row.type, memberId })
              }
            />
          ))}
        </div>
      </div>

      {/* ===== 右: タイムライン ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div
          ref={headerRef}
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
                        "flex items-center justify-center text-[11px]",
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

        <div
          ref={rightRef}
          onScroll={() => syncScroll("right")}
          className="overflow-auto"
          style={{ height: paneHeight }}
        >
          <div
            className="relative"
            style={{ width: timelineWidth, height: Math.max(bodyHeight, paneHeight) }}
          >
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
              {visibleRows.map((_, i) => (
                <div key={i} className="border-b border-line/40" style={{ height: GANTT_ROW_HEIGHT }} />
              ))}
            </div>

            {/* 今日ライン */}
            <div
              className="gantt-today-line absolute top-0 bottom-0 w-px pointer-events-none z-20"
              style={{ left: todayX }}
            >
              <span className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                今日 {format(today, "M/d", { locale: ja })}
              </span>
            </div>

            {/* 依存矢印 */}
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              width={timelineWidth}
              height={Math.max(bodyHeight, paneHeight)}
            >
              {deps?.map((dep) => {
                const from = visibleRows.find((r) => r.id === dep.predecessorId);
                const to = visibleRows.find((r) => r.id === dep.successorId);
                const fi = rowIndex.get(dep.predecessorId);
                const ti = rowIndex.get(dep.successorId);
                const fb = from ? effBar(from) : null;
                const tb = to ? effBar(to) : null;
                if (!fb || !tb || fi == null || ti == null) return null;
                const fg = barGeometry(fb.start, fb.due, range.start, dayWidth);
                const tg = barGeometry(tb.start, tb.due, range.start, dayWidth);
                const x1 = fg.left + fg.width;
                const y1 = fi * GANTT_ROW_HEIGHT + GANTT_ROW_HEIGHT / 2;
                const x2 = tg.left;
                const y2 = ti * GANTT_ROW_HEIGHT + GANTT_ROW_HEIGHT / 2;
                const midX = Math.max(x1 + 8, x2 - 8);
                return (
                  <g key={dep.id} stroke="#94A3B8" strokeWidth={1.5} fill="none">
                    <path d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`} />
                    <path d={`M ${x2} ${y2} l -5 -3 l 0 6 z`} fill="#94A3B8" stroke="none" />
                  </g>
                );
              })}
            </svg>

            {/* バー / マイルストーン */}
            {visibleRows.map((row, i) => {
              const eff = effBar(row);
              return (
                <BarRow
                  key={row.id}
                  row={row}
                  index={i}
                  rangeStart={range.start}
                  dayWidth={dayWidth}
                  effStart={eff?.start}
                  effDue={eff?.due}
                  editable={editable}
                  editing={drag?.id === row.id}
                  onBeginDrag={(e, mode) => beginDrag(e, row, mode)}
                  onKeyMove={(delta) => {
                    if (row.type !== "task" || !row.bar) return;
                    editSchedule.mutate({
                      id: row.id,
                      startDate: addDaysISO(row.bar.start, delta),
                      dueDate: addDaysISO(row.bar.due, delta),
                    });
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftRow({
  row,
  showCols,
  editable,
  members,
  member,
  collapsed,
  onToggleCollapse,
  onRename,
  onDelete,
  onAssigneeChange,
}: {
  row: GanttRow;
  showCols: boolean;
  editable: boolean;
  members: Member[];
  member?: { id: string; name: string; color: string; avatarUrl: string | null };
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAssigneeChange: (memberId: string | null) => void;
}) {
  const isProject = row.type === "project";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.label);
  const [editingAssignee, setEditingAssignee] = useState(false);

  function commit() {
    const v = value.trim();
    if (v && v !== row.label) onRename(v);
    else setValue(row.label);
    setEditing(false);
  }

  function handleRowClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isProject) return;
    if (event.target instanceof HTMLElement) {
      if (event.target.closest("button,input")) return;
    }
    onToggleCollapse();
  }

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group relative flex items-center gap-2 px-4 border-b border-line/40",
        isProject ? "bg-surface-muted/40" : "bg-surface",
        isProject && "cursor-pointer",
      )}
      style={{ height: GANTT_ROW_HEIGHT }}
    >
      <div
        className="flex items-center gap-1.5 flex-1 min-w-0"
        style={{ paddingLeft: row.depth * 16 }}
      >
        {isProject ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? `${row.label}を展開` : `${row.label}を折りたたむ`}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-brand-600"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", collapsed && "-rotate-90")}
            />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setValue(row.label);
                setEditing(false);
              }
            }}
            className={cn(
              "min-w-0 flex-1 rounded-md border border-brand-400 bg-white px-1.5 py-0.5 text-sm outline-none",
              isProject ? "font-semibold text-ink" : "text-ink",
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!editable) return;
              setValue(row.label);
              setEditing(true);
            }}
            title={editable ? `${row.label}（クリックで編集）` : row.label}
            className={cn(
              "truncate text-sm text-left min-w-0",
              isProject ? "font-semibold text-ink" : "text-ink-soft",
              editable && "hover:text-brand-600 cursor-text",
            )}
          >
            {row.label}
          </button>
        )}
      </div>
      {showCols && !editing && (
        <>
          <span className="w-14 flex justify-center relative">
            {editable && editingAssignee ? (
              <div className="absolute z-20 -left-5 top-1/2 -translate-y-1/2 w-24">
                <AssigneeCombobox
                  members={members}
                  value={member?.id ?? null}
                  onChange={onAssigneeChange}
                  onClose={() => setEditingAssignee(false)}
                  placeholder="担当者"
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => editable && setEditingAssignee(true)}
                title={editable ? "クリックで担当者を編集" : member?.name}
                className={cn(
                  "inline-flex items-center justify-center size-6 rounded-full",
                  editable && "hover:ring-2 hover:ring-brand-200",
                )}
              >
                {member ? (
                  <Avatar member={member} size="sm" />
                ) : editable ? (
                  <span className="text-[11px] text-ink-soft">未設定</span>
                ) : null}
              </button>
            )}
          </span>
          <span className="w-12 text-center text-xs font-semibold text-ink-soft tabular-nums">
            {row.progress}%
          </span>
          <span className="w-20 flex justify-center">
            <StatusBadge status={row.status} />
          </span>
        </>
      )}
      {editable && !editing && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${row.label}を削除`}
          title="削除"
          className="absolute right-2 inline-flex items-center justify-center size-7 rounded-lg bg-surface text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function BarRow({
  row,
  index,
  rangeStart,
  dayWidth,
  effStart,
  effDue,
  editable,
  editing,
  onBeginDrag,
  onKeyMove,
}: {
  row: GanttRow;
  index: number;
  rangeStart: Date;
  dayWidth: number;
  effStart?: string;
  effDue?: string;
  editable: boolean;
  editing: boolean;
  onBeginDrag: (e: React.PointerEvent, mode: DragMode) => void;
  onKeyMove: (deltaDays: number) => void;
}) {
  const top = index * GANTT_ROW_HEIGHT;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onKeyMove(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onKeyMove(1);
    }
  }

  if (row.milestone) {
    const date = effDue ?? row.milestone.date;
    const x = dateToX(date, rangeStart, dayWidth) + dayWidth / 2;
    return (
      <div className="absolute z-10" style={{ top: top + GANTT_ROW_HEIGHT / 2, left: x }}>
        <div
          onPointerDown={editable ? (e) => onBeginDrag(e, "move") : undefined}
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 flex items-center gap-1 touch-none",
            editable && "cursor-grab",
          )}
        >
          <span
            className={cn("block size-3 rotate-45 rounded-[2px]", editing && "ring-2 ring-brand-400")}
            style={{ backgroundColor: row.color }}
          />
          <span className="text-[11px] font-medium text-ink-soft whitespace-nowrap">
            {format(new Date(date), "M/d", { locale: ja })}
          </span>
        </div>
      </div>
    );
  }

  if (!effStart || !effDue) return null;
  const { left, width } = barGeometry(effStart, effDue, rangeStart, dayWidth);
  const isProject = row.type === "project";
  const barH = isProject ? 18 : 16;
  const canEdit = editable && row.type === "task";

  return (
    <div
      className="absolute flex items-center"
      style={{ top: top + (GANTT_ROW_HEIGHT - barH) / 2, left, width, height: barH }}
    >
      <div
        className={cn(
          "group relative h-full w-full rounded-full overflow-hidden",
          canEdit && "cursor-grab",
          editing && "ring-2 ring-brand-400 shadow-pop",
        )}
        style={{
          backgroundColor: isProject ? row.color : `${row.color}40`,
          touchAction: "none",
        }}
        onPointerDown={canEdit ? (e) => onBeginDrag(e, "move") : undefined}
        role={canEdit ? "button" : "img"}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={canEdit ? handleKeyDown : undefined}
        aria-label={`${row.label} 進捗${row.progress}% 期間${format(new Date(effStart), "M/d")}から${format(new Date(effDue), "M/d")}${canEdit ? "（左右矢印キーで1日移動）" : ""}`}
        title={`${row.label} (${row.progress}%) ${format(new Date(effStart), "M/d")}–${format(new Date(effDue), "M/d")}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
          style={{
            width: `${row.progress}%`,
            backgroundColor: row.color,
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.06) 100%)",
          }}
        />
        {canEdit && (
          <>
            <span
              onPointerDown={(e) => onBeginDrag(e, "start")}
              className="absolute left-0 inset-y-0 w-2.5 cursor-ew-resize rounded-l-full bg-white/40 opacity-0 group-hover:opacity-100"
            />
            <span
              onPointerDown={(e) => onBeginDrag(e, "end")}
              className="absolute right-0 inset-y-0 w-2.5 cursor-ew-resize rounded-r-full bg-white/40 opacity-0 group-hover:opacity-100"
            />
          </>
        )}
      </div>
      <span className="ml-1.5 text-[11px] text-ink-soft whitespace-nowrap tabular-nums">
        {format(new Date(effDue), "M/d", { locale: ja })}
      </span>
    </div>
  );
}
