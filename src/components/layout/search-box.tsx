"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Folder,
  ListTodo,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useSearch } from "@/lib/queries/hooks";
import type { SearchHit } from "@/lib/repositories";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SearchHit["type"], { icon: LucideIcon; label: string; color: string }> = {
  project: { icon: Briefcase, label: "案件", color: "#2563EB" },
  task: { icon: ListTodo, label: "タスク", color: "#0F766E" },
  document: { icon: FileText, label: "ドキュメント", color: "#7C3AED" },
  file: { icon: Folder, label: "ファイル", color: "#D97706" },
};

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: hits } = useSearch(query);
  const results = (hits ?? []).slice(0, 8);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) go(results[active]);
      else if (query.trim()) {
        setOpen(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="search-input flex items-center gap-2.5 h-10 rounded-xl px-3.5 focus-within:border-brand-300 transition-colors">
        <Search className="size-4 shrink-0 text-ink-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="プロジェクト、タスク、ドキュメントを検索..."
          className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-muted outline-none"
        />
        <kbd className="hidden sm:inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
          ⌘K
        </kbd>
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-line bg-surface shadow-pop z-50 overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              「{query}」に一致する結果はありません
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((hit, i) => {
                const meta = TYPE_META[hit.type];
                const Icon = meta.icon;
                return (
                  <li key={`${hit.type}-${hit.id}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(hit)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                        i === active ? "bg-surface-muted" : "hover:bg-surface-muted/60",
                      )}
                    >
                      <span
                        className="inline-flex items-center justify-center size-8 rounded-lg shrink-0"
                        style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink truncate">{hit.title}</span>
                        <span className="block text-xs text-ink-muted truncate">{hit.subtitle}</span>
                      </span>
                      <span className="text-[10px] text-ink-muted shrink-0">{meta.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
            className="w-full border-t border-line px-4 py-2.5 text-xs font-medium text-brand-600 hover:bg-surface-muted/60 text-left"
          >
            「{query}」の検索結果をすべて表示
          </button>
        </div>
      )}
    </div>
  );
}
