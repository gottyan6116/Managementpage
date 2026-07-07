"use client";

import { useMemo } from "react";
import { SectionCard } from "@/components/shared/section-card";
import { DueText } from "@/components/shared/due-text";
import { useProjects, useUpcoming } from "@/lib/queries/hooks";

export function UpcomingList() {
  const { data: items } = useUpcoming(6);
  const { data: projects } = useProjects("all");

  const nameOf = useMemo(() => {
    const map = new Map(projects?.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [projects]);

  return (
    <SectionCard
      title="今後の期限"
      actionHref="/gantt"
      actionLabel="ガントで見る"
      bodyClassName="pb-3"
      className="glass-card"
    >
      <ul className="divide-y divide-line">
        {items?.map((item) => (
          <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 py-3">
            {item.kind === "milestone" ? (
              /* マイルストーンは ◆ で種別を明示 (タスクとの誤読防止) */
              <span
                aria-label="マイルストーン"
                className="block size-2.5 rotate-45 rounded-[2px] shrink-0"
                style={{ backgroundColor: item.color }}
              />
            ) : (
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">
                {item.title}
                {item.kind === "milestone" && (
                  <span className="ml-1.5 inline-flex items-center rounded-full border border-line bg-surface-muted px-1.5 py-px text-[10px] font-semibold text-ink-soft align-middle">
                    MS
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-soft truncate">{nameOf(item.projectId)}</p>
            </div>
            <DueText date={item.dueDate} className="flex-col items-end gap-0.5 text-right" />
          </li>
        ))}
        {items?.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-soft">
            直近の期限はありません
          </li>
        )}
      </ul>
    </SectionCard>
  );
}
