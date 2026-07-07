import type { ProjectStatus, Priority, TaskStatus } from "@/types/domain";

/** ENUM ↔ 表示ラベルのマッピング (docs/05 §4)。表示は必ずここを通す。 */

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
  on_hold: "保留",
  canceled: "中止",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  in_progress: "進行中",
  final_check: "最終確認",
  done: "完了",
  on_hold: "保留",
  canceled: "中止",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

/**
 * バッジの配色 (docs/02 §2)。文字色 / 背景色。
 * 文字色は各背景に対して WCAG AA (4.5:1) を満たす値にすること。
 * (旧仕様値 中=#D97706 は 2.9:1 で未達だったため 1 段深い色へ改訂済み)
 */
export const STATUS_STYLE: Record<
  TaskStatus | ProjectStatus,
  { fg: string; bg: string }
> = {
  todo: { fg: "#475569", bg: "#F1F5F9" },
  in_progress: { fg: "#1D4ED8", bg: "#DBEAFE" },
  done: { fg: "#15803D", bg: "#DCFCE7" },
  final_check: { fg: "#155E75", bg: "#CFFAFE" },
  on_hold: { fg: "#B45309", bg: "#FEF3C7" },
  canceled: { fg: "#6B7280", bg: "#F3F4F6" },
};

export const PRIORITY_STYLE: Record<Priority, { fg: string; bg: string }> = {
  high: { fg: "#B91C1C", bg: "#FEE2E2" },
  medium: { fg: "#B45309", bg: "#FEF3C7" },
  low: { fg: "#15803D", bg: "#DCFCE7" },
};

export function statusLabel(status: TaskStatus | ProjectStatus): string {
  return (
    (PROJECT_STATUS_LABEL as Record<string, string>)[status] ??
    (TASK_STATUS_LABEL as Record<string, string>)[status] ??
    status
  );
}
