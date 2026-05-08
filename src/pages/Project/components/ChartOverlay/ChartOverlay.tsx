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
    constraintsRef: React.RefObject<HTMLDivElement>;
    onUpdate?: (updates: any) => void;
    onDelete?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isConfigOpen?: boolean;
    anchorX?: 'left' | 'right';
    anchorY?: 'top' | 'bottom';
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

/** Convert stored (anchor-relative) percentage coordinates to absolute pixels. */
function toAbsolutePixels(
    x: number, y: number,
    anchorX: 'left' | 'right', anchorY: 'top' | 'bottom',
    w: number, h: number,
    containerW: number, containerH: number
) {
    const left = anchorX === 'right'
        ? containerW - (x / 100) * containerW - w
        : (x / 100) * containerW;
    const top = anchorY === 'bottom'
        ? containerH - (y / 100) * containerH - h
        : (y / 100) * containerH;
    return {
        left: Math.max(0, Math.min(left, containerW - w)),
        top: Math.max(0, Math.min(top, containerH - h)),
    };
}

const ChartOverlay: React.FC<ChartOverlayProps> = ({
    id, type, title, config, x, y, w, h,
    constraintsRef, onUpdate, onDelete, onContextMenu,
    isConfigOpen, anchorX = 'left', anchorY = 'top'
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
    const lastUpdateRef = React.useRef<{ x: number, y: number, anchorX: string, anchorY: string } | null>(null);

    // Initialize pixel position from props on first render
    React.useLayoutEffect(() => {
        if (!constraintsRef.current) return;
        const rect = constraintsRef.current.getBoundingClientRect();
        const { width, height } = rect;
        setContainerSize({ w: width, h: height });
        if (width === 0 || height === 0) return;
        const { left, top } = toAbsolutePixels(x, y, anchorX, anchorY, localW, localH, width, height);
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
            lastUpdateRef.current.y === y &&
            lastUpdateRef.current.anchorX === anchorX &&
            lastUpdateRef.current.anchorY === anchorY) {
            return;
        }

        if (!constraintsRef.current) return;
        const rect = constraintsRef.current.getBoundingClientRect();
        const { width, height } = rect;
        if (width === 0 || height === 0) return;

        const { left, top } = toAbsolutePixels(x, y, anchorX, anchorY, localW, localH, width, height);
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

    // Handle window resize to keep pixel positions in sync with percentages
    React.useEffect(() => {
        const handleResize = () => {
            if (isDraggingRef.current || isResizing) return;
            if (!constraintsRef.current) return;
            const rect = constraintsRef.current.getBoundingClientRect();
            const { width, height } = rect;
            setContainerSize({ w: width, h: height });
            if (width === 0 || height === 0) return;
            const { left, top } = toAbsolutePixels(x, y, anchorX, anchorY, localW, localH, width, height);
            setPosLeft(left);
            setPosTop(top);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [x, y, anchorX, anchorY, localW, localH]);

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

        const newLeft = Math.max(0, Math.min(dragStart.current.left + dx, cW - localW));
        const newTop = Math.max(0, Math.min(dragStart.current.top + dy, cH - localH));

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

        const newAnchorX: 'left' | 'right' = (finalLeft + localW / 2) > (containerW / 2) ? 'right' : 'left';
        const newAnchorY: 'top' | 'bottom' = (finalTop + localH / 2) > (containerH / 2) ? 'bottom' : 'top';

        const storedX = Number((
            newAnchorX === 'right'
                ? (containerW - finalLeft - localW) / containerW * 100
                : finalLeft / containerW * 100
        ).toFixed(4));

        const storedY = Number((
            newAnchorY === 'bottom'
                ? (containerH - finalTop - localH) / containerH * 100
                : finalTop / containerH * 100
        ).toFixed(4));

        lastUpdateRef.current = { x: storedX, y: storedY, anchorX: newAnchorX, anchorY: newAnchorY };

        if (onUpdate) {
            onUpdate({ x: storedX, y: storedY, w: localW, h: localH, anchorX: newAnchorX, anchorY: newAnchorY });
        } else {
            updateOverlayChart(id, { x: storedX, y: storedY, anchorX: newAnchorX, anchorY: newAnchorY });
        }
    };

    // Derived properties for rendering
    const currentIsRight = containerSize.w > 0 && (posLeft + localW / 2) > (containerSize.w / 2);
    const currentIsBottom = containerSize.h > 0 && (posTop + localH / 2) > (containerSize.h / 2);

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
                left: currentIsRight ? 'auto' : posLeft,
                right: currentIsRight ? (containerSize.w - posLeft - localW) : 'auto',
                top: currentIsBottom ? 'auto' : posTop,
                bottom: currentIsBottom ? (containerSize.h - posTop - localH) : 'auto',
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
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                            setIsResizing(true);

                            const startW = localW;
                            const startH = localH;
                            const startX = e.clientX;
                            const startY = e.clientY;
                            let currentW = startW;
                            let currentH = startH;

                            const onMove = (ev: PointerEvent) => {
                                ev.stopPropagation();
                                currentW = Math.max(300, startW + (ev.clientX - startX));
                                currentH = Math.max(250, startH + (ev.clientY - startY));
                                requestAnimationFrame(() => {
                                    setLocalW(currentW);
                                    setLocalH(currentH);
                                });
                            };

                            const onUp = (ev: PointerEvent) => {
                                setIsResizing(false);
                                (e.currentTarget as HTMLDivElement).releasePointerCapture(ev.pointerId);
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);
                                if (onUpdate) onUpdate({ x, y, w: currentW, h: currentH });
                                else updateOverlayChart(id, { w: currentW, h: currentH });
                            };

                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
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
