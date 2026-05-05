import React from 'react';
import { motion } from 'framer-motion';
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

const ChartOverlay: React.FC<ChartOverlayProps> = ({ id, type, title, config, x, y, w, h, constraintsRef, onUpdate, onDelete, onContextMenu, isConfigOpen, anchorX = 'left', anchorY = 'top' }) => {
    const { removeOverlayChart, updateOverlayChart, bringOverlayToFront, setSelectedChartId, isEditMode, selectedChartId } = useUIStore();
    const isSelected = selectedChartId === id;
    const [isResizing, setIsResizing] = React.useState(false);
    const [localW, setLocalW] = React.useState(w);
    const [localH, setLocalH] = React.useState(h);
    const itemRef = React.useRef<HTMLDivElement>(null);
    const grabOffset = React.useRef({ x: 0, y: 0 });
    const isDraggingRef = React.useRef(false);

    // Sync local dimensions when props change (from external updates)
    React.useEffect(() => {
        if (!isResizing) {
            setLocalW(w);
            setLocalH(h);
        }
    }, [w, h, isResizing]);

    // Calculate absolute coordinates based on anchors for the animate prop
    // This translates the stored relative coordinates into absolute pixel offsets from top-left
    const { visualX, visualY } = React.useMemo(() => {
        if (!constraintsRef.current) return { visualX: 0, visualY: 0 };
        const parentRect = constraintsRef.current.getBoundingClientRect();
        return {
            visualX: anchorX === 'left' ? x : (parentRect.width - x - localW),
            visualY: anchorY === 'top' ? y : (parentRect.height - y - localH)
        };
    }, [x, y, anchorX, anchorY, localW, localH, constraintsRef]);

    return (
        <motion.div
            ref={itemRef}
            drag={isEditMode && !isResizing}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            onDragStart={(_, info) => {
                isDraggingRef.current = true;
                if (itemRef.current) {
                    const rect = itemRef.current.getBoundingClientRect();
                    grabOffset.current = {
                        x: info.point.x - rect.left,
                        y: info.point.y - rect.top
                    };
                }
            }}
            onPointerDown={(e) => {
                e.stopPropagation();
                bringOverlayToFront(id);
            }}
            onContextMenu={(e) => {
                if (onContextMenu) {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu(e);
                }
            }}
            onDragEnd={(_, info) => {
                isDraggingRef.current = false;

                if (!constraintsRef.current) return;

                const parentRect = constraintsRef.current.getBoundingClientRect();
                const containerW = parentRect.width;
                const containerH = parentRect.height;

                // Final absolute pixel position relative to parent container
                const finalVisualX = info.point.x - parentRect.left - grabOffset.current.x;
                const finalVisualY = info.point.y - parentRect.top - grabOffset.current.y;

                // Determine new anchors based on chart center vs container center
                const newAnchorX = (finalVisualX + localW / 2) > (containerW / 2) ? 'right' : 'left';
                const newAnchorY = (finalVisualY + localH / 2) > (containerH / 2) ? 'bottom' : 'top';

                // Calculate relative coordinates for storage
                const storedX = newAnchorX === 'right' ? (containerW - finalVisualX - localW) : finalVisualX;
                const storedY = newAnchorY === 'bottom' ? (containerH - finalVisualY - localH) : finalVisualY;

                if (onUpdate) {
                    onUpdate({ 
                        x: storedX, 
                        y: storedY, 
                        w: localW, 
                        h: localH,
                        anchorX: newAnchorX,
                        anchorY: newAnchorY
                    });
                } else {
                    updateOverlayChart(id, { 
                        x: storedX, 
                        y: storedY,
                        anchorX: newAnchorX,
                        anchorY: newAnchorY
                    });
                }
            }}
            initial={false}
            animate={{ 
                opacity: 1, 
                scale: 1,
                x: visualX,
                y: visualY
            }}
            transition={{ 
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
                x: { duration: 0 },
                y: { duration: 0 }
            }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: localW,
                height: localH,
                zIndex: (isConfigOpen && isSelected) ? 2000 : 1000,
                cursor: !isEditMode ? 'default' : (isResizing ? 'nwse-resize' : 'grab'),
                pointerEvents: 'auto',
            }}
            whileDrag={{ cursor: 'grabbing' }}
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
                transition: 'border 0.2s ease, box-shadow 0.2s ease'
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
                        if (onDelete) {
                            onDelete();
                        } else {
                            removeOverlayChart(id);
                        }
                    }}
                    onSettingsClick={() => {
                        setSelectedChartId(id);
                    }}
                    isEditMode={isEditMode}
                />

                {isEditMode && (
                    <div
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

                            const onMove = (moveEvent: PointerEvent) => {
                                moveEvent.stopPropagation();
                                currentW = Math.max(300, startW + (moveEvent.clientX - startX));
                                currentH = Math.max(250, startH + (moveEvent.clientY - startY));

                                requestAnimationFrame(() => {
                                    setLocalW(currentW);
                                    setLocalH(currentH);
                                });
                            };

                            const onUp = (upEvent: PointerEvent) => {
                                setIsResizing(false);
                                (e.currentTarget as HTMLDivElement).releasePointerCapture(upEvent.pointerId);
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);

                                if (onUpdate) {
                                    onUpdate({ x, y, w: currentW, h: currentH });
                                } else {
                                    updateOverlayChart(id, { w: currentW, h: currentH });
                                }
                            };

                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                        }}
                    >
                        ◢
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChartOverlay;
