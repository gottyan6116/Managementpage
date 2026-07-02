"use client";

import Link from "next/link";
import { AlertTriangle, Bell, Calendar, Clock, type LucideIcon } from "lucide-react";
import { useNotifications, useTasks } from "@/lib/queries/hooks";
import { daysUntil } from "@/lib/date";
import { cn } from "@/lib/utils";

export function SpotlightGrid() {
  const { data: tasks } = useTasks({ tab: "all" });
  const { data: notifications } = useNotifications();

  const open = (tasks ?? []).filter((t) => t.status !== "done" && t.dueDate);
  const overdue = open.filter((t) => daysUntil(t.dueDate as string) < 0).length;
  const dueToday = open.filter((t) => daysUntil(t.dueDate as string) === 0).length;
  const dueThisWeek = open.filter((t) => {
    const d = daysUntil(t.dueDate as string);
    return d > 0 && d <= 7;
  }).length;
  const unread = (notifications ?? []).filter((n) => !n.isRead).length;

  const items: {
    label: string;
    value: number;
    icon: LucideIcon;
    cardClass: string;
    iconClass: string;
    href: string;
  }[] = [
    { label: "期限超過", value: overdue, icon: AlertTriangle, cardClass: "kpi-danger", iconClass: "kpi-danger-icon", href: "/todo?tab=overdue" },
    { label: "今日締切", value: dueToday, icon: Calendar, cardClass: "kpi-warning", iconClass: "kpi-warning-icon", href: "/todo" },
    { label: "今週締切", value: dueThisWeek, icon: Clock, cardClass: "kpi-blue", iconClass: "kpi-blue-icon", href: "/gantt" },
    { label: "未読通知", value: unread, icon: Bell, cardClass: "kpi-purple", iconClass: "kpi-purple-icon", href: "/todo" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "rounded-2xl p-4 hover:shadow-pop transition-shadow flex flex-col justify-between min-h-[104px]",
              item.cardClass,
            )}
          >
            <span className={cn("inline-flex items-center justify-center size-8 rounded-lg", item.iconClass)}>
              <Icon className="size-4" />
            </span>
            <div className="mt-2">
              <p className="text-xs text-ink-muted">{item.label}</p>
              <p className="text-2xl font-bold text-ink tabular-nums">
                {item.value}
                <span className="ml-1 text-xs font-normal text-ink-muted">件</span>
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
