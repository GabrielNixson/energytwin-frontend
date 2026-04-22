import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  closestCorners,
  DragMoveEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import styles from "./Project.module.scss";
import ChartListSidebar from "@/components/ChartListSidebar/ChartListSidebar";
import Chart from "@/components/Chart/Chart";
import ChartConfigSidebar from "@/components/ChartConfigSidebar/ChartConfigSidebar";
import { useUIStore } from "@/store/useUIStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useParams } from "react-router-dom";
import DxfParser from "dxf-parser";
import { motion, AnimatePresence } from "framer-motion";
import { ChartData, ChartConfig } from "@/types/chart.types";

import Project3D from "./Project3D.tsx";
import AddTabModal from "./components/AddTabModal/AddTabModal.tsx";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import AssetSidebar from "@/components/AssetSidebar/AssetSidebar";
import AIChat from "@/components/AIChat/AIChat.tsx";
import ActionCenter from "./components/ActionCenter/ActionCenter";

const DEFAULT_CHART_CONFIG: ChartConfig = {
  showTooltips: true,
  showLegend: true,
  xAxisLabel: "Time",
  yAxisLabel: "Value",
  showGrid: true,
  fieldname: "",
  timerange: "-1h",
  function: "last"
};

const DraggableChart = ({
  chart,
  isEditMode,
  onResizeStart,
  onDelete,
  onClick,
  disabled = false,
  isResizing = false,
  isSelected = false,
}: {
  chart: ChartData;
  isEditMode: boolean;
  onResizeStart: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onClick?: (e: React.MouseEvent, id: string) => void;
  disabled?: boolean;
  isGhost?: boolean;
  isHidden?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: chart.id,
      data: { ...chart },
      disabled: !isEditMode || chart.isGhost || disabled || isResizing,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    gridColumn: `${chart.x + 1} / span ${chart.w}`,
    gridRow: `${chart.y + 1} / span ${chart.h}`,
    opacity: isDragging || !!chart.isHidden ? 0 : 1,
    pointerEvents: (isDragging || !!chart.isHidden ? "none" : "auto") as any,
    zIndex: isDragging ? 200 : isResizing || chart.isGhost ? 150 : 1,
    transition:
      isDragging || !!chart.isHidden || isResizing
        ? "none"
        : "grid-column 0.3s ease, grid-row 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease",
    boxShadow: isSelected
      ? "0 0 0 2px var(--accent), 0 10px 25px -5px rgba(0, 0, 0, 0.4)"
      : undefined,
  };

  // Split listeners to exclude the resize handle area
  const dragListeners =
    isEditMode && !chart.isGhost && !disabled && !isResizing ? listeners : {};

  const dragDownPos = useRef({ x: 0, y: 0 });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles["chart-item"]} ${chart.isGhost ? styles.ghost : ""} ${isResizing ? styles.resizing : ""}`}
      {...attributes}
      {...dragListeners}
      onMouseDown={(e) => {
        dragDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent bubbling to container background click
        const dist = Math.sqrt(
          Math.pow(e.clientX - dragDownPos.current.x, 2) +
          Math.pow(e.clientY - dragDownPos.current.y, 2)
        );
        if (dist < 15) { // Only select if it was a real click, not a drag (15px threshold)
          onClick?.(e, chart.id);
        }
      }}
    >
      <Chart
        id={chart.id}
        type={chart.type}
        title={chart.title}
        config={chart.config || DEFAULT_CHART_CONFIG}
        onResizeStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onResizeStart(chart.id, e);
        }}
        onDelete={() => onDelete(chart.id)}
        isEditMode={isEditMode}
      />
    </div>
  );
};

const DroppableChartContainer = ({
  children,
  isEditMode,
  onClick,
}: {
  children: React.ReactNode;
  isEditMode: boolean;
  onClick: () => void;
}) => {
  const { setNodeRef } = useDroppable({
    id: "chart-container",
  });

  return (
    <div
      ref={setNodeRef}
      id="chart-container"
      className={`${styles["chart-container"]} ${isEditMode ? styles["edit-mode"] : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Project = () => {
  const { projectID } = useParams<{ projectID: string }>();
  const { projects, updateProjectCharts, addChart, addTab, removeTab, updateTabName, getProject, removeChart, getAssets } =
    useProjectStore();
  const {
    isEditMode,
    is3DMode, setIs3DMode,
    setDxfData, setDraggingChartPreview, draggingChartPreview,
    isChartSidebarOpen, setIsChartSidebarOpen,
    isAssetSidebarOpen, setIsAssetSidebarOpen,
    findSafePosition,
    activeTabId, setActiveTabId,
    eyedropperSelection, setEyedropperSelection,
    setIsSidebarCollapsed,
    hoveredAsset,
    isEyedropperActive, setIsEyedropperActive,
    selectedChartId, setSelectedChartId,
    setSelectedModelId,
    overlayCharts
  } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);


  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track mouse for tooltip globally to avoid transform/layout issues
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    if (isEyedropperActive) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isEyedropperActive]);

  const [isTabModalOpen, setIsTabModalOpen] = useState(false);
  const [tabModalMode, setTabModalMode] = useState<{
    type: "add" | "rename";
    tabId?: string;
    initialName?: string;
    assetId?: string;
  }>({ type: "add" });
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result;
      if (typeof contents === "string") {
        try {
          const parser = new DxfParser();
          const dxf = parser.parseSync(contents);
          console.log("Parsed DXF:", dxf);
          setDxfData(dxf);
        } catch (err) {
          console.error("Error parsing DXF:", err);
          setConfirmConfig({
            isOpen: true,
            title: "Parsing Error",
            message: "Failed to parse DXF file. Please check if the file format is valid.",
            onConfirm: () => { },
            confirmText: "Okay",
            type: "danger"
          });
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  // Find the current project
  const currentProject = projects.find((p) => p.id === projectID);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateTabScroll = useCallback(() => {
    if (tabBarRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabBarRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    const el = tabBarRef.current;
    if (el) {
      updateTabScroll();
      el.addEventListener('scroll', updateTabScroll);
      window.addEventListener('resize', updateTabScroll);
      return () => {
        el.removeEventListener('scroll', updateTabScroll);
        window.removeEventListener('resize', updateTabScroll);
      };
    }
  }, [updateTabScroll, currentProject?.tabs]);

  const handleTabBarWheel = (e: React.WheelEvent) => {
    if (tabBarRef.current) {
      tabBarRef.current.scrollLeft += e.deltaY;
      updateTabScroll();
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabBarRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [charts, setCharts] = useState<ChartData[]>([]);

  // Fetch project details on mount or ID change
  useEffect(() => {
    // console.log("projectID: "+projectID);

    if (projectID) {
      getProject(projectID);
      getAssets(projectID);
    }
  }, [projectID, getProject, getAssets]);

  // Ensure activeTabId is valid and handle ID transitions (temp_ -> real_id)
  useEffect(() => {
    if (currentProject) {
      // 1. If project has NO tabs, ensure activeTabId is null
      if (currentProject.tabs.length === 0) {
        setActiveTabId(null);
        return;
      }

      // 2. Ensure current activeTabId exists in the project's tabs OR is explicitly null
      const activeTabExists = currentProject.tabs.find((t) => t.id === activeTabId);

      if (!activeTabExists) {
        // If we were on a temp tab, maybe it got promoted to a real one with a new ID?
        if (activeTabId?.startsWith('temp_')) {
          setActiveTabId(currentProject.tabs[currentProject.tabs.length - 1]?.id || null);
        } else {
          setActiveTabId(currentProject.tabs[0]?.id || null);
        }
      }
    }
  }, [currentProject?.tabs, activeTabId, projectID, addTab]);

  // Collapse sidebar automatically when entering a project
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, [setIsSidebarCollapsed]);

  // Handle Eyedropper selection -> Open Tab Modal
  useEffect(() => {
    if (eyedropperSelection) {
      setTabModalMode({
        type: "add",
        initialName: eyedropperSelection.name,
        assetId: eyedropperSelection.id
      });
      setIsTabModalOpen(true);
      // selection is cleared in handleTabModalSubmit or cancel
    }
  }, [eyedropperSelection]);

  const activeTab = useMemo(() => {
    return currentProject?.tabs.find((t) => t.id === activeTabId);
  }, [currentProject, activeTabId]);

  // Resolve temp->real tab id transitions for write operations.
  const resolvedActiveTabId = useMemo(() => {
    if (!currentProject?.tabs?.length) return null;
    if (activeTabId && currentProject.tabs.some((t) => t.id === activeTabId)) return activeTabId;
    if (activeTabId?.startsWith("temp_")) return currentProject.tabs[currentProject.tabs.length - 1]?.id || null;
    return currentProject.tabs[0]?.id || null;
  }, [currentProject, activeTabId]);

  // Initialize charts from store based on active tab
  useEffect(() => {
    if (activeTab?.charts) {
      setCharts(activeTab.charts);
    } else {
      setCharts([]);
    }
  }, [activeTab]);

  // Helper to update local and store
  const saveCharts = useCallback(
    (newCharts: ChartData[]) => {
      setCharts(newCharts);
      if (projectID && resolvedActiveTabId) {
        updateProjectCharts(projectID, resolvedActiveTabId, newCharts);
      }
    },
    [projectID, resolvedActiveTabId, updateProjectCharts],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<Partial<ChartData> | null>(
    null,
  );

  const isAutoAlign = true; // Enabled by default, UI toggle removed per request

  // Position of the item currently being dragged (in grid units)
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Resizing state
  const [resizingChartId, setResizingChartId] = useState<string | null>(null);

  const handleDeselectAll = useCallback(() => {
    setSelectedChartId(null);
    setIsChartSidebarOpen(false);
    setIsAssetSidebarOpen(false);
    setIsEyedropperActive(false);
    setEyedropperSelection(null);
    setSelectedModelId(null);
    setActiveTabId(null);
  }, [setSelectedChartId, setIsChartSidebarOpen, setIsAssetSidebarOpen, setIsEyedropperActive, setEyedropperSelection, setSelectedModelId, setActiveTabId]);

  const [gridMetrics, setGridMetrics] = useState<{
    colWidth: number;
    rowHeight: number;
  } | null>(null);
  const initialResizeData = useRef<{
    mousePos: { x: number; y: number };
    span: { w: number; h: number };
  } | null>(null);

  const checkOverlap = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  };

  const compactLayout = useCallback(
    (currentCharts: ChartData[]): ChartData[] => {
      // Full Grid Reflow: Organize into clean rows of 3 (4-columns each)
      const sorted = [...currentCharts].sort((a, b) => a.y * 12 + a.x - (b.y * 12 + b.x));

      return sorted.map((item, index) => {
        const col = (index % 3) * 4;
        const row = Math.floor(index / 3) * 2;
        return {
          ...item,
          // If the item had unique 2D coords before, we reuse the row/col logic but ensure they stay aligned
          x: col,
          y: row,
          w: 4,
          h: 2
        };
      });
    },
    [],
  );

  const resolveCollisions = useCallback(
    (
      moved: { id: string; x: number; y: number; w: number; h: number },
      currentCharts: ChartData[],
    ): ChartData[] => {
      let newCharts = currentCharts.map((c) => ({ ...c }));
      const idx = newCharts.findIndex((c) => c.id === moved.id);
      if (idx !== -1) {
        newCharts[idx] = {
          ...newCharts[idx],
          x: moved.x,
          y: moved.y,
          w: moved.w,
          h: moved.h,
        };
      }
      let hasChanges = true;
      let iterations = 0;
      while (hasChanges && iterations < 50) {
        hasChanges = false;
        iterations++;
        newCharts.sort((a, b) => a.y - b.y || a.x - b.x);
        for (let i = 0; i < newCharts.length; i++) {
          const chartA = newCharts[i];
          for (let j = 0; j < newCharts.length; j++) {
            if (i === j) continue;
            const chartB = newCharts[j];
            if (checkOverlap(chartA, chartB)) {
              let toMoveIdx = -1;
              if (chartA.id === moved.id) {
                toMoveIdx = j;
              } else if (chartB.id === moved.id) {
                toMoveIdx = i;
              } else {
                toMoveIdx = chartA.y <= chartB.y ? j : i;
              }
              if (toMoveIdx !== -1) {
                const otherIdx = toMoveIdx === i ? j : i;
                const shift =
                  newCharts[otherIdx].y +
                  newCharts[otherIdx].h -
                  newCharts[toMoveIdx].y;
                if (shift > 0) {
                  newCharts[toMoveIdx].y += shift;
                  hasChanges = true;
                }
              }
            }
          }
        }
      }
      return isAutoAlign ? compactLayout(newCharts) : newCharts;
    },
    [isAutoAlign, compactLayout],
  );

  const handleUpdateChart = useCallback(
    (id: string, updates: Partial<ChartData>) => {
      const updated = charts.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      );
      if (updates.w || updates.h || updates.x || updates.y) {
        const moved = updated.find((c) => c.id === id)!;
        const finalized = resolveCollisions(moved, updated);
        saveCharts(finalized);
      } else {
        saveCharts(updated);
      }
    },
    [charts, saveCharts, resolveCollisions],
  );

  // Effect: When an asset is selected via Eyedropper in 3D, open the Add Tab modal
  useEffect(() => {
    if (eyedropperSelection) {
      setTabModalMode({
        type: "add",
        initialName: `${eyedropperSelection.name}`
      });
      setIsTabModalOpen(true);
      // We clear this selection only after the modal is handled or closed
    }
  }, [eyedropperSelection, setEyedropperSelection]);

  // Effect: Auto-align charts when switching from 3D to 2D for a clean dashboard
  const prevIs3DMode = useRef(is3DMode);
  useEffect(() => {
    if (prevIs3DMode.current && !is3DMode) {
      // Switched from 3D to 2D
      saveCharts(compactLayout(charts));
    }
    prevIs3DMode.current = is3DMode;
  }, [is3DMode, charts, compactLayout, saveCharts]);

  const handleRemoveChart = useCallback(
    (id: string) => {
      let updated = charts.filter((c) => c.id !== id);
      if (isAutoAlign) {
        updated = compactLayout(updated);
      }

      setCharts(updated);
      if (projectID && resolvedActiveTabId) {
        removeChart(projectID, resolvedActiveTabId, id);
      }

      if (selectedChartId === id) setSelectedChartId(null);
    },
    [charts, removeChart, projectID, resolvedActiveTabId, selectedChartId, isAutoAlign, compactLayout],
  );

  // Calculate the preview layout in real-time (for dragging)
  const previewCharts = useMemo(() => {
    let workingCharts = [...charts];

    // Apply drag preview if dragging
    if (activeId && dragPosition) {
      const isFromSidebar = activeId.startsWith("sidebar-");
      const w = activeChart?.w ?? 4;
      const h = activeChart?.h ?? 2;
      // Clamp X to stay within 12 columns
      const x = Math.max(0, Math.min(12 - w, dragPosition.x));
      const y = dragPosition.y;

      if (isFromSidebar) {
        const movedItem = {
          id: "preview-ghost",
          type: activeChart?.type ?? "bar",
          title: activeChart?.title ?? "New Chart",
          x,
          y,
          w,
          h,
          isGhost: true,
          config: DEFAULT_CHART_CONFIG,
        };
        workingCharts = [...workingCharts, movedItem] as ChartData[];
        // Don't resolve collisions during sidebar drag to prevent confusing movement
        // workingCharts = resolveCollisions(movedItem, workingCharts);
      } else {
        // Sorting items
        const originalChart = charts.find((c) => c.id === activeId);
        if (originalChart) {
          const movedItem = {
            ...originalChart,
            id: "preview-ghost",
            x,
            y,
            isGhost: true,
          };
          // Only run collisions on others
          const others = charts.filter((c) => c.id !== activeId);
          workingCharts = resolveCollisions(movedItem, [...others, movedItem]);

          // Add back the original chart but make it COMPLETELY invisible
          // (prevents double-tap issues and visual duplication)
          workingCharts.push({
            ...originalChart,
            isGhost: false,
            isHidden: true,
          });
        }
      }
    }

    return workingCharts;
  }, [activeId, dragPosition, charts, activeChart, resolveCollisions]);

  const updateGridMetrics = useCallback(() => {
    const container = document.getElementById("chart-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 40;
    const gap = 20;
    const availableWidth = rect.width - 2 * padding;
    const colWidth = (availableWidth - 11 * gap) / 12;

    // Calculate proportional rowHeight based on colWidth, capped at 140px and flooring at 120px
    const calculatedRowHeight = Math.max(Math.min(colWidth * 1.5, 140), 120);

    // Set CSS variable for the grid
    container.style.setProperty("--row-height", `${calculatedRowHeight}px`);

    // Update metrics for dragging/resizing logic (include gap in rowHeight for snap logic)
    setGridMetrics({ colWidth, rowHeight: calculatedRowHeight + gap });
  }, []);

  useEffect(() => {
    updateGridMetrics();
    window.addEventListener("resize", updateGridMetrics);
    return () => window.removeEventListener("resize", updateGridMetrics);
  }, [updateGridMetrics]);

  useEffect(() => {
    // Update metrics when edit mode toggles (sidebar collapses/expands)
    const timer = setTimeout(updateGridMetrics, 350);
    return () => clearTimeout(timer);
  }, [isEditMode, updateGridMetrics]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Check if the event target is the resize handle
    if (event.activatorEvent.target instanceof HTMLElement) {
      const isResizeHandle = event.activatorEvent.target.closest(
        "[data-resize-handle]",
      );
      if (isResizeHandle) {
        return;
      }
    }

    setActiveId(active.id as string);

    if (active.data.current?.fromSidebar) {
      const chartType = active.data.current.type;
      setActiveChart({
        type: chartType,
        title: active.data.current.label,
        w: 4,
        h: ["progressBar", "billing"].includes(chartType)
          ? 1
          : chartType === "circularProgress"
            ? 2
            : 2,
      });
    } else {
      const chart = charts.find((c) => c.id === active.id);
      if (chart) setActiveChart(chart);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    // 3D Overlay Live Preview
    if (is3DMode && active.id.toString().startsWith("sidebar-")) {
      const startE = event.activatorEvent as MouseEvent;
      if (startE) {
        const absoluteX = startE.clientX + event.delta.x;
        const absoluteY = startE.clientY + event.delta.y;

        const overId = event.over?.id;
        const overRect = event.over?.rect;

        if (overId === "3d-overlay-area" && overRect) {
          const relX = absoluteX - overRect.left;
          const relY = absoluteY - overRect.top;

          setDraggingChartPreview({
            type: active.data.current?.type,
            title: active.data.current?.label,
            x: relX - 250,
            y: relY - 175
          });
        } else {
          // Fallback for screen-based if not over the area
          setDraggingChartPreview({
            type: active.data.current?.type,
            title: active.data.current?.label,
            x: absoluteX - 250,
            y: absoluteY - 175
          });
        }
      }
    }

    const container = document.getElementById("chart-container");
    if (!container || !gridMetrics || !over || over.id !== "chart-container") {
      setDragPosition(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const padding = 40;
    const topPadding = 80;

    let relCenterX: number;
    let relCenterY: number;

    if (active.id.toString().startsWith("sidebar-")) {
      // New items: Use pointer coordinates because the source rect is tiny
      const pointerEvent = event.activatorEvent as PointerEvent;
      const mouseX = pointerEvent.clientX + (event.delta.x || 0);
      const mouseY = pointerEvent.clientY + (event.delta.y || 0);

      relCenterX = mouseX - containerRect.left;
      relCenterY = mouseY - containerRect.top + container.scrollTop;
    } else {
      // Sorting items: Use the translated rect position
      const rect = active.rect.current.translated;
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      relCenterX = centerX - containerRect.left;
      relCenterY = centerY - containerRect.top + container.scrollTop;
    }

    const colWidth = gridMetrics.colWidth + 20;
    const rowHeight = gridMetrics.rowHeight;

    const chartW = activeChart?.w ?? 4;
    const chartH = activeChart?.h ?? 2;

    // Snap based on relativistic center
    const targetX = Math.round((relCenterX - padding) / colWidth - chartW / 2);
    const targetY = Math.max(
      0,
      Math.round((relCenterY - topPadding) / rowHeight - chartH / 2),
    );

    const coords = {
      x: Math.max(0, Math.min(12 - chartW, targetX)),
      y: targetY,
    };

    // Stability check: Only update if we've moved significantly within the grid
    // to prevent "jitter" when the mouse is on a boundary
    if (
      !dragPosition ||
      Math.abs(dragPosition.x - coords.x) > 0 ||
      Math.abs(dragPosition.y - coords.y) > 0
    ) {
      setDragPosition(coords);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === "chart-container" && dragPosition) {
      const isFromSidebar = active.id.toString().startsWith("sidebar-");

      // Get the charts from preview and filter out the hidden original (if sorting)
      const chartsForDrop = previewCharts.filter((c) => !c.isHidden);
      let finalLayout: ChartData[] = [];

      if (isFromSidebar) {
        // REJECT sidebar drops in 2D mode as per new requirements
        if (!is3DMode) return;

        const ghost = chartsForDrop.find((c) => c.id === "preview-ghost");
        if (ghost) {
          const newChart = {
            ...ghost,
            id: `chart-${Date.now()}`,
            isGhost: false,
            // Default 3D position if we were in 3D (though we check is3DMode above)
            x3d: 400,
            y3d: 200,
            w3d: 400,
            h3d: 300
          } as ChartData;

          const withNewChart = chartsForDrop.map((c) =>
            c.id === "preview-ghost" ? newChart : c,
          );

          finalLayout = resolveCollisions(newChart, withNewChart);

          if (projectID && resolvedActiveTabId) {
            addChart(projectID, resolvedActiveTabId, newChart);
          }
        }
      } else {
        // For sorting, previewCharts already resolved collisions.
        // Just map the ghost to the actual ID.
        finalLayout = chartsForDrop.map((c) => {
          if (c.id === "preview-ghost") {
            return {
              ...c,
              id: active.id.toString(),
              isGhost: false,
            };
          }
          return { ...c, isGhost: false };
        });
      }

      saveCharts(finalLayout);
    } else if ((over && over.id === "3d-overlay-area" && event.activatorEvent) || (is3DMode && active.id.toString().startsWith("sidebar-") && draggingChartPreview)) {
      if (active.id.toString().startsWith("sidebar-")) {
        const chartType = active.data.current?.type;
        const label = active.data.current?.label;

        const rect = event.over?.rect;
        const fallbackContainer = document.querySelector('[class*="three-container"]') as HTMLElement | null;
        const fallbackRect = fallbackContainer?.getBoundingClientRect();

        let relativeX = draggingChartPreview?.x ?? 0;
        let relativeY = draggingChartPreview?.y ?? 0;
        let containerW = rect?.width ?? fallbackRect?.width ?? window.innerWidth;
        let containerH = rect?.height ?? fallbackRect?.height ?? window.innerHeight;

        if (event.activatorEvent) {
          const e = event.activatorEvent as MouseEvent;
          const absoluteX = e.clientX + event.delta.x;
          const absoluteY = e.clientY + event.delta.y;

          if (rect) {
            // Relative to the 3D overlay container
            relativeX = absoluteX - rect.left;
            relativeY = absoluteY - rect.top;
          } else if (fallbackRect) {
            relativeX = absoluteX - fallbackRect.left;
            relativeY = absoluteY - fallbackRect.top;
          }
        }

        const targetTab = currentProject?.tabs.find((t) => t.id === resolvedActiveTabId);
        const currentChartsList = targetTab?.charts || [];

        const safePos = findSafePosition(
          null,
          relativeX - 250,
          relativeY - 175,
          500, 350,
          containerW, containerH,
          currentChartsList // Pass existing charts to avoid overlap
        );

        // Find a free spot in a 3-column-wide 2D grid (4 span each)
        // Use activeTab.charts for the latest source of truth to avoid stale closures
        const findBetterSpot = () => {
          const currentChartsList = targetTab?.charts || [];
          let foundX = 0;
          let foundY = 0;
          let spotFound = false;

          for (let row = 0; row < 100 && !spotFound; row++) {
            for (let col = 0; col <= 8; col += 4) {
              const isOccupied = currentChartsList.some(c =>
                (col < c.x + c.w && col + 4 > c.x) &&
                (row < c.y + c.h && row + 2 > c.y)
              );
              if (!isOccupied) {
                foundX = col;
                foundY = row;
                spotFound = true;
                break;
              }
            }
          }
          return { x: foundX, y: foundY };
        };

        const spot = findBetterSpot();

        const newChart: ChartData = {
          id: `chart-${Date.now()}`,
          type: chartType,
          title: label,
          x: spot.x,
          y: spot.y,
          w: 4,
          h: 2,
          x3d: safePos.x,
          y3d: safePos.y,
          w3d: 500,
          h3d: 350,
          config: DEFAULT_CHART_CONFIG
        };

        if (projectID && resolvedActiveTabId) {
          addChart(projectID, resolvedActiveTabId, newChart);
        }
      }
    }

    setDraggingChartPreview(null);
    setDragPosition(null);
    setActiveId(null);
    setActiveChart(null);
  };

  const handleDragCancel = () => {
    setDraggingChartPreview(null);
    setDragPosition(null);
    setActiveId(null);
    setActiveChart(null);
  };

  const handleResizeStart = (id: string, e: React.MouseEvent) => {
    // We handle this carefully as a PointerEvent
    const pe = e as unknown as React.PointerEvent;
    pe.preventDefault();
    pe.stopPropagation();

    const chart = charts.find((c) => c.id === id);
    if (chart) {
      setResizingChartId(id);
      initialResizeData.current = {
        mousePos: { x: pe.clientX, y: pe.clientY },
        span: { w: chart.w, h: chart.h },
      };

      // Capture pointer to ensure we get up/move even outside element
      if (pe.currentTarget instanceof HTMLElement) {
        pe.currentTarget.setPointerCapture(pe.pointerId);
      }
    }
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizingChartId || !initialResizeData.current || !gridMetrics)
        return;

      const container = document.getElementById("chart-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const colWidth = gridMetrics.colWidth;
      const rowHeight = gridMetrics.rowHeight;

      // Auto-scroll logic during resizing
      const scrollThreshold = 80;
      if (e.clientY > rect.bottom - scrollThreshold) {
        container.scrollBy({ top: 15, behavior: "auto" });
      } else if (
        e.clientY < rect.top + scrollThreshold &&
        container.scrollTop > 0
      ) {
        container.scrollBy({ top: -15, behavior: "auto" });
      }

      const dx = e.clientX - initialResizeData.current.mousePos.x;
      const dy = e.clientY - initialResizeData.current.mousePos.y;

      const dw = Math.floor(dx / (colWidth + 20) + 0.5);
      const dh = Math.floor(dy / rowHeight + 0.5);

      setCharts((prev) => {
        const chart = prev.find((c) => c.id === resizingChartId);
        if (!chart) return prev;

        // Enforce minimum width of 300px
        const minW = Math.ceil(300 / (colWidth + 20));
        let newW = Math.min(
          12,
          Math.max(minW, initialResizeData.current!.span.w + dw),
        );
        let newH = Math.max(1, initialResizeData.current!.span.h + dh);

        if (chart.x + newW > 12) newW = 12 - chart.x;

        if (chart.w === newW && chart.h === newH) return prev;

        const updated = prev.map((c) =>
          c.id === resizingChartId ? { ...c, w: newW, h: newH } : c,
        );
        const moved = updated.find((c) => c.id === resizingChartId)!;
        const finalCharts = resolveCollisions(moved, updated);
        saveCharts(finalCharts);
        return finalCharts;
      });
    },
    [resizingChartId, resolveCollisions, saveCharts, gridMetrics],
  );

  const isResizingDoneRef = useRef(false);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (resizingChartId) {
        isResizingDoneRef.current = true;
        setTimeout(() => {
          isResizingDoneRef.current = false;
        }, 100);

        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setResizingChartId(null);
        initialResizeData.current = null;
      }
    },
    [resizingChartId],
  );

  useEffect(() => {
    if (resizingChartId) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizingChartId, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDragCancel();
        setResizingChartId(null);
        initialResizeData.current = null;
        handleDeselectAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeselectAll]);

  const onChartClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid background click deselecting everything
    if (!isEditMode || isResizingDoneRef.current || resizingChartId) return;
    setSelectedChartId(id);
  };


  const handleTabModalSubmit = (name: string) => {
    // Check for duplicate names
    const isDuplicate = currentProject?.tabs.some(t =>
      t.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      t.id !== tabModalMode.tabId
    );
    if (isDuplicate) {
      setConfirmConfig({
        isOpen: true,
        title: "Duplicate Tab Name",
        message: `A tab named "${name}" already exists. Please choose a different name.`,
        onConfirm: () => { },
        confirmText: "Okay",
        type: "warning"
      });
      return;
    }

    // Check for duplicate asset linking
    const targetAssetId = tabModalMode.assetId || eyedropperSelection?.id;
    if (targetAssetId) {
      const existingLinkTab = currentProject?.tabs.find(t => t.assetId === targetAssetId);
      if (existingLinkTab && existingLinkTab.id !== tabModalMode.tabId) {
        setConfirmConfig({
          isOpen: true,
          title: "Asset Already Linked",
          message: `This asset is already linked to the "${existingLinkTab.name}" tab. An asset can only be linked to one tab.`,
          onConfirm: () => { },
          confirmText: "Okay",
          type: "warning"
        });
        return;
      }
    }

    if (tabModalMode.type === "add" && projectID) {
      const newTabId = 'temp_' + Math.random().toString(36).substring(2, 9);
      // Ensure we use the assetId from the modal state OR the current selection as fallback
      const targetAssetId = tabModalMode.assetId || eyedropperSelection?.id;
      addTab(projectID, name, newTabId, targetAssetId);
      setActiveTabId(newTabId); // Switch to the new tab!
      setEyedropperSelection(null); // Clear selection after successful add
    } else if (
      tabModalMode.type === "rename" &&
      projectID &&
      tabModalMode.tabId
    ) {
      updateTabName(projectID, tabModalMode.tabId, name);
    }
    setIsTabModalOpen(false);
    setEyedropperSelection(null); // Clear selection if cancelled/submitted
  };

  const handleRemoveTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = currentProject?.tabs.find(t => t.id === tabId);
    setConfirmConfig({
      isOpen: true,
      title: "Remove Tab",
      message: `Are you sure you want to remove the tab "${tab?.name || 'this tab'}"? all charts in it will be removed.`,
      confirmText: "Remove Tab",
      type: "danger",
      onConfirm: () => {
        if (projectID) {
          removeTab(projectID, tabId);
        }
      }
    });
  };

  const handleRenameTab = (tabId: string, currentName: string) => {
    setTabModalMode({ type: "rename", tabId, initialName: currentName });
    setIsTabModalOpen(true);
  };

  const maxGridRow = useMemo(() => {
    const lowestPoint = previewCharts.reduce(
      (max, c) => Math.max(max, c.y + c.h),
      0,
    );
    return isEditMode ? Math.max(lowestPoint + 20, 40) : lowestPoint + 2;
  }, [previewCharts, isEditMode]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={{
        acceleration: 10,
        threshold: { x: 100, y: 100 },
      }}
    >
      <div className={styles["project-container"]}>
        <div className={styles["top-hud"]}>
          <div className={`${styles["tab-bar-wrapper"]} ${(isChartSidebarOpen || isAssetSidebarOpen) ? styles.shifted : ""}`}>
            {showLeftArrow && (
              <div className={`${styles["scroll-indicator"]} ${styles.left}`} onClick={() => scrollTabs('left')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </div>
            )}

            <div
              className={`${styles["tab-bar"]} ${showLeftArrow ? styles["has-left-arrow"] : ""} ${showRightArrow ? styles["has-right-arrow"] : ""}`}
              ref={tabBarRef}
              onWheel={handleTabBarWheel}
            >
              {currentProject?.tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`${styles["tab-item"]} ${activeTabId === tab.id ? styles.active : ""}`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setActiveTabId(tab.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTabId(tab.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleRenameTab(tab.id, tab.name);
                  }}
                >
                  <span className={styles["tab-name"]}>
                    {tab.assetId && <span className={styles["link-icon"]} title="Linked to 3D Asset">🔗</span>}
                    {tab.name}
                  </span>
                  {isEditMode && currentProject?.tabs.length > 1 && (
                    <button
                      className={styles["remove-tab-btn"]}
                      onClick={(e) => handleRemoveTab(e, tab.id)}
                      title="Delete Tab"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {showRightArrow && (
              <div className={`${styles["scroll-indicator"]} ${styles.right}`} onClick={() => scrollTabs('right')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            )}
          </div>

          <motion.div
            className={styles["tools-container"]}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.3 }}
          >
            <div className={styles["mode-toggle-group"]}>
              <button
                className={`${styles["btn"]} ${!is3DMode ? styles.active : ""}`}
                onClick={() => setIs3DMode(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                2D Dashboard
              </button>
              <button
                className={`${styles["btn"]} ${is3DMode ? styles.active : ""}`}
                onClick={() => setIs3DMode(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                3D Energy Twin
              </button>
            </div>

            <div className={styles["divider"]} />

            <ActionCenter />

            {is3DMode && (
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".dxf"
                onChange={handleFileChange}
              />
            )}
          </motion.div>
        </div>

        <div className={styles["main-workspace"]}>

          {/* Sidebars in flex flow */}
          <ChartListSidebar
            isOpen={isChartSidebarOpen}
          />
          <AssetSidebar
            isOpen={isAssetSidebarOpen}
          />

          <AnimatePresence mode="wait">
            {!is3DMode ? (
              <motion.div
                key="2d-view"
                layout
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <DroppableChartContainer
                  isEditMode={isEditMode}
                  onClick={handleDeselectAll}
                >
                  {previewCharts.map((chart) => (
                    <DraggableChart
                      key={chart.id}
                      chart={chart}
                      isEditMode={isEditMode}
                      onResizeStart={handleResizeStart}
                      onDelete={handleRemoveChart}
                      onClick={onChartClick}
                      isSelected={selectedChartId === chart.id}
                      disabled={
                        resizingChartId !== null && chart.id !== resizingChartId
                      }
                      isResizing={resizingChartId === chart.id}
                    />
                  ))}
                  {/* Spacer to provide infinite scroll buffer */}
                  <div
                    style={{
                      gridRowStart: maxGridRow,
                      gridColumn: "1 / span 12",
                      height: "1px",
                      pointerEvents: "none",
                    }}
                  />
                </DroppableChartContainer>
              </motion.div>
            ) : (
              <motion.div
                key="3d-view"
                layout
                initial={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className={styles["three-container"]}
                onClick={() => setSelectedChartId(null)}
              >
                <Suspense
                  fallback={
                    <div style={{ color: "white" }}>Loading 3D Scene...</div>
                  }
                >
                  <Project3D />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(() => {
              if (!(isEditMode || is3DMode) || !selectedChartId) return null;

              // Find the chart in either the active tab's charts or global overlay charts
              const allAvailableCharts = [...charts, ...overlayCharts];
              const foundChart = allAvailableCharts.find(c => c.id === selectedChartId);

              if (!foundChart) return null;

              return (
                <motion.div
                  key="config-sidebar"
                  layout
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  style={{ height: '100%', zIndex: 1100, flexShrink: 0, overflow: 'hidden' }}
                >
                  <ChartConfigSidebar
                    chart={{
                      ...foundChart,
                      config: foundChart.config || DEFAULT_CHART_CONFIG
                    }}
                    onClose={() => setSelectedChartId(null)}
                    onUpdate={handleUpdateChart}
                  />
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      <DragOverlay
        modifiers={activeId?.startsWith("sidebar-") ? [snapCenterToCursor] : []}
      >
        {activeId ? (
          <div
            className={styles["drag-overlay"]}
            style={{
              width:
                activeId.startsWith("sidebar-") || !gridMetrics
                  ? "300px"
                  : `${activeChart?.w ? activeChart.w * gridMetrics.colWidth + (activeChart.w - 1) * 20 : 300}px`,
              height:
                activeId.startsWith("sidebar-") || !gridMetrics
                  ? "200px"
                  : `${(activeChart?.h ?? 3) * 170 - 20}px`,
            }}
          >
            {activeChart && activeChart.type && activeChart.title ? (
              <Chart
                id="overlay"
                type={activeChart.type}
                title={activeChart.title}
                config={activeChart.config || DEFAULT_CHART_CONFIG}
                isEditMode={true}
              />
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
      <AddTabModal
        isOpen={isTabModalOpen}
        onClose={() => {
          setIsTabModalOpen(false);
          setIsEyedropperActive(false);
          setEyedropperSelection(null);
        }}
        onSubmit={handleTabModalSubmit}
        initialValue={tabModalMode.initialName}
        title={tabModalMode.type === "add" ? "Add New Tab" : "Rename Tab"}
        existingNames={currentProject?.tabs.map(t => t.name)}
      />

      {/* Hide Chat in 3D Mode */}
      {!is3DMode && (
        <AIChat
          projectId={projectID}
          tabId={activeTabId}
        />
      )}

      {/* Asset Sidebar moved to unified layer above */}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />

      {/* Global Asset Hover Tooltip (Eyedropper Mode) */}
      {isEyedropperActive && hoveredAsset && typeof document !== "undefined" && createPortal(
        <div
          className={styles["eyedropper-tooltip"]}
          style={{
            left: mousePos.x,
            top: mousePos.y,
            position: 'fixed'
          }}
        >
          Select: {hoveredAsset.name}
        </div>,
        document.body
      )}
    </DndContext>
  );
};

export default Project;
