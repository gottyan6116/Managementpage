import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  trend,
  graph,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: { value: string; dir: "up" | "down"; tone?: "good" | "bad" };
  graph?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-line shadow-card p-5 flex flex-col gap-3 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between">
        <span
          className="inline-flex items-center justify-center rounded-xl size-12 shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon className="size-6" />
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              (trend.tone ?? (trend.dir === "up" ? "good" : "bad")) === "good"
                ? "text-emerald-600"
                : "text-red-500",
            )}
          >
            {trend.dir === "up" ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ArrowDown className="size-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">{label}</p>
          <p className="text-[32px] leading-none font-bold text-ink mt-1 tabular-nums">
            {value}
          </p>
          {sub && <p className="text-xs text-ink-muted mt-1.5">{sub}</p>}
        </div>
        {graph && <div className="shrink-0 self-center">{graph}</div>}
      </div>
    </div>
  );
}
