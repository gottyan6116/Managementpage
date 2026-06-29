import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  action,
  actionHref,
  actionLabel,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-surface border border-line shadow-card",
        className,
      )}
    >
      {(title || action || actionHref) && (
        <header className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-ink truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>
            )}
          </div>
          {action ??
            (actionHref && (
              <Link
                href={actionHref}
                className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-600 hover:text-brand-700 shrink-0"
              >
                {actionLabel ?? "すべて見る"}
                <ChevronRight className="size-4" />
              </Link>
            ))}
        </header>
      )}
      <div className={cn("px-6 pb-6", bodyClassName)}>{children}</div>
    </section>
  );
}
