"use client";

import { useMemo } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { Donut } from "@/components/shared/charts";
import {
  useActions,
  useAtRiskProjects,
  useProjects,
  useStatusDistribution,
  useToggleAction,
} from "@/lib/queries/hooks";
import { PROJECT_STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { formatDue, relativeDayLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/domain";

export function ProjectsSidePane() {
  const { data: atRisk } = useAtRiskProjects();
  const { data: actions } = useActions();
  const { data: dist } = useStatusDistribution();
  const { data: projects } = useProjects("all");
  const toggle = useToggleAction();

  const projectName = useMemo(() => {
    const map = new Map(projects?.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "") : "");
  }, [projects]);

  const total = dist?.reduce((s, x) => s + x.count, 0) ?? 0;
  const slices =
    dist?.map((s) => ({
      label: PROJECT_STATUS_LABEL[s.status],
      value: s.count,
      color: STATUS_STYLE[s.status].fg,
    })) ?? [];

  return (
    <div className="space-y-5">
      {/* 要注意案件 */}
      <SectionCard title="要注意案件" bodyClassName="pb-4" className="glass-card">
        <ul className="space-y-2.5">
          {atRisk?.map((p) => (
            <li
              key={p.id}
              className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 p-3"
            >
              <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                <p className="text-xs text-red-500">
                  次回期限が{p.nextDue ? relativeDayLabel(p.nextDue) : "接近"}
                </p>
              </div>
              {p.nextDue && (
                <span className="text-xs text-ink-soft tabular-nums shrink-0">
                  {formatDue(p.nextDue)}
                </span>
              )}
            </li>
          ))}
          {atRisk?.length === 0 && (
            <li className="text-sm text-ink-muted text-center py-4">
              要注意の案件はありません
            </li>
          )}
        </ul>
      </SectionCard>

      {/* 今週のアクション */}
      <SectionCard title="今週のアクション" bodyClassName="pb-4" className="glass-card">
        <ul className="space-y-1">
          {actions?.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => toggle.mutate(a.id)}
                className="w-full flex items-start gap-2.5 rounded-lg px-1.5 py-2 hover:bg-surface-muted transition-colors text-left"
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center justify-center size-5 rounded-md border shrink-0 transition-colors",
                    a.isDone
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-ink-muted/60",
                  )}
                >
                  {a.isDone && <Check className="size-3" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      a.isDone ? "line-through text-ink-muted" : "text-ink",
                    )}
                  >
                    {a.title}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {projectName(a.projectId)}
                    {a.dueDate && ` ・ ${formatDue(a.dueDate)}`}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ステータス分布 */}
      <SectionCard
        title="案件ステータス分布"
        action={
          <span className="text-xs text-ink-soft border border-line rounded-lg px-2 py-1">
            今月
          </span>
        }
        bodyClassName="pb-4"
        className="glass-card"
      >
        <div className="flex items-center gap-5">
          <Donut
            size={108}
            thickness={14}
            slices={slices}
            centerTop={<span className="text-xl font-bold text-ink">{total}</span>}
            centerBottom="件"
          />
          <ul className="flex-1 space-y-1.5">
            {dist?.map((s) => {
              const pct = total ? Math.round((s.count / total) * 100) : 0;
              return (
                <li key={s.status} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_STYLE[s.status].fg }}
                  />
                  <span className="text-ink-soft flex-1">
                    {PROJECT_STATUS_LABEL[s.status as ProjectStatus]}
                  </span>
                  <span className="font-semibold text-ink tabular-nums">{s.count}</span>
                  <span className="text-ink-muted tabular-nums w-9 text-right">({pct}%)</span>
                </li>
              );
            })}
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}
