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

const ChartOverlay: React.FC<ChartOverlayProps> = ({ id, type, title, config, x, y, w, h, constraintsRef, onUpdate, onDelete }) => {
    const { removeOverlayChart, updateOverlayChart, bringOverlayToFront, findSafePosition, setSelectedChartId, isEditMode, selectedChartId } = useUIStore();
    const isSelected = selectedChartId === id;
    const [isResizing, setIsResizing] = React.useState(false);
    const [localW, setLocalW] = React.useState(w);
    const [localH, setLocalH] = React.useState(h);
    const itemRef = React.useRef<HTMLDivElement>(null);
    const isDraggingRef = React.useRef(false);

    // Sync local dimensions when props change (from external updates)
    React.useEffect(() => {
        if (!isResizing) {
            setLocalW(w);
            setLocalH(h);
        }
    }, [w, h, isResizing]);

    return (
        <motion.div
            ref={itemRef}
            drag={isEditMode && !isResizing}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0} // Tight containment
            onDragStart={() => {
                isDraggingRef.current = true;
            }}
            onPointerDown={(e) => {
                e.stopPropagation();
                bringOverlayToFront(id);
            }}
            onTap={() => {
                // Only select if we weren't just dragging
                if (!isDraggingRef.current) {
                    setSelectedChartId(id);
                }
            }}
            onDragEnd={() => {
                // Delay clearing the flag so onTap (which fires slightly after DragEnd) sees it
                setTimeout(() => {
                    isDraggingRef.current = false;
                }, 50);

                if (!itemRef.current || !constraintsRef.current) return;
                
                // Precise absolute coordinate detection via Ref
                const rect = itemRef.current.getBoundingClientRect();
                const parentRect = constraintsRef.current.getBoundingClientRect();
                
                // Final visual position relative to parent
                const visualX = rect.left - parentRect.left;
                const visualY = rect.top - parentRect.top;
                
                const containerW = parentRect.width;
                const containerH = parentRect.height;

                const finalPos = findSafePosition(id, visualX, visualY, w, h, containerW, containerH);
                
                if (onUpdate) {
                    onUpdate({ ...finalPos, w, h });
                } else {
                    updateOverlayChart(id, finalPos);
                }
            }}
            initial={{ opacity: 0, scale: 0.9, x, y }}
            animate={{ opacity: 1, scale: 1, x, y }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                width: localW,
                height: localH,
                zIndex: 1000, 
                cursor: !isEditMode ? 'default' : (isResizing ? 'nwse-resize' : 'grab'),
                pointerEvents: 'auto',
            }}
            whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
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
                    isEditMode={false} // 3D Overlay handles its own resizing and deletion
                />

                {isEditMode && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '32px', // Larger hit area
                            height: '32px',
                            cursor: 'nwse-resize',
                            zindex: 100,
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
                                
                                // Use requestAnimationFrame for smoother UI updates
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
