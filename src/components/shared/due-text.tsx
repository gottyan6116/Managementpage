import { DUE_TONE_COLOR, formatDue, remainingLabel } from "@/lib/date";
import { cn } from "@/lib/utils";

/** 期限の日付 + 残り日数 (色付き) */
export function DueText({
  date,
  done = false,
  className,
  showDate = true,
}: {
  date: string;
  done?: boolean;
  className?: string;
  showDate?: boolean;
}) {
  const info = remainingLabel(date, { done });
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      {showDate && (
        <span className="text-sm text-ink tabular-nums">{formatDue(date)}</span>
      )}
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{ color: DUE_TONE_COLOR[info.tone] }}
      >
        {info.label}
      </span>
    </span>
  );
}
