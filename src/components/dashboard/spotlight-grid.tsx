"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useTasks } from "@/lib/queries/hooks";
import { daysUntil } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * KPI カード 2x2。すべてのカードは同一画面のタスク一覧を
 * 該当条件で絞り込むリンクとして機能する (自己リンク・死にリンク禁止)。
 * 0件のカードは警告色を点灯させずニュートラルに表示する。
 */
export function SpotlightGrid() {
  const { data: tasks } = useTasks({ tab: "all" });

  const open = (tasks ?? []).filter((t) => t.status !== "done" && t.dueDate);
  const overdue = open.filter((t) => daysUntil(t.dueDate as string) < 0).length;
  const dueToday = open.filter((t) => daysUntil(t.dueDate as string) === 0).length;
  const dueThisWeek = open.filter((t) => {
    const d = daysUntil(t.dueDate as string);
    return d > 0 && d <= 7;
  }).length;
  const doneCount = (tasks ?? []).filter((t) => t.status === "done").length;

  const items: {
    label: string;
    value: number;
    icon: LucideIcon;
    cardClass: string;
    iconClass: string;
    href: string;
    zeroLabel?: string;
  }[] = [
    {
      label: "期限超過",
      value: overdue,
      icon: AlertTriangle,
      cardClass: "kpi-danger",
      iconClass: "kpi-danger-icon",
      href: "/todo?tab=overdue",
      zeroLabel: "超過なし",
    },
    {
      label: "今日締切",
      value: dueToday,
      icon: Calendar,
      cardClass: "kpi-warning",
      iconClass: "kpi-warning-icon",
      href: "/todo?due=today",
      zeroLabel: "予定なし",
    },
    {
      label: "今週締切",
      value: dueThisWeek,
      icon: Clock,
      cardClass: "kpi-blue",
      iconClass: "kpi-blue-icon",
      href: "/todo?due=week",
      zeroLabel: "予定なし",
    },
    {
      label: "完了タスク",
      value: doneCount,
      icon: CheckCircle2,
      cardClass: "kpi-success",
      iconClass: "kpi-success-icon",
      href: "/todo?tab=done",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {items.map((item) => {
        const Icon = item.icon;
        const neutral = item.value === 0 && item.zeroLabel !== undefined;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "rounded-2xl p-4 hover:shadow-pop transition-shadow flex flex-col justify-between min-h-[104px]",
              neutral ? "kpi-neutral" : item.cardClass,
            )}
          >
            <span
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-lg",
                neutral ? "kpi-neutral-icon" : item.iconClass,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="mt-2">
              <p className="text-xs font-medium text-ink-soft">{item.label}</p>
              {neutral ? (
                <p className="text-sm font-semibold text-ink-soft mt-1.5">
                  {item.zeroLabel}
                </p>
              ) : (
                <p className="text-[28px] leading-9 font-bold text-ink tabular-nums">
                  {item.value}
                  <span className="ml-1 text-xs font-normal text-ink-soft">件</span>
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
