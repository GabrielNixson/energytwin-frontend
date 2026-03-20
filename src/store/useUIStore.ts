import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  is3DMode: boolean;
  setIs3DMode: (is3D: boolean) => void;
  selectedSubOption: string | null;
  setSelectedSubOption: (option: string | null) => void;
  dxfData: any | null;
  setDxfData: (data: any | null) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Sidebar Open Close
      isSidebarCollapsed: false,
      setIsSidebarCollapsed: (isCollapsed) =>
        set({ isSidebarCollapsed: isCollapsed }),

      // Project Edit Mode
      isEditMode: false,
      setIsEditMode: (isEditMode) =>
        set({ isEditMode }),

      // Sidebar Option Select
      selectedOption: "overview",
      setSelectedOption: (option) =>
        set({ selectedOption: option }),

      // 3D View Mode
      is3DMode: false,
      setIs3DMode: (is3DMode) => set({ is3DMode }),

      // Tools Sub Options
      selectedSubOption: null,
      setSelectedSubOption: (selectedSubOption) => set({ selectedSubOption }),

      // DXF Data
      dxfData: null,
      setDxfData: (dxfData) => set({ dxfData }),
    }),
    {
      name: "ui-store", // key in localStorage
      // We might want to EXCLUDE dxfData from localStorage to avoid size errors
      partialize: (state) => {
        const { dxfData, ...rest } = state;
        return rest;
      },
    }
  )
);