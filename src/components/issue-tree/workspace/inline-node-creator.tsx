"use client";

import { useEffect, useRef, useState } from "react";

/**
 * インラインのノード作成入力。
 * Enter=確定 / Shift+Enter=改行 / Escape=キャンセル。
 * 空のノードを先に描画する方式は取らない (確定時に初めて作成する)。
 */
export function InlineNodeCreator({
  placeholder = "ノードのタイトルを入力…",
  autoFocus = true,
  onConfirm,
  onCancel,
}: {
  placeholder?: string;
  autoFocus?: boolean;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  function confirm() {
    const title = value.trim();
    if (!title) {
      onCancel();
      return;
    }
    onConfirm(title);
  }

  return (
    <div className="rounded-xl border border-brand-300 bg-surface shadow-card p-2">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            confirm();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={confirm}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-snug text-ink outline-none placeholder:text-ink-muted"
      />
      <p className="px-1.5 pb-0.5 text-[10px] text-ink-soft">
        Enterで確定 / Shift+Enterで改行 / Escapeでキャンセル
      </p>
    </div>
  );
}
