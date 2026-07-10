"use client";

import { Search, X } from "lucide-react";
import {
  isFilterActive,
  NODE_STATUS_META,
  NODE_STATUS_ORDER,
} from "@/lib/issue-tree/domain";
import { PRIORITY_LABEL } from "@/lib/labels";
import { useIssueTreeStore } from "@/stores/issue-tree-store";
import { cn } from "@/lib/utils";
import type { IssueTreePriority } from "@/lib/issue-tree/domain";

const PRIORITIES: IssueTreePriority[] = ["high", "medium", "low"];

/** フィルタパネル。一致しないノードは削除ではなく淡色表示になる。 */
export function FilterPanel() {
  const filters = useIssueTreeStore((s) => s.filters);
  const toggleStatus = useIssueTreeStore((s) => s.toggleStatusFilter);
  const togglePriority = useIssueTreeStore((s) => s.togglePriorityFilter);
  const setQuery = useIssueTreeStore((s) => s.setQueryFilter);
  const clear = useIssueTreeStore((s) => s.clearFilters);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">
          キーワード
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 h-9 focus-within:border-brand-300">
          <Search className="size-3.5 shrink-0 text-ink-muted" />
          <input
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル・仮説・結論"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="キーワードをクリア"
              className="text-ink-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">ステータス</p>
        <div className="flex flex-wrap gap-1.5">
          {NODE_STATUS_ORDER.map((s) => {
            const meta = NODE_STATUS_META[s];
            const active = filters.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "border-transparent"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
                style={active ? { color: meta.fg, backgroundColor: meta.bg } : undefined}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-soft">優先度</p>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => {
            const active = filters.priorities.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePriority(p)}
                aria-pressed={active}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                )}
              >
                {PRIORITY_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      {isFilterActive(filters) && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center justify-center gap-1 h-8 rounded-lg border border-line bg-surface text-xs font-medium text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <X className="size-3.5" />
          フィルタを解除
        </button>
      )}

      <p className="text-[11px] leading-relaxed text-ink-soft">
        一致しないノードは非表示にせず淡色になります (構造の文脈を保つため)。
      </p>
    </div>
  );
}
