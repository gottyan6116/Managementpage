import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  pendingDeleteIds: Set<string>;
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  addPending: (ids: string[]) => void;
  removePending: (ids: string[]) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pendingDeleteIds: new Set(),
  push: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  addPending: (ids) =>
    set((s) => {
      const next = new Set(s.pendingDeleteIds);
      ids.forEach((id) => next.add(id));
      return { pendingDeleteIds: next };
    }),
  removePending: (ids) =>
    set((s) => {
      const next = new Set(s.pendingDeleteIds);
      ids.forEach((id) => next.delete(id));
      return { pendingDeleteIds: next };
    }),
}));
