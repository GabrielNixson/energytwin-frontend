import React from 'react';
import Chart from '@/components/Chart/Chart';
import { ChartConfig } from '@/types/chart.types';
import { useUIStore } from '@/store/useUIStore';

interface ChartOverlayProps {
    id: string;
    type: string;
    title: string;
    config?: ChartConfig;
    x: number;
    y: number;
    w: number;
    h: number;
    anchorX?: 'left' | 'right';
    anchorY?: 'top' | 'bottom';
    constraintsRef: React.RefObject<HTMLDivElement>;
    onUpdate?: (updates: any) => void;
    onDelete?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isConfigOpen?: boolean;
}

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

/** Convert stored percentage coordinates relative to anchor to absolute pixels. */
function toAbsolutePixels(
    x: number, y: number,
    w: number, h: number,
    containerW: number, containerH: number,
    anchorX: 'left' | 'right' = 'left',
    anchorY: 'top' | 'bottom' = 'top'
) {
    const leftPx = (x / 100) * containerW;
    const topPx = (y / 100) * containerH;

    const left = anchorX === 'right' 
        ? containerW - leftPx - w 
        : leftPx;
        
    const top = anchorY === 'bottom'
        ? containerH - topPx - h
        : topPx;
    
    return {
        left: Math.round(Math.max(0, Math.min(left, containerW - w))),
        top: Math.round(Math.max(0, Math.min(top, containerH - h))),
    };
}

