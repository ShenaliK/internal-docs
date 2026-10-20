import { create } from "zustand";

interface SidebarState {
  expandedProjectSlug: string | null;
  toggleProject: (slug: string) => void;
  expandProject: (slug: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expandedProjectSlug: null,

  toggleProject: (slug) =>
    set((state) => ({
      expandedProjectSlug:
        state.expandedProjectSlug === slug ? null : slug,
    })),

  expandProject: (slug) =>
    set({ expandedProjectSlug: slug }),
}));
