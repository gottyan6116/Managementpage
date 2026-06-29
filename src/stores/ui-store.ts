import { create } from "zustand";

/** グローバル UI 状態 (docs/05 §3)。サーバー状態は TanStack Query 側で管理する。 */
interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;

  ganttDayWidth: number;
  setGanttDayWidth: (v: number) => void;
}

export const GANTT_DAY_WIDTH_DEFAULT = 28;
export const GANTT_DAY_WIDTH_MIN = 16;
export const GANTT_DAY_WIDTH_MAX = 48;

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

  ganttDayWidth: GANTT_DAY_WIDTH_DEFAULT,
  setGanttDayWidth: (v) =>
    set({
      ganttDayWidth: Math.min(
        GANTT_DAY_WIDTH_MAX,
        Math.max(GANTT_DAY_WIDTH_MIN, v),
      ),
    }),
}));
