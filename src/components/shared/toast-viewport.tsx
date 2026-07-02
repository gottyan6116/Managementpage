"use client";

import { X } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="relative overflow-hidden rounded-xl bg-ink text-white shadow-pop px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm min-w-0 flex-1">{toast.message}</p>
            <div className="flex items-center gap-1 shrink-0">
              {toast.actionLabel && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismiss(toast.id);
                  }}
                  className="text-sm font-semibold text-brand-300 hover:text-brand-200 px-1.5"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="閉じる"
                className="inline-flex items-center justify-center size-6 rounded-md text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-brand-400 animate-[toast-shrink_linear_forwards]"
            style={{ animationDuration: `${toast.durationMs}ms` }}
          />
        </div>
      ))}
    </div>
  );
}
