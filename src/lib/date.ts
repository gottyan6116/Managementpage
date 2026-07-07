import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * アプリ全体の「今日」(JST の暦日)。
 * Vercel のサーバーは UTC のため、素の new Date() で日付文字列を作ると
 * JST 0:00〜8:59 の間ズレる。必ず Asia/Tokyo で丸めた暦日を使う。
 * デモで日付を固定したい場合は NEXT_PUBLIC_DEMO_TODAY=yyyy-MM-dd を設定する。
 */
const DEMO_TODAY = process.env.NEXT_PUBLIC_DEMO_TODAY;

export function appToday(): Date {
  if (DEMO_TODAY) return parseISO(DEMO_TODAY);
  // en-CA ロケールは yyyy-MM-dd を返す
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
  return parseISO(ymd);
}

export function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** "5/16(金)" 形式 */
export function formatDue(value: string | Date): string {
  return format(toDate(value), "M/d(E)", { locale: ja });
}

/** "2025年5月" 形式 */
export function formatMonth(value: string | Date): string {
  return format(toDate(value), "yyyy年M月", { locale: ja });
}

/** 今日 (JST) を起点とした残り日数 (負 = 超過) */
export function daysUntil(value: string | Date): number {
  return differenceInCalendarDays(toDate(value), appToday());
}

export type DueTone = "overdue" | "today" | "soon" | "normal" | "done";

export interface DueInfo {
  label: string;
  tone: DueTone;
}

/**
 * 残り日数ラベルとトーン (docs/02 §2 期限の残り日数テキスト色)。
 * - 当日/超過: 赤 / 残り1〜3日: オレンジ / 4日以上: muted
 */
export function remainingLabel(
  value: string | Date,
  opts?: { done?: boolean },
): DueInfo {
  if (opts?.done) return { label: "完了", tone: "done" };
  const d = daysUntil(value);
  if (d < 0) return { label: `${Math.abs(d)}日超過`, tone: "overdue" };
  if (d === 0) return { label: "今日", tone: "today" };
  if (d <= 3) return { label: `残り${d}日`, tone: "soon" };
  return { label: `残り${d}日`, tone: "normal" };
}

/** 「今日 / 明日 / N日後」(右ペインのマイルストーン用) */
export function relativeDayLabel(value: string | Date): string {
  const d = daysUntil(value);
  if (d < 0) return `${Math.abs(d)}日前`;
  if (d === 0) return "今日";
  if (d === 1) return "明日";
  return `${d}日後`;
}

export const DUE_TONE_COLOR: Record<DueTone, string> = {
  overdue: "#DC2626",
  today: "#DC2626",
  soon: "#EA580C",
  normal: "#64748B", // 判断材料として読ませるため muted (#94A3B8, 2.5:1) は使わない
  done: "#15803D",
};
