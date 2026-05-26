import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  focusMode: boolean;
  searchOpen: boolean;
  activeNoteId: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setFocusMode: (on: boolean) => void;
  toggleFocusMode: () => void;
  setSearchOpen: (open: boolean) => void;
  setActiveNoteId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  focusMode: false,
  searchOpen: false,
  activeNoteId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setFocusMode: (on) => set({ focusMode: on }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),
}));
