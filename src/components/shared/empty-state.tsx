import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <span className="inline-flex items-center justify-center size-16 rounded-2xl bg-brand-50 text-brand-500 mb-4">
        <Icon className="size-8" />
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
