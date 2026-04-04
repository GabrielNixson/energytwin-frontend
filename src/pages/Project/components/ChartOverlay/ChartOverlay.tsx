import React from 'react';
import { motion } from 'framer-motion';
import Chart from '@/components/Chart/Chart';
import { ChartConfig } from '@/types/chart.types';
import { useUIStore } from '@/store/useUIStore';

interface ChartOverlayProps {
    id: string;
    type: string;
    title: string;
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
};

const ChartOverlay: React.FC<ChartOverlayProps> = ({ id, type, title, x, y, w, h, constraintsRef, onUpdate, onDelete }) => {
    const { removeOverlayChart, updateOverlayChart, bringOverlayToFront, findSafePosition, isChartSidebarOpen } = useUIStore();
    const [isResizing, setIsResizing] = React.useState(false);
    const [localW, setLocalW] = React.useState(w);
    const [localH, setLocalH] = React.useState(h);
    const itemRef = React.useRef<HTMLDivElement>(null);

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
            drag={!isResizing}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0} // Tight containment
            onPointerDown={() => bringOverlayToFront(id)}
            onDragEnd={() => {
                if (!itemRef.current || !constraintsRef.current) return;
                
                // Precise absolute coordinate detection via Ref
                const rect = itemRef.current.getBoundingClientRect();
                const parentRect = constraintsRef.current.getBoundingClientRect();
                
                // Final visual position relative to parent
                const visualX = rect.left - parentRect.left;
                const visualY = rect.top - parentRect.top;
                
                const containerW = parentRect.width;
                const containerH = parentRect.height;

                const finalPos = findSafePosition(id, visualX, visualY, w, h, containerW, containerH, isChartSidebarOpen);
                
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
                cursor: isResizing ? 'nwse-resize' : 'grab',
                pointerEvents: 'auto',
            }}
            whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
        >
            <div style={{
                width: '100%',
                height: '100%',
                background: 'rgba(15, 15, 20, 0.7)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Chart
                    id={id}
                    type={type}
                    title={title}
                    config={DEFAULT_CHART_CONFIG}
                    onDelete={() => {
                        if (onDelete) {
                            onDelete();
                        } else {
                            removeOverlayChart(id);
                        }
                    }}
                    isEditMode={true}
                />

                {/* Resize Handle Override */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '20px',
                        height: '20px',
                        cursor: 'nwse-resize',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderTopLeftRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.4)'
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsResizing(true);
                        
                        const startW = w;
                        const startH = h;
                        const startX = e.clientX;
                        const startY = e.clientY;

                        const onMove = (moveEvent: PointerEvent) => {
                            const newW = startW + (moveEvent.clientX - startX);
                            const newH = startH + (moveEvent.clientY - startY);
                            setLocalW(Math.max(300, newW));
                            setLocalH(Math.max(300, newH));
                        };

                        const onUp = () => {
                            setIsResizing(false);
                            window.removeEventListener('pointermove', onMove);
                            window.removeEventListener('pointerup', onUp);
                            
                            // Commit final size
                            if (onUpdate) {
                                onUpdate({ x, y, w: Math.max(300, localW), h: Math.max(300, localH) });
                            } else {
                                updateOverlayChart(id, { w: localW, h: localH });
                            }
                        };

                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', onUp);
                    }}
                >
                    ◢
                </div>
            </div>
        </motion.div>
    );
};

export default ChartOverlay;
