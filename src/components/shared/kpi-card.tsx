import Link from "next/link";
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
  href,
}: {
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: { value: string; dir: "up" | "down"; tone?: "good" | "bad" };
  graph?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "rounded-xl bg-surface border border-line shadow-card px-5 py-4 flex flex-col gap-2.5 transition-shadow hover:shadow-pop",
        href && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between">
        {Icon ? (
          <span
            className="inline-flex items-center justify-center rounded-lg size-10 shrink-0"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Icon className="size-5" />
          </span>
        ) : (
          <span className="text-xs font-semibold tracking-wide text-ink-muted">
            {label}
          </span>
        )}
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
          {Icon && <p className="text-sm text-ink-soft">{label}</p>}
          <p className="text-[28px] leading-none font-bold text-ink mt-1 tabular-nums">
            {value}
          </p>
          {sub && <p className="text-xs text-ink-muted mt-1.5">{sub}</p>}
        </div>
        {graph && <div className="shrink-0 self-center">{graph}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label} の詳細を見る`}>
        {body}
      </Link>
    );
  }

  return body;
}
