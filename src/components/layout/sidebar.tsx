"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_SECTIONS } from "./nav";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  useUiStore,
} from "@/stores/ui-store";
import { self } from "@/lib/repositories";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const me = self();

  return (
    <div className="sidebar-glass relative h-full rounded-2xl overflow-hidden flex flex-col">
      {/* ロゴ */}
      <div className="relative px-4 pt-5 pb-4">
        <Link href="/todo" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="relative inline-flex items-center justify-center size-9 shrink-0 rounded-xl bg-brand-600">
            <span className="text-white font-extrabold text-sm">P</span>
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-bold text-[17px] leading-tight text-ink">
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
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "sidebar-nav-active"
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
            "profile-card w-full flex items-center gap-2.5 rounded-xl hover:brightness-[0.98] transition-colors px-3 py-2.5 text-left",
            collapsed && "justify-center px-0",
          )}
        >
          <span
            className="inline-flex items-center justify-center rounded-full size-8 shrink-0 text-white font-semibold ring-2 ring-surface"
            style={{ backgroundColor: me.color }}
          >
            {me.name.slice(0, 1)}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate text-ink">
                  {me.name}
                </span>
                <span className="block text-[11px] text-[color:var(--sidebar-text-dim)] truncate">
                  {me.role}
                </span>
              </span>
              <LogoutButton />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);

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

  // モバイルドロワー: Escape で閉じる
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  function beginResize(e: React.PointerEvent) {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    setResizing(true);
  }

  const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : sidebarWidth;

  return (
    <>
      {/* デスクトップ (lg 以上): 常設サイドバー */}
      <aside
        className={cn(
          "relative shrink-0 ease-out hidden lg:block",
          !resizing && "transition-[width] duration-300",
        )}
        style={{ width }}
      >
        <div className="sticky top-0 h-screen p-3">
          <SidebarContent collapsed={collapsed} />
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

      {/* モバイル (lg 未満): オフキャンバスドロワー */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] p-3">
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              aria-label="メニューを閉じる"
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 inline-flex items-center justify-center size-8 rounded-lg bg-surface text-ink-soft shadow-card"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
