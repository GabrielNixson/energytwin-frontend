import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react"
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
} from "@dnd-kit/core"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"

import styles from "./Project.module.scss"
import ChartListSidebar from "@/components/ChartListSidebar/ChartListSidebar"
import Chart from "@/components/Chart/Chart"
import ChartConfigSidebar from '@/components/ChartConfigSidebar/ChartConfigSidebar';
import { useUIStore } from "@/store/useUIStore"
import { useProjectStore } from "@/store/useProjectStore"
import { useParams } from "react-router-dom"
import DxfParser from 'dxf-parser';
import { motion, AnimatePresence } from "framer-motion"
import { ChartData, ChartConfig } from "@/types/chart.types"

import Project3D from "./Project3D.tsx"

const DEFAULT_CHART_CONFIG: ChartConfig = {
    showTooltips: true,
    showLegend: true,
    xAxisLabel: 'Time',
    yAxisLabel: 'Value',
    showGrid: true,
};

const DraggableChart = ({
    chart,
    isEditMode,
    onResizeStart,
    onDelete,
    onClick,
    disabled = false,
    isResizing = false,
    isSelected = false
}: {
    chart: ChartData,
    isEditMode: boolean,
    onResizeStart: (id: string, e: React.MouseEvent) => void,
    onDelete: (id: string) => void,
    onClick?: (id: string) => void,
    disabled?: boolean,
    isGhost?: boolean;
    isHidden?: boolean;
    isResizing?: boolean;
    isSelected?: boolean;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: chart.id,
        data: { ...chart },
        disabled: !isEditMode || chart.isGhost || disabled || isResizing
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        gridColumn: `${chart.x + 1} / span ${chart.w}`,
        gridRow: `${chart.y + 1} / span ${chart.h}`,
        opacity: isDragging || !!chart.isHidden ? 0 : 1,
        pointerEvents: (isDragging || !!chart.isHidden ? 'none' : 'auto') as any,
        zIndex: isDragging ? 200 : (isResizing || chart.isGhost) ? 150 : 1,
        transition: isDragging || !!chart.isHidden || isResizing ? 'none' : 'grid-column 0.3s ease, grid-row 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease',
        boxShadow: isSelected ? '0 0 0 2px #917efc, 0 10px 25px -5px rgba(0, 0, 0, 0.4)' : undefined,
    };

    // Split listeners to exclude the resize handle area
    const dragListeners = isEditMode && !chart.isGhost && !disabled && !isResizing ? listeners : {};

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles["chart-item"]} ${chart.isGhost ? styles.ghost : ""} ${isResizing ? styles.resizing : ""}`}
            {...attributes}
            {...dragListeners}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(chart.id);
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

const DroppableChartContainer = ({ children, isEditMode, onClick }: { children: React.ReactNode, isEditMode: boolean, onClick: () => void }) => {
    const { setNodeRef } = useDroppable({
        id: 'chart-container',
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
    const { projects, updateProjectCharts } = useProjectStore();
    const { isEditMode, setIsEditMode, is3DMode, setIs3DMode, setDxfData } = useUIStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const contents = event.target?.result;
            if (typeof contents === 'string') {
                try {
                    const parser = new DxfParser();
                    const dxf = parser.parseSync(contents);
                    console.log('Parsed DXF:', dxf);
                    setDxfData(dxf);
                } catch (err) {
                    console.error('Error parsing DXF:', err);
                    alert("Failed to parse DXF file.");
                } finally {
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };

    // Find the current project
    const currentProject = projects.find(p => p.id === projectID);

    const [charts, setCharts] = useState<ChartData[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Initialize charts from store
    useEffect(() => {
        if (currentProject?.charts) {
            setCharts(currentProject.charts);
        }
    }, [currentProject]);

    // Helper to update local and store
    const saveCharts = useCallback((newCharts: ChartData[]) => {
        setCharts(newCharts);
        if (projectID) {
            updateProjectCharts(projectID, newCharts);
        }
    }, [projectID, updateProjectCharts]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeChart, setActiveChart] = useState<Partial<ChartData> | null>(null);

    // Auto-align state
    const [isAutoAlign, setIsAutoAlign] = useState(false);

    // Position of the item currently being dragged (in grid units)
    const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null);

    // Resizing state
    const [resizingChartId, setResizingChartId] = useState<string | null>(null);
    // State for selected chart (to open right sidebar)
    const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

    const [gridMetrics, setGridMetrics] = useState<{ colWidth: number, rowHeight: number } | null>(null);
    const initialResizeData = useRef<{
        mousePos: { x: number, y: number };
        span: { w: number, h: number };
    } | null>(null);



    const checkOverlap = (a: { x: number, y: number, w: number, h: number }, b: { x: number, y: number, w: number, h: number }) => {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    };

    const compactLayout = useCallback((currentCharts: ChartData[], movedId?: string): ChartData[] => {
        const movedItem = currentCharts.find(c => c.id === movedId || c.id === 'preview-ghost');
        const others = currentCharts
            .filter(c => c.id !== movedId && c.id !== 'preview-ghost')
            .sort((a, b) => a.y - b.y || a.x - b.x);

        const result: ChartData[] = [];
        const isAreaOccupied = (x: number, y: number, w: number, h: number, items: ChartData[]) => {
            return items.some(item =>
                x < item.x + item.w &&
                x + w > item.x &&
                y < item.y + item.h &&
                y + h > item.y
            );
        };

        if (movedItem) {
            result.push({ ...movedItem });
        }

        for (const item of others) {
            let newY = 0;
            // Gravity: Move UP as far as possible without overlap, maintaining the original X
            while (isAreaOccupied(item.x, newY, item.w, item.h, result)) {
                newY++;
            }
            result.push({ ...item, y: newY });
        }

        return result.sort((a, b) => (a.y * 12 + a.x) - (b.y * 12 + b.x));
    }, []);

    const resolveCollisions = useCallback((moved: { id: string, x: number, y: number, w: number, h: number }, currentCharts: ChartData[]): ChartData[] => {
        let newCharts = currentCharts.map(c => ({ ...c }));
        const idx = newCharts.findIndex(c => c.id === moved.id);
        if (idx !== -1) {
            newCharts[idx] = { ...newCharts[idx], x: moved.x, y: moved.y, w: moved.w, h: moved.h };
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
                            toMoveIdx = (chartA.y <= chartB.y) ? j : i;
                        }
                        if (toMoveIdx !== -1) {
                            const otherIdx = toMoveIdx === i ? j : i;
                            const shift = (newCharts[otherIdx].y + newCharts[otherIdx].h) - newCharts[toMoveIdx].y;
                            if (shift > 0) {
                                newCharts[toMoveIdx].y += shift;
                                hasChanges = true;
                            }
                        }
                    }
                }
            }
        }
        return isAutoAlign ? compactLayout(newCharts, moved.id) : newCharts;
    }, [isAutoAlign, compactLayout]);

    const handleUpdateChart = useCallback((id: string, updates: Partial<ChartData>) => {
        const updated = charts.map(c => c.id === id ? { ...c, ...updates } : c);
        if (updates.w || updates.h || updates.x || updates.y) {
            const moved = updated.find(c => c.id === id)!;
            const finalized = resolveCollisions(moved, updated);
            saveCharts(finalized);
        } else {
            saveCharts(updated);
        }
    }, [charts, saveCharts, resolveCollisions]);

    const handleRemoveChart = useCallback((id: string) => {
        let updated = charts.filter(c => c.id !== id);
        if (isAutoAlign) {
            updated = compactLayout(updated);
        }
        saveCharts(updated);
        if (selectedChartId === id) setSelectedChartId(null);
    }, [charts, saveCharts, selectedChartId, isAutoAlign, compactLayout]);

    // Calculate the preview layout in real-time (for dragging)
    const previewCharts = useMemo(() => {
        let workingCharts = [...charts];

        // Apply drag preview if dragging
        if (activeId && dragPosition) {
            const isFromSidebar = activeId.startsWith('sidebar-');
            const w = activeChart?.w ?? 4;
            const h = activeChart?.h ?? 3;
            // Clamp X to stay within 12 columns
            const x = Math.max(0, Math.min(12 - w, dragPosition.x));
            const y = dragPosition.y;

            if (isFromSidebar) {
                const movedItem = {
                    id: 'preview-ghost',
                    type: activeChart?.type ?? 'bar',
                    title: activeChart?.title ?? 'New Chart',
                    x, y, w, h,
                    isGhost: true,
                    config: DEFAULT_CHART_CONFIG
                };
                workingCharts = [...workingCharts, movedItem] as ChartData[];
                // Don't resolve collisions during sidebar drag to prevent confusing movement
                // workingCharts = resolveCollisions(movedItem, workingCharts);
            } else {
                // Sorting items
                const originalChart = charts.find(c => c.id === activeId);
                if (originalChart) {
                    const movedItem = {
                        ...originalChart,
                        id: 'preview-ghost',
                        x, y,
                        isGhost: true
                    };
                    // Only run collisions on others
                    const others = charts.filter(c => c.id !== activeId);
                    workingCharts = resolveCollisions(movedItem, [...others, movedItem]);

                    // Add back the original chart but make it COMPLETELY invisible 
                    // (prevents double-tap issues and visual duplication)
                    workingCharts.push({ ...originalChart, isGhost: false, isHidden: true });
                }
            }
        }

        return workingCharts;
    }, [activeId, dragPosition, charts, activeChart, resolveCollisions]);

    const updateGridMetrics = useCallback(() => {
        const container = document.getElementById('chart-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const padding = 40;
        const availableWidth = rect.width - (2 * padding);
        const colWidth = (availableWidth - (11 * 20)) / 12;
        const rowHeight = 100 + 20;
        setGridMetrics({ colWidth, rowHeight });
    }, []);

    useEffect(() => {
        updateGridMetrics();
        window.addEventListener('resize', updateGridMetrics);
        return () => window.removeEventListener('resize', updateGridMetrics);
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
            const isResizeHandle = event.activatorEvent.target.closest('[data-resize-handle]');
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
                h: chartType === 'progressBar' ? 1 : (chartType === 'circularProgress' ? 2 : 3)
            });
        } else {
            const chart = charts.find(c => c.id === active.id);
            if (chart) setActiveChart(chart);
        }
    };

    const handleDragMove = (event: DragMoveEvent) => {
        const { active, over } = event;
        const container = document.getElementById('chart-container');
        if (!container || !gridMetrics) return;

        if (!over || over.id !== 'chart-container') {
            setDragPosition(null);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const padding = 40;
        const topPadding = 80;

        let relCenterX: number;
        let relCenterY: number;

        if (active.id.toString().startsWith('sidebar-')) {
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
        const chartH = activeChart?.h ?? 3;

        // Snap based on relativistic center
        const targetX = Math.round(((relCenterX - padding) / colWidth) - (chartW / 2));
        const targetY = Math.max(0, Math.round(((relCenterY - topPadding) / rowHeight) - (chartH / 2)));

        const coords = {
            x: Math.max(0, Math.min(12 - chartW, targetX)),
            y: targetY
        };

        // Stability check: Only update if we've moved significantly within the grid 
        // to prevent "jitter" when the mouse is on a boundary
        if (!dragPosition || Math.abs(dragPosition.x - coords.x) > 0 || Math.abs(dragPosition.y - coords.y) > 0) {
            setDragPosition(coords);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'chart-container' && dragPosition) {
            const isFromSidebar = active.id.toString().startsWith('sidebar-');

            // Get the charts from preview and filter out the hidden original (if sorting)
            const chartsForDrop = previewCharts.filter(c => !c.isHidden);
            let finalLayout: ChartData[];

            if (isFromSidebar) {
                // For sidebar drag, we resolve collisions only on drop
                const ghost = chartsForDrop.find(c => c.id === 'preview-ghost');
                if (ghost) {
                    const newChart = {
                        ...ghost,
                        id: `chart-${Date.now()}`,
                        isGhost: false
                    };
                    const withNewChart = chartsForDrop.map(c => c.id === 'preview-ghost' ? newChart : c);
                    // Resolve collisions now that the item is dropped
                    finalLayout = resolveCollisions(newChart, withNewChart);
                } else {
                    finalLayout = chartsForDrop.map(c => ({ ...c, isGhost: false }));
                }
            } else {
                // For sorting, previewCharts already resolved collisions.
                // Just map the ghost to the actual ID.
                finalLayout = chartsForDrop.map(c => {
                    if (c.id === 'preview-ghost') {
                        return {
                            ...c,
                            id: active.id.toString(),
                            isGhost: false
                        };
                    }
                    return { ...c, isGhost: false };
                });
            }

            saveCharts(finalLayout);
        }

        setDragPosition(null);
        setActiveId(null);
        setActiveChart(null);
    };

    const handleDragCancel = () => {
        setDragPosition(null);
        setActiveId(null);
        setActiveChart(null);
    };

    const handleResizeStart = (id: string, e: React.MouseEvent) => {
        // We handle this carefully as a PointerEvent
        const pe = e as unknown as React.PointerEvent;
        pe.preventDefault();
        pe.stopPropagation();

        const chart = charts.find(c => c.id === id);
        if (chart) {
            setResizingChartId(id);
            initialResizeData.current = {
                mousePos: { x: pe.clientX, y: pe.clientY },
                span: { w: chart.w, h: chart.h }
            };

            // Capture pointer to ensure we get up/move even outside element
            if (pe.currentTarget instanceof HTMLElement) {
                pe.currentTarget.setPointerCapture(pe.pointerId);
            }
        }
    };

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!resizingChartId || !initialResizeData.current) return;

        const container = document.getElementById('chart-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const padding = 40;
        const colWidth = (rect.width - 2 * padding - 11 * 20) / 12;
        const rowHeight = 100 + 20;

        // Auto-scroll logic during resizing
        const scrollThreshold = 80;
        if (e.clientY > rect.bottom - scrollThreshold) {
            container.scrollBy({ top: 15, behavior: 'auto' });
        } else if (e.clientY < rect.top + scrollThreshold && container.scrollTop > 0) {
            container.scrollBy({ top: -15, behavior: 'auto' });
        }

        const dx = e.clientX - initialResizeData.current.mousePos.x;
        const dy = e.clientY - initialResizeData.current.mousePos.y;

        const dw = Math.floor(dx / (colWidth + 20) + 0.5);
        const dh = Math.floor(dy / rowHeight + 0.5);

        setCharts(prev => {
            const chart = prev.find(c => c.id === resizingChartId);
            if (!chart) return prev;

            let newW = Math.min(12, Math.max(1, initialResizeData.current!.span.w + dw));
            let newH = Math.max(1, initialResizeData.current!.span.h + dh);

            if (chart.x + newW > 12) newW = 12 - chart.x;

            if (chart.w === newW && chart.h === newH) return prev;

            const updated = prev.map(c =>
                c.id === resizingChartId ? { ...c, w: newW, h: newH } : c
            );
            const moved = updated.find(c => c.id === resizingChartId)!;
            const finalCharts = resolveCollisions(moved, updated);
            saveCharts(finalCharts);
            return finalCharts;
        });
    }, [resizingChartId, resolveCollisions, saveCharts]);

    const isResizingDoneRef = useRef(false);

    const handlePointerUp = useCallback((e: PointerEvent) => {
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
    }, [resizingChartId]);

    useEffect(() => {
        if (resizingChartId) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [resizingChartId, handlePointerMove, handlePointerUp]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleDragCancel();
                setResizingChartId(null);
                initialResizeData.current = null;
                setSelectedChartId(null); // Also clear selected chart on escape
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const onChartClick = (id: string) => {
        if (!isEditMode || isResizingDoneRef.current || resizingChartId) return;
        setSelectedChartId(id);
    };

    const maxGridRow = useMemo(() => {
        const lowestPoint = previewCharts.reduce((max, c) => Math.max(max, c.y + c.h), 0);
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
                threshold: { x: 100, y: 100 }
            }}
        >
            <div className={styles["project-container"]}>
                <div className={styles["tools-container"]}>
                    {!is3DMode &&
                        <>
                            <button
                                className={`${styles["btn"]} ${isEditMode ? styles.active : ""}`}
                                onClick={() => setIsEditMode(!isEditMode)}
                            >
                                {isEditMode ? "✓ Finish Editing" : "✎ Edit Layout"}
                            </button>
                            <button
                                className={`${styles["btn"]} ${isAutoAlign ? styles.active : ""}`}
                                onClick={() => {
                                    setIsAutoAlign(!isAutoAlign);
                                    if (!isAutoAlign) {
                                        saveCharts(compactLayout(charts));
                                    }
                                }}
                            >
                                Auto Align: {isAutoAlign ? "ON" : "OFF"}
                            </button>
                        </>
                    }

                    {is3DMode && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                accept=".dxf"
                                onChange={handleFileChange}
                            />
                            <button
                                className={`${styles["btn"]} ${is3DMode ? styles.active : ""}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Upload DXF
                            </button>

                        </>
                    )}
                    <button
                        className={`${styles["btn"]} ${is3DMode ? styles.active : ""}`}
                        onClick={() => setIs3DMode(!is3DMode)}
                    >
                        {is3DMode ? "Switch to 2D" : "Switch to 3D"}
                    </button>
                </div>
                <ChartListSidebar isOpen={!selectedChartId} />

                {isEditMode && selectedChartId && (
                    <ChartConfigSidebar
                        chart={charts.find(c => c.id === selectedChartId)!}
                        onClose={() => setSelectedChartId(null)}
                        onUpdate={handleUpdateChart}
                    />
                )}

                <AnimatePresence mode="wait">
                    {!is3DMode ? (
                        <motion.div
                            key="2d-view"
                            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
                        >
                            <DroppableChartContainer isEditMode={isEditMode} onClick={() => setSelectedChartId(null)}>
                                {previewCharts.map((chart) => (
                                    <DraggableChart
                                        key={chart.id}
                                        chart={chart}
                                        isEditMode={isEditMode}
                                        onResizeStart={handleResizeStart}
                                        onDelete={handleRemoveChart}
                                        onClick={onChartClick}
                                        isSelected={selectedChartId === chart.id}
                                        disabled={resizingChartId !== null && chart.id !== resizingChartId}
                                        isResizing={resizingChartId === chart.id}
                                    />
                                ))}
                                {/* Spacer to provide infinite scroll buffer */}
                                <div style={{ gridRowStart: maxGridRow, gridColumn: '1 / span 12', height: '1px', pointerEvents: 'none' }} />
                            </DroppableChartContainer>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="3d-view"
                            initial={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            className={styles["three-container"]}
                        >
                            <Suspense fallback={<div style={{ color: 'white' }}>Loading 3D Scene...</div>}>
                                <Project3D />
                            </Suspense>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <DragOverlay modifiers={activeId?.startsWith('sidebar-') ? [snapCenterToCursor] : []}>
                {activeId ? (
                    <div
                        className={styles["drag-overlay"]}
                        style={{
                            width: activeId.startsWith('sidebar-') || !gridMetrics
                                ? '300px'
                                : `${activeChart?.w ? (activeChart.w * gridMetrics.colWidth + (activeChart.w - 1) * 20) : 300}px`,
                            height: activeId.startsWith('sidebar-') || !gridMetrics
                                ? '200px'
                                : `${(activeChart?.h ?? 3) * 120 - 20}px`
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
        </DndContext>
    );
};

export default Project;