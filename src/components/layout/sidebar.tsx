"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Hexagon } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useUiStore } from "@/stores/ui-store";
import { self } from "@/lib/repositories";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const me = self();

  return (
    <aside
      className={cn(
        "relative shrink-0 transition-[width] duration-300 ease-out",
        collapsed ? "w-20" : "w-[248px]",
      )}
    >
      <div className="sticky top-0 h-screen p-3">
        <div
          className="relative h-full rounded-2xl overflow-hidden flex flex-col text-white"
          style={{
            backgroundImage:
              "linear-gradient(160deg, var(--sidebar-from), var(--sidebar-to))",
            boxShadow: "var(--shadow-side)",
          }}
        >
          {/* 山と湖のシーン (frosted glass 質感) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-bottom opacity-55 mix-blend-soft-light"
            style={{ backgroundImage: "url('/sidebar-bg.svg')" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light"
            style={{
              backgroundImage:
                "radial-gradient(120% 50% at 20% 0%, rgba(255,255,255,.4), transparent 60%)",
            }}
          />

          {/* ロゴ */}
          <div className="relative px-4 pt-5 pb-4">
            <Link href="/todo" className="flex items-center gap-2.5">
              <span className="relative inline-flex items-center justify-center size-9 shrink-0">
                <Hexagon className="size-9 fill-white/95 text-white/95" />
                <span className="absolute text-brand-600 font-extrabold text-sm">P</span>
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block font-bold text-[17px] leading-tight">
                    ProManage
                  </span>
                  <span className="block text-[10px] text-[color:var(--sidebar-text-dim)] leading-tight">
                    Work Together, Succeed.
                  </span>
                </span>
              )}
            </Link>
          </div>

          {/* メニュー */}
          <nav className="relative flex-1 px-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)] shadow-sm"
                      : "text-[color:var(--sidebar-text)] hover:bg-[color:var(--sidebar-hover-bg)]",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* プロフィール */}
          <div className="relative p-3">
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-2.5 rounded-xl bg-white/15 hover:bg-white/20 transition-colors px-3 py-2.5 text-left",
                collapsed && "justify-center px-0",
              )}
            >
              <span
                className="inline-flex items-center justify-center rounded-full size-8 shrink-0 text-white font-semibold ring-2 ring-white/70"
                style={{ backgroundColor: me.color }}
              >
                {me.name.slice(0, 1)}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">
                      {me.name}
                    </span>
                    <span className="block text-[11px] text-[color:var(--sidebar-text-dim)] truncate">
                      {me.role}
                    </span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
