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
    tone: string;
    href: string;
  }[] = [
    { label: "期限超過", value: overdue, icon: AlertTriangle, tone: "text-red-600 bg-red-50", href: "/todo?tab=overdue" },
    { label: "今日締切", value: dueToday, icon: Calendar, tone: "text-brand-600 bg-brand-50", href: "/todo" },
    { label: "今週締切", value: dueThisWeek, icon: Clock, tone: "text-orange-600 bg-orange-50", href: "/gantt" },
    { label: "未読通知", value: unread, icon: Bell, tone: "text-purple-600 bg-purple-50", href: "/todo" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-2xl bg-surface border border-line shadow-card p-4 hover:shadow-pop transition-shadow flex flex-col justify-between min-h-[104px]"
          >
            <span className={cn("inline-flex items-center justify-center size-8 rounded-lg", item.tone)}>
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
