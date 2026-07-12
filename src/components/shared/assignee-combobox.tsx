"use client";

import { useRef, useState } from "react";
import type { Member } from "@/types/domain";
import { cn } from "@/lib/utils";

/** 全角/半角スペースなどの差異を無視して名前を比較するための正規化 */
function normalize(s: string) {
  return s.replace(/[\s　]+/g, "").trim();
}

/**
 * 担当者をテキストで自由入力できるコンボボックス。
 * 候補は自前で描画するリストとして表示するのみで、ネイティブの
 * <select> や <input list> のような「プルダウン」の見た目にはしない。
 */
export function AssigneeCombobox({
  members,
  value,
  onChange,
  onClose,
  placeholder = "担当者名を入力",
  className,
  inputClassName,
  autoFocus,
}: {
  members: Member[];
  value: string | null;
  onChange: (memberId: string | null) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const current = members.find((m) => m.id === value);
  const [text, setText] = useState(current?.name ?? "");
  const [syncedValue, setSyncedValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const skipBlurCommit = useRef(false);

  // 外部から value が変わったら表示テキストを合わせる (レンダー中に調整)
  if (syncedValue !== value) {
    setSyncedValue(value);
    setText(current?.name ?? "");
  }

  const query = normalize(text);
  // 未入力 (フォーカスしただけ) の間は全員を表示し、入力があったら絞り込む
  const suggestions = touched
    ? members.filter((m) => query && normalize(m.name).includes(query))
    : members;

  function apply(memberId: string | null, name: string) {
    setText(name);
    setTouched(false);
    setOpen(false);
    if (memberId !== value) onChange(memberId);
    onClose?.();
  }

  function commit() {
    if (!touched) {
      // 何も編集していなければそのまま閉じる (値は変えない)
      setOpen(false);
      onClose?.();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      apply(null, "");
      return;
    }
    const exact = members.find((m) => normalize(m.name) === normalize(trimmed));
    if (exact) {
      apply(exact.id, exact.name);
      return;
    }
    if (suggestions.length === 1) {
      // 候補が1件に絞れていればそれを採用する
      apply(suggestions[0].id, suggestions[0].name);
      return;
    }
    // 未登録 (かつ候補が定まらない) 名前は反映せず元の値に戻す
    setText(current?.name ?? "");
    setTouched(false);
    setOpen(false);
    onClose?.();
  }

  return (
    <div className={cn("relative", className)}>
      <input
        value={text}
        autoFocus={autoFocus}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setTouched(true);
          setOpen(true);
          setHighlight(0);
        }}
        onBlur={() => {
          if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            return;
          }
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (touched && open && suggestions[highlight]) {
              apply(suggestions[highlight].id, suggestions[highlight].name);
            } else {
              e.currentTarget.blur();
            }
          } else if (e.key === "Escape") {
            setText(current?.name ?? "");
            setTouched(false);
            setOpen(false);
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand-300",
          inputClassName,
        )}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full min-w-[8rem] overflow-auto rounded-md border border-line bg-surface py-1 shadow-pop"
        >
          {suggestions.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  // blur より先に発火するため、blur 側のコミット処理をスキップさせる
                  e.preventDefault();
                  skipBlurCommit.current = true;
                  apply(m.id, m.name);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "block w-full truncate px-2.5 py-1.5 text-left text-xs",
                  i === highlight
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink hover:bg-surface-muted",
                )}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
