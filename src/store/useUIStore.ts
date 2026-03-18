import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
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
    }),
    {
      name: "ui-store", // key in localStorage
    }
  )
);