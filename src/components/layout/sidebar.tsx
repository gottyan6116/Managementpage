"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Hexagon } from "lucide-react";
import { NAV_SECTIONS } from "./nav";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  useUiStore,
} from "@/stores/ui-store";
import { self } from "@/lib/repositories";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const me = self();

  const [resizing, setResizing] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => {
    if (!resizing) return;
    function onMove(e: PointerEvent) {
      setSidebarWidth(startW.current + (e.clientX - startX.current));
    }
    function onUp() {
      setResizing(false);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing, setSidebarWidth]);

  function beginResize(e: React.PointerEvent) {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    setResizing(true);
  }

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : sidebarWidth;

  return (
    <aside
      className={cn(
        "relative shrink-0 ease-out",
        !resizing && "transition-[width] duration-300",
      )}
      style={{ width }}
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
          <nav className="relative flex-1 px-3 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-4">
                {!collapsed && (
                  <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.12em] text-[color:var(--sidebar-text-dim)]">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
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
                </div>
              </div>
            ))}
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

      {/* 幅調整ハンドル (折りたたみ時は非表示) */}
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="サイドバーの幅を調整"
          onPointerDown={beginResize}
          onDoubleClick={() => setSidebarWidth(248)}
          title="ドラッグで幅調整（ダブルクリックで初期値）"
          className="group absolute top-0 right-0 h-full w-2 cursor-col-resize z-30"
        >
          <span
            className={cn(
              "absolute inset-y-0 right-0 w-0.5 transition-colors",
              resizing ? "bg-brand-500" : "bg-transparent group-hover:bg-brand-400/70",
            )}
          />
        </div>
      )}
    </aside>
  );
}
