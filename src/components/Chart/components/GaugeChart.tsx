import React, { useMemo, useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import styles from './GaugeChart.module.scss';

interface GaugeChartProps {
    value: number;
    start: number;
    min: number;
    max: number;
    end: number;
    color: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ 
    value = 70, 
    start = 0, 
    min = 20, 
    max = 80, 
    end = 100, 
    color = '#a855f7' 
}) => {
    const [prevValue, setPrevValue] = useState(value);
    const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

    useEffect(() => {
        if (value > prevValue) setTrend('up');
        else if (value < prevValue) setTrend('down');
        else setTrend('stable');
        setPrevValue(value);
    }, [value]);

    // Threshold calculation
    const warningHighThreshold = max * 0.9;
    const status = useMemo(() => {
        if (value > max) return { label: 'Danger', color: '#ef4444' };
        if (value < min || value > warningHighThreshold) return { label: 'Warning', color: '#facc15' };
        return { label: 'Normal', color };
    }, [value, min, max, warningHighThreshold, color]);

    // Map value to gauge (0-100 range for the chart)
    const range = end - start;
    const normalizedValue = Math.max(0, Math.min(range, value - start));
    const percentage = (normalizedValue / range) * 100;

    // Needle rotation (percentages 0-100 maps to -90 to 90 degrees)
    const rotationAngle = (percentage / 100) * 180 - 90;

    const data = {
        datasets: [
            {
                // Background thresholds (main track)
                data: [
                    ((min - start) / range) * 100,            // Warning low zone
                    ((warningHighThreshold - min) / range) * 100, // Normal zone
                    ((max - warningHighThreshold) / range) * 100, // Warning high zone
                    ((end - max) / range) * 100               // Danger high zone
                ],
                backgroundColor: [
                    'rgba(250, 204, 21, 0.1)', // Warning Low
                    'rgba(255, 255, 255, 0.03)', // Normal
                    'rgba(250, 204, 21, 0.15)', // Warning High (slightly more visible)
                    'rgba(239, 68, 68, 0.15)'   // Danger
                ],
                borderWidth: 0,
                circumference: 180,
                rotation: -90,
                cutout: '80%',
                weight: 1,
            }
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <Doughnut data={data} options={options} />
                
                {/* SVG Overlay for Ticks and Needle */}
                <svg className={styles.svgOverlay} viewBox="0 0 200 125">
                    {/* Scale Ticks */}
                    {[...Array(9)].map((_, i) => {
                        const deg = (i * 22.5) - 180;
                        return (
                            <line
                                key={i}
                                x1="100" y1="110"
                                x2="100" y2="105"
                                className={styles.tick}
                                transform={`rotate(${deg}, 100, 110)`}
                            />
                        );
                    })}
                    
                    {/* Animated Needle */}
                    <motion.g 
                        animate={{ rotate: rotationAngle }}
                        transition={{ type: "spring", stiffness: 60, damping: 15 }}
                        style={{ originX: "100px", originY: "110px" }}
                    >
                        <path 
                            d="M98 110 L100 25 L102 110 Z" 
                            className={styles.needle}
                            fill={status.color}
                        />
                        <circle cx="100" cy="110" r="5" fill="#1e293b" stroke={status.color} strokeWidth="1.5" />
                        <circle cx="100" cy="110" r="2" fill="#fff" />
                    </motion.g>
                </svg>

                <div className={styles.overlay}>
                    <div className={styles.valueRow}>
                        {trend !== 'stable' && (
                            <span className={`${styles.trend} ${styles[trend]}`}>
                                {trend === 'up' ? '▲' : '▼'}
                            </span>
                        )}
                        <span className={styles.value}>{value.toFixed(0)}</span>
                        <span className={styles.unit}>%</span>
                    </div>
                    <span className={`${styles.status} ${styles[status.label.toLowerCase()]}`}>
                        {status.label}
                    </span>
                </div>
            </div>
            
            <div className={styles.footer}>
                <div className={styles.limitItem}>
                    <span className={styles.limitLabel}>START</span>
                    <span className={styles.limitValue}>{start}</span>
                </div>
                <div className={styles.limitItem}>
                    <span className={styles.limitLabel}>END</span>
                    <span className={styles.limitValue}>{end}</span>
                </div>
            </div>
        </div>
    );
};

export default GaugeChart;
