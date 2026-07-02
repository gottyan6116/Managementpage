"use client";

import { useId, useState } from "react";
import type { Member } from "@/types/domain";
import { cn } from "@/lib/utils";

/** 担当者をテキスト入力 (候補プルダウン付き) で選べるコンボボックス */
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
  const listId = useId();
  const current = members.find((m) => m.id === value);
  const [text, setText] = useState(current?.name ?? "");
  const [syncedValue, setSyncedValue] = useState(value);

  // 外部から value が変わったら表示テキストを合わせる (レンダー中に調整)
  if (syncedValue !== value) {
    setSyncedValue(value);
    setText(current?.name ?? "");
  }

  function commit() {
    const trimmed = text.trim();
    if (!trimmed) {
      if (value !== null) onChange(null);
      return;
    }
    const match = members.find((m) => m.name === trimmed);
    if (match) {
      if (match.id !== value) onChange(match.id);
    } else {
      // 未登録の名前は反映せず元の値に戻す
      setText(current?.name ?? "");
    }
  }

  return (
    <div className={className}>
      <input
        list={listId}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          commit();
          onClose?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setText(current?.name ?? "");
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand-300",
          inputClassName,
        )}
      />
      <datalist id={listId}>
        {members.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
    </div>
  );
}
