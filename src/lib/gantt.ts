/**
 * ガントの座標計算 (純関数)。docs/04 §2 実装メモ。
 * UI から切り離してユニットテスト可能にする (DoD §5)。
 */
import {
  addDays,
  differenceInCalendarDays,
  eachWeekOfInterval,
  endOfWeek,
  format,
  max,
  min,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

export const GANTT_ROW_HEIGHT = 44;
export const GANTT_HEADER_HEIGHT = 52;

const WEEK_OPTS = { weekStartsOn: 1 } as const; // 月曜始まり

export function d(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** 日付 → タイムライン上の X 座標 (px) */
export function dateToX(
  date: string | Date,
  rangeStart: Date,
  dayWidth: number,
): number {
  return differenceInCalendarDays(d(date), rangeStart) * dayWidth;
}

/** ISO 日付 (yyyy-MM-dd) を days 日ずらして返す */
export function addDaysISO(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export interface BarGeometry {
  left: number;
  width: number;
}

/** バーの左位置と幅 (width = (due - start + 1) * dayWidth) */
export function barGeometry(
  start: string | Date,
  due: string | Date,
  rangeStart: Date,
  dayWidth: number,
): BarGeometry {
  const left = dateToX(start, rangeStart, dayWidth);
  const days = differenceInCalendarDays(d(due), d(start)) + 1;
  return { left, width: Math.max(days, 1) * dayWidth };
}

export interface DayCell {
  date: Date;
  dow: string; // 月..日
  isWeekend: boolean;
}
export interface WeekCol {
  start: Date;
  end: Date;
  label: string; // "5/5 - 5/11"
  days: DayCell[];
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

/** 週カラム (週ヘッダ + 各日) を生成。範囲は月曜〜日曜にスナップ。 */
export function buildWeeks(rangeStart: Date, rangeEnd: Date): WeekCol[] {
  const start = startOfWeek(rangeStart, WEEK_OPTS);
  const end = endOfWeek(rangeEnd, WEEK_OPTS);
  return eachWeekOfInterval({ start, end }, WEEK_OPTS).map((wkStart) => {
    const wkEnd = endOfWeek(wkStart, WEEK_OPTS);
    const days: DayCell[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(wkStart, i);
      const day = date.getDay();
      return { date, dow: DOW[day], isWeekend: day === 0 || day === 6 };
    });
    return {
      start: wkStart,
      end: wkEnd,
      label: `${format(wkStart, "M/d", { locale: ja })} - ${format(wkEnd, "M/d", { locale: ja })}`,
      days,
    };
  });
}

export interface GanttRange {
  start: Date;
  end: Date;
  totalDays: number;
}

/** データ範囲から表示範囲を算出 (前後にパディング日数を足す) */
export function computeRange(
  dates: (string | null | undefined)[],
  padBefore = 7,
  padAfter = 14,
): GanttRange {
  const valid = dates.filter(Boolean).map((x) => d(x as string));
  const fallback = new Date();
  const lo = valid.length ? min(valid) : fallback;
  const hi = valid.length ? max(valid) : addDays(fallback, 30);
  const start = startOfWeek(addDays(lo, -padBefore), WEEK_OPTS);
  const end = endOfWeek(addDays(hi, padAfter), WEEK_OPTS);
  return { start, end, totalDays: differenceInCalendarDays(end, start) + 1 };
}

/**
 * プレビュー用の表示範囲: 今日を含む前1週〜後2週のみ。
 * 全期間を DOM 描画するとプレビューの域を超え、描画コストも跳ね上がるため。
 */
export function computePreviewRange(today: Date): GanttRange {
  const start = startOfWeek(addDays(today, -7), WEEK_OPTS);
  const end = endOfWeek(addDays(today, 14), WEEK_OPTS);
  return { start, end, totalDays: differenceInCalendarDays(end, start) + 1 };
}
