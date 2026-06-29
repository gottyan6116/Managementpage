"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  FileText,
  FolderKanban,
  HelpCircle,
  ListTodo,
  Menu,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";
import { useNotifications } from "@/lib/queries/hooks";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const CREATE_ITEMS = [
  { label: "プロジェクト", icon: FolderKanban },
  { label: "タスク", icon: ListTodo },
  { label: "メモ", icon: StickyNote },
  { label: "ドキュメント", icon: FileText },
];

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setPalette = useUiStore((s) => s.setCommandPaletteOpen);
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    }
    function onClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [setPalette]);

  return (
    <header className="h-16 shrink-0 flex items-center gap-4 px-6 bg-surface border-b border-line">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="サイドバーを開閉"
        className="inline-flex items-center justify-center size-9 rounded-lg text-ink-soft hover:bg-surface-muted transition-colors"
      >
        <Menu className="size-5" />
      </button>

      {/* 検索 */}
      <button
        type="button"
        onClick={() => setPalette(true)}
        className="group flex items-center gap-2.5 h-10 w-full max-w-md rounded-xl border border-line bg-app px-3.5 text-left text-ink-muted hover:border-brand-300 transition-colors"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-sm truncate">
          プロジェクト、タスク、ドキュメントを検索...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {/* 通知 */}
        <button
          type="button"
          aria-label={`通知 ${unread}件`}
          className="relative inline-flex items-center justify-center size-9 rounded-lg text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unread}
            </span>
          )}
        </button>

        {/* ヘルプ */}
        <button
          type="button"
          aria-label="ヘルプ"
          className="inline-flex items-center justify-center size-9 rounded-lg text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <HelpCircle className="size-5" />
        </button>

        {/* 新規作成 */}
        <div className="relative ml-1" ref={createRef}>
          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={createOpen}
            className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 px-3.5 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">新規作成</span>
            <ChevronDown className="size-4" />
          </button>
          {createOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-xl border border-line bg-surface shadow-pop p-1.5 z-50"
            >
              {CREATE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={() => setCreateOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-muted transition-colors text-left",
                    )}
                  >
                    <Icon className="size-4 text-ink-soft" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
