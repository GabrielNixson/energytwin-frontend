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
  isChartSidebarOpen: boolean;
  setIsChartSidebarOpen: (isOpen: boolean) => void;
  placedModels: Array<{ id: string, name: string, path: string, position: [number, number, number], rotation: [number, number, number] }>;
  addPlacedModel: (model: { name: string, path: string, position: [number, number, number], rotation?: [number, number, number] }) => void;
  removePlacedModel: (id: string) => void;
  updateModelPosition: (id: string, position: [number, number, number]) => void;
  updateModelRotation: (id: string, rotation: [number, number, number]) => void;
  draggingAsset: { name: string, path: string, position: [number, number, number] } | null;
  setDraggingAsset: (asset: { name: string, path: string, position: [number, number, number] } | null) => void;
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;
  overlayCharts: Array<{ id: string, type: string, title: string, x: number, y: number, w: number, h: number, anchorX?: 'left' | 'right', anchorY?: 'top' | 'bottom', config?: any }>;
  addOverlayChart: (chart: { type: string, title: string, x: number, y: number, w: number, h: number, config?: any }) => void;
  removeOverlayChart: (id: string) => void;
  updateOverlayChart: (id: string, updates: Partial<{ x: number, y: number, w: number, h: number, anchorX: 'left' | 'right', anchorY: 'top' | 'bottom', config: any }>) => void;
  bringOverlayToFront: (id: string) => void;
  findSafePosition: (id: string | null, x: number, y: number, w: number, h: number, containerW: number, containerH: number, externalCharts?: any[]) => { x: number, y: number };
  draggingChartPreview: { type: string, title: string, x: number, y: number } | null;
  setDraggingChartPreview: (preview: { type: string, title: string, x: number, y: number } | null) => void;
  copiedModel: { name: string, path: string } | null;
  setCopiedModel: (model: { name: string, path: string } | null) => void;
  dxfData: any | null;
  setDxfData: (data: any | null) => void;
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  isEyedropperActive: boolean;
  setIsEyedropperActive: (active: boolean) => void;
  eyedropperSelection: { name: string, id: string } | null;
  setEyedropperSelection: (selection: { name: string, id: string } | null) => void;
  hoveredAsset: { name: string, id: string } | null;
  setHoveredAsset: (asset: { name: string, id: string } | null) => void;
  selectedChartId: string | null;
  setSelectedChartId: (id: string | null) => void;
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  showCharts: boolean;
  setShowCharts: (show: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
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
      is3DMode: true,
      setIs3DMode: (is3DMode) => set({ is3DMode }),

      // Tools Sub Options
      selectedSubOption: null as string | null,
      setSelectedSubOption: (selectedSubOption: string | null) => set({ selectedSubOption }),

      // Assets Sidebar
      isAssetSidebarOpen: false,
      setIsAssetSidebarOpen: (isOpen: boolean) => set((state) => ({
        isAssetSidebarOpen: isOpen,
        isChartSidebarOpen: isOpen ? false : state.isChartSidebarOpen,
        selectedChartId: isOpen ? null : state.selectedChartId,
        is3DMode: isOpen ? true : state.is3DMode
      })),

      // Charts Sidebar (3D Toggle)
      isChartSidebarOpen: false,
      setIsChartSidebarOpen: (isOpen) => set((state) => ({
        isChartSidebarOpen: isOpen,
        isAssetSidebarOpen: isOpen ? false : state.isAssetSidebarOpen,
        selectedChartId: isOpen ? null : state.selectedChartId
      })),

      // Placed 3D Models
      placedModels: [] as Array<{ id: string, name: string, path: string, position: [number, number, number], rotation: [number, number, number] }>,
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

      // Overlay Charts (3D Overlays)
      overlayCharts: [] as Array<{ id: string, type: string, title: string, x: number, y: number, w: number, h: number, config?: any }>,
      addOverlayChart: (chart) => set((state) => ({
        overlayCharts: [...state.overlayCharts, { ...chart, id: 'overlay-' + Date.now() }]
      })),
      removeOverlayChart: (id) => set((state) => ({
        overlayCharts: state.overlayCharts.filter(c => c.id !== id)
      })),
      updateOverlayChart: (id, updates) => set((state) => ({
        overlayCharts: state.overlayCharts.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      bringOverlayToFront: (id) => set((state) => {
        const index = state.overlayCharts.findIndex(c => c.id === id);
        if (index === -1) return state;
        const chart = state.overlayCharts[index];
        const remaining = state.overlayCharts.filter(c => c.id !== id);
        return { overlayCharts: [...remaining, chart] };
      }),
      findSafePosition: (id: string | null, x: number, y: number, w: number, h: number, containerW: number, containerH: number, externalCharts?: any[]) => {
        const state = useUIStore.getState();
        const sidebarWidth = 20; // Sidebar is adjacent in flexbox, not overlaying. Use small margin.
        const headerHeight = 20; // Smaller margin for the top.

        let safeX = Math.max(sidebarWidth, Math.min(containerW - w - 20, x));
        let safeY = Math.max(headerHeight, Math.min(containerH - h - 20, y));

        const charts = [...state.overlayCharts.filter(c => c.id !== id), ...(externalCharts || [])];

        const checkOverlap = (nx: number, ny: number) => {
          return charts.some(c => {
            const visualX = c.anchorX === 'right' ? (containerW - c.x - c.w) : c.x;
            const visualY = c.anchorY === 'bottom' ? (containerH - c.y - c.h) : c.y;
            return (
              nx < visualX + c.w &&
              nx + w > visualX &&
              ny < visualY + c.h &&
              ny + h > visualY
            );
          });
        };

        let attempts = 0;
        while (checkOverlap(safeX, safeY) && attempts < 50) {
          // Spiraling outward slightly to find next free spot instead of jumping to corner
          const step = 20;
          if (attempts < 10) safeX += step;
          else if (attempts < 20) safeY += step;
          else if (attempts < 30) safeX -= step;
          else safeY -= step;

          attempts++;
        }

        // Final Clamp
        safeX = Math.max(sidebarWidth, Math.min(containerW - w - 20, safeX));
        safeY = Math.max(headerHeight, Math.min(containerH - h - 20, safeY));

        return { x: safeX, y: safeY };
      },
      draggingChartPreview: null as { type: string, title: string, x: number, y: number } | null,
      setDraggingChartPreview: (preview: { type: string, title: string, x: number, y: number } | null) => set({ draggingChartPreview: preview }),

      // Dragging State
      draggingAsset: null as { name: string, path: string, position: [number, number, number] } | null,
      setDraggingAsset: (draggingAsset: { name: string, path: string, position: [number, number, number] } | null) => set({ draggingAsset }),

      // Selection
      selectedModelId: null as string | null,
      setSelectedModelId: (id: string | null) => set({ selectedModelId: id }),

      // Clipboard
      copiedModel: null as { name: string, path: string } | null,
      setCopiedModel: (copiedModel: { name: string, path: string } | null) => set({ copiedModel }),

      // DXF Data
      dxfData: null as any | null,
      setDxfData: (dxfData: any | null) => set({ dxfData }),

      // Active Tab
      activeTabId: null as string | null,
      setActiveTabId: (id: string | null) => set({ activeTabId: id }),

      // Eyedropper Mode (Tab Creation)
      isEyedropperActive: false,
      setIsEyedropperActive: (active: boolean) => set({ isEyedropperActive: active }),
      eyedropperSelection: null as { name: string, id: string } | null,
      setEyedropperSelection: (selection: { name: string, id: string } | null) => set({ eyedropperSelection: selection }),
      hoveredAsset: null as { name: string, id: string } | null,
      setHoveredAsset: (asset: { name: string, id: string } | null) => set({ hoveredAsset: asset }),

      // Chart Selection
      selectedChartId: null as string | null,
      setSelectedChartId: (id: string | null) => set({ selectedChartId: id }),

      // Visibility Toggles
      showLabels: true,
      setShowLabels: (showLabels: boolean) => set({ showLabels }),
      showCharts: true,
      setShowCharts: (showCharts: boolean) => set({ showCharts }),

      // Theme
      theme: "dark",
      setTheme: (theme: "light" | "dark") => set({ theme }),
    }),
    {
      name: "ui-store", // key in localStorage
      partialize: (state) => {
        const { dxfData, draggingAsset, copiedModel, selectedModelId, overlayCharts, selectedChartId, ...rest } = state;
        return rest;
      },
    }
  )
);