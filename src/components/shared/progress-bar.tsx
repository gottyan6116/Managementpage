import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  color = "#3B82F6",
  showValue = true,
  className,
}: {
  value: number;
  color?: string;
  showValue?: boolean;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 flex-1 rounded-full bg-surface-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-ink-soft tabular-nums w-9 text-right">
          {v}%
        </span>
      )}
    </div>
  );
}
