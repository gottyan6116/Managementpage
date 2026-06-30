import { create } from "zustand";

/** グローバル UI 状態 (docs/05 §3)。サーバー状態は TanStack Query 側で管理する。 */
interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  sidebarWidth: number;
  setSidebarWidth: (v: number) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;

  ganttDayWidth: number;
  setGanttDayWidth: (v: number) => void;
}

export const GANTT_DAY_WIDTH_DEFAULT = 28;
export const GANTT_DAY_WIDTH_MIN = 16;
export const GANTT_DAY_WIDTH_MAX = 48;

export const SIDEBAR_WIDTH_DEFAULT = 248;
export const SIDEBAR_WIDTH_MIN = 200;
export const SIDEBAR_WIDTH_MAX = 400;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
  setSidebarWidth: (v) =>
    set({
      sidebarWidth: Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, v)),
    }),

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