const ChartOverlay: React.FC<ChartOverlayProps> = ({
    id, type, title, config, x, y, w, h,
    anchorX = 'left', anchorY = 'top',
    constraintsRef, onUpdate, onDelete, onContextMenu,
    isConfigOpen
}) => {
    const {
        removeOverlayChart, updateOverlayChart, bringOverlayToFront,
        setSelectedChartId, isEditMode, selectedChartId
    } = useUIStore();

    const isSelected = selectedChartId === id;
    const [isResizing, setIsResizing] = React.useState(false);
    const [localW, setLocalW] = React.useState(w);
    const [localH, setLocalH] = React.useState(h);

    // ── PIXEL-BASED LOCAL POSITION ─────────────────────────────────────────────
    // We store position in PIXELS (not percentages) so drag math is trivial.
    // This completely bypasses the framer-motion animate/transform race condition
    // that was causing the jump: we never use `animate` for left/top at all.
    const [posLeft, setPosLeft] = React.useState<number>(0);
    const [posTop, setPosTop] = React.useState<number>(0);
    const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 });
    const posInitialized = React.useRef(false);
    const lastUpdateRef = React.useRef<{ x: number, y: number } | null>(null);

    // Initialize pixel position from props on first render
    React.useLayoutEffect(() => {
        if (!constraintsRef.current) return;
        const rect = constraintsRef.current.getBoundingClientRect();
        const { width, height } = rect;
        setContainerSize({ w: width, h: height });
        if (width === 0 || height === 0) return;
        const { left, top } = toAbsolutePixels(x, y, localW, localH, width, height, anchorX, anchorY);
        setPosLeft(left);
        setPosTop(top);
        posInitialized.current = true;
    }, []); // only on mount

    // When props change from OUTSIDE (e.g. another user updates), sync position.
    // But skip during drag/resize to avoid fighting with local state.
    const isDraggingRef = React.useRef(false);
    React.useEffect(() => {
        if (isDraggingRef.current || isResizing) return;

        // Skip sync if props match our last intentional update (avoids rounding jumps)
        if (lastUpdateRef.current &&
            lastUpdateRef.current.x === x &&
            lastUpdateRef.current.y === y) {
            return;
        }

        if (!constraintsRef.current) return;
        const rect = constraintsRef.current.getBoundingClientRect();
        const { width, height } = rect;
        if (width === 0 || height === 0) return;

        const { left, top } = toAbsolutePixels(x, y, localW, localH, width, height, anchorX, anchorY);
        setPosLeft(left);
        setPosTop(top);
    }, [x, y, anchorX, anchorY]);

    // Sync local dimensions when props change
    React.useEffect(() => {
        if (!isResizing) {
            setLocalW(w);
            setLocalH(h);
        }
    }, [w, h, isResizing]);

    // Handle container resize to keep pixel positions in sync with percentages
    React.useEffect(() => {
        if (!constraintsRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const { width, height } = entry.contentRect;

            // Avoid updates during drag/resize to prevent fighting
            if (isDraggingRef.current || isResizing) {
                setContainerSize({ w: width, h: height });
                return;
            }

            setContainerSize({ w: width, h: height });

            if (width === 0 || height === 0) return;

            const { left, top } = toAbsolutePixels(x, y, localW, localH, width, height, anchorX, anchorY);
            setPosLeft(left);
            setPosTop(top);
        });

        observer.observe(constraintsRef.current);
        return () => observer.disconnect();
    }, [x, y, localW, localH, anchorX, anchorY]);

    // ── DRAG STATE ─────────────────────────────────────────────────────────────
    const dragStart = React.useRef({ left: 0, top: 0, pointerLeft: 0, pointerTop: 0 });
    const itemRef = React.useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditMode || isResizing) return;
        if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
        if ((e.target as HTMLElement).closest('[data-no-drag]')) return;

        e.stopPropagation();
        bringOverlayToFront(id);

        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        isDraggingRef.current = true;

        dragStart.current = {
            left: posLeft,
            top: posTop,
            pointerLeft: e.clientX,
            pointerTop: e.clientY,
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current || isResizing) return;
        e.stopPropagation();

        const dx = e.clientX - dragStart.current.pointerLeft;
        const dy = e.clientY - dragStart.current.pointerTop;

        const cW = containerSize.w || constraintsRef.current?.getBoundingClientRect().width || window.innerWidth;
        const cH = containerSize.h || constraintsRef.current?.getBoundingClientRect().height || window.innerHeight;

        const newLeft = Math.round(Math.max(0, Math.min(dragStart.current.left + dx, cW - localW)));
        const newTop = Math.round(Math.max(0, Math.min(dragStart.current.top + dy, cH - localH)));

        setPosLeft(newLeft);
        setPosTop(newTop);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        if (!constraintsRef.current) return;
        const containerW = containerSize.w;
        const containerH = containerSize.h;

        // finalLeft/finalTop are already clamped from handlePointerMove
        const finalLeft = posLeft;
        const finalTop = posTop;

        // Recalculate anchor based on viewport quadrants to keep consistent with drop behavior
        const newAnchorX = finalLeft > (containerW / 2) ? 'right' : 'left';
        const newAnchorY = finalTop > (containerH / 2) ? 'bottom' : 'top';

        const storedX = Number(((newAnchorX === 'right' ? (containerW - finalLeft - localW) : finalLeft) / containerW * 100).toFixed(4));
        const storedY = Number(((newAnchorY === 'bottom' ? (containerH - finalTop - localH) : finalTop) / containerH * 100).toFixed(4));

        console.log(`[ChartOverlay] Drag ended. Calculated Percentage: X=${storedX}%, Y=${storedY}%, anchorX=${newAnchorX}, anchorY=${newAnchorY}`);

        lastUpdateRef.current = { x: storedX, y: storedY };

        if (onUpdate) {
            onUpdate({ x: storedX, y: storedY, w: localW, h: localH, anchorX: newAnchorX, anchorY: newAnchorY });
        } else {
            updateOverlayChart(id, { x: storedX, y: storedY, anchorX: newAnchorX, anchorY: newAnchorY });
        }
    };

    // ── RESIZE STATE ──────────────────────────────────────────────────────────
    const resizeStart = React.useRef<{ w: number, h: number, x: number, y: number } | null>(null);

    const handleResizePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setIsResizing(true);
        resizeStart.current = {
            w: localW,
            h: localH,
            x: e.clientX,
            y: e.clientY
        };
    };

    const handleResizePointerMove = (e: React.PointerEvent) => {
        if (!isResizing || !resizeStart.current) return;
        e.stopPropagation();

        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        const newW = Math.max(300, resizeStart.current.w + dx);
        const newH = Math.max(250, resizeStart.current.h + dy);

        setLocalW(newW);
        setLocalH(newH);
    };

    const handleResizePointerUp = (e: React.PointerEvent) => {
        if (!isResizing) return;
        setIsResizing(false);
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        const finalW = localW;
        const finalH = localH;
        resizeStart.current = null;

        if (onUpdate) {
            onUpdate({ x, y, w: finalW, h: finalH });
        } else {
            updateOverlayChart(id, { w: finalW, h: finalH });
        }
    };

    return (
        <div
            ref={itemRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
                if (onContextMenu) {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu(e);
                }
            }}
            style={{
                position: 'absolute',
                left: posLeft,
                top: posTop,
                width: localW,
                height: localH,
                zIndex: (isConfigOpen && isSelected) ? 2000 : 1000,
                cursor: !isEditMode ? 'default' : 'grab',
                pointerEvents: 'auto',
                userSelect: 'none',
                opacity: posInitialized.current ? 1 : 0, // hide until positioned
                transition: 'opacity 0.15s ease',
            }}
        >
            <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--glass-background)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                boxShadow: isSelected ? '0 0 20px rgba(var(--accent-rgb), 0.3)' : '0 12px 40px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border 0.2s ease, box-shadow 0.2s ease',
                cursor: isDraggingRef.current ? 'grabbing' : 'inherit',
            }}>
                {isSelected && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid var(--accent)',
                        borderRadius: '16px',
                        pointerEvents: 'none',
                        zIndex: 10,
                        animation: 'overlayOutlinePulse 2s infinite'
                    }} />
                )}
                <style>{`
                    @keyframes overlayOutlinePulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(1.01); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `}</style>
                <Chart
                    id={id}
                    type={type}
                    title={title}
                    config={config || DEFAULT_CHART_CONFIG}
                    onDelete={() => {
                        if (onDelete) onDelete();
                        else removeOverlayChart(id);
                    }}
                    onSettingsClick={() => setSelectedChartId(id)}
                    isEditMode={isEditMode}
                />

                {isEditMode && (
                    <div
                        data-resize-handle="true"
                        onPointerDown={handleResizePointerDown}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onLostPointerCapture={() => {
                            setIsResizing(false);
                            resizeStart.current = null;
                        }}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '32px',
                            height: '32px',
                            cursor: 'nwse-resize',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            padding: '0 4px 4px 0',
                            color: 'rgba(255, 255, 255, 0.6)',
                            background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.05) 50%)',
                            borderBottomRightRadius: '16px'
                        }}
                    >
                        ◢
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartOverlay;
