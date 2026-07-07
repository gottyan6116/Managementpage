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
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/queries/hooks";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { SearchBox } from "./search-box";

const CREATE_ITEMS = [
  { label: "プロジェクト", icon: FolderKanban },
  { label: "タスク", icon: ListTodo },
  { label: "メモ", icon: StickyNote },
  { label: "ドキュメント", icon: FileText },
];

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const { data: notifications } = useNotifications();

  function handleMenuClick() {
    // lg 以上は折りたたみトグル、lg 未満はオフキャンバスドロワーを開く
    if (window.matchMedia("(min-width: 1024px)").matches) toggleSidebar();
    else setMobileSidebarOpen(true);
  }
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const [createOpen, setCreateOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const noticeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
      if (noticeRef.current && !noticeRef.current.contains(e.target as Node)) {
        setNoticeOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setCreateOpen(false);
      setNoticeOpen((open) => {
        if (open) noticeButtonRef.current?.focus();
        return false;
      });
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header className="header-glass h-16 shrink-0 flex items-center gap-4 px-6">
      <button
        type="button"
        onClick={handleMenuClick}
        aria-label="サイドバーを開閉"
        className="inline-flex items-center justify-center size-9 rounded-lg text-ink-soft hover:bg-surface-muted transition-colors"
      >
        <Menu className="size-5" />
      </button>

      {/* 検索 */}
      <SearchBox />

      <div className="ml-auto flex items-center gap-1.5">
        {/* 通知 */}
        <div className="relative" ref={noticeRef}>
          <button
            ref={noticeButtonRef}
            type="button"
            onClick={() => setNoticeOpen((v) => !v)}
            aria-label={`通知 ${unread}件`}
            aria-haspopup="menu"
            aria-expanded={noticeOpen}
            className="relative inline-flex items-center justify-center size-9 rounded-lg text-ink-soft hover:bg-surface-muted transition-colors"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unread}
              </span>
            )}
          </button>
          {noticeOpen && (
            <div
              role="menu"
              aria-label="通知センター"
              className="absolute right-0 mt-2 w-80 rounded-xl border border-line bg-surface shadow-pop p-2 z-50"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-semibold text-ink">通知センター</p>
                <p className="text-xs text-ink-soft">期限・メンション・依頼</p>
              </div>
              <div className="space-y-1">
                {notifications?.slice(0, 3).map((notice) => (
                  <Link
                    key={notice.id}
                    role="menuitem"
                    href={notice.link ?? "/todo"}
                    onClick={() => setNoticeOpen(false)}
                    className="block rounded-lg px-3 py-2.5 hover:bg-surface-muted"
                  >
                    <span className="block text-sm font-medium text-ink">{notice.title}</span>
                    {notice.body && (
                      <span className="mt-0.5 block text-xs text-ink-soft">{notice.body}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/*
          ダークモード切替は、ガラス系スタイルのダークトークンが未整備で
          切替時に表示が破綻するため、対応が済むまで非表示にしている。
        */}

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
            className="primary-button inline-flex items-center gap-1.5 h-10 rounded-xl px-3.5 text-sm font-semibold text-white transition-colors"
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
