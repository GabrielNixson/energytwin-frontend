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
  isAssetSidebarOpen: boolean;
  setIsAssetSidebarOpen: (isOpen: boolean) => void;
  placedModels: Array<{ id: string, name: string, path: string, position: [number, number, number], rotation: [number, number, number] }>;
  addPlacedModel: (model: { name: string, path: string, position: [number, number, number], rotation?: [number, number, number] }) => void;
  removePlacedModel: (id: string) => void;
  updateModelPosition: (id: string, position: [number, number, number]) => void;
  updateModelRotation: (id: string, rotation: [number, number, number]) => void;
  draggingAsset: { name: string, path: string, position: [number, number, number] } | null;
  setDraggingAsset: (asset: { name: string, path: string, position: [number, number, number] } | null) => void;
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;
  copiedModel: { name: string, path: string } | null;
  setCopiedModel: (model: { name: string, path: string } | null) => void;
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
      setSelectedSubOption: (selectedSubOption: string | null) => set({ selectedSubOption }),

      // Assets Sidebar
      isAssetSidebarOpen: false,
      setIsAssetSidebarOpen: (isOpen: boolean) => set({ isAssetSidebarOpen: isOpen }),

      // Placed 3D Models
      placedModels: [],
      addPlacedModel: (model) => set((state) => ({
        placedModels: [
          ...state.placedModels, 
          { 
            ...model, 
            id: 'model_' + Date.now(),
            rotation: model.rotation || [0, 0, 0]
          }
        ]
      })) as any,
      removePlacedModel: (id) => set((state) => ({
        placedModels: state.placedModels.filter(m => m.id !== id)
      })),
      updateModelPosition: (id, position) => set((state) => ({
        placedModels: state.placedModels.map(m => m.id === id ? { ...m, position } : m)
      })),
      updateModelRotation: (id, rotation) => set((state) => ({
        placedModels: state.placedModels.map(m => m.id === id ? { ...m, rotation } : m)
      })),

      // Dragging State
      draggingAsset: null,
      setDraggingAsset: (draggingAsset) => set({ draggingAsset }),

      // Selection
      selectedModelId: null,
      setSelectedModelId: (id) => set({ selectedModelId: id }),

      // Clipboard
      copiedModel: null,
      setCopiedModel: (copiedModel) => set({ copiedModel }),

      // DXF Data
      dxfData: null,
      setDxfData: (dxfData) => set({ dxfData }),
    }),
    {
      name: "ui-store", // key in localStorage
      // We might want to EXCLUDE dxfData and placedModels from localStorage
      partialize: (state) => {
        const { dxfData, placedModels, draggingAsset, copiedModel, selectedModelId, ...rest } = state;
        return rest;
      },
    }
  )
);