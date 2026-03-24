import React, { useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import styles from './Chart.module.scss';
import BarChart from './components/BarChart';
import LineChart from './components/LineChart';
import AreaChart from './components/AreaChart';
import PieChart from './components/PieChart';
import GaugeChart from './components/GaugeChart';
import RadarChart from './components/RadarChart';
import ScatterChart from './components/ScatterChart';
import ProgressBar from './components/ProgressBar';
import CircularProgress from './components/CircularProgress';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

import { ChartConfig } from '@/types/chart.types';

interface ChartProps {
    id: string;
    type: string;
    title: string;
    config: ChartConfig;
    onResizeStart?: (e: React.MouseEvent) => void;
    onDelete?: () => void;
    isEditMode?: boolean;
}

const Chart: React.FC<ChartProps> = ({ type, title, config, onResizeStart, onDelete, isEditMode = false }) => {
    const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        if (onResizeStart) {
            onResizeStart(e as unknown as React.MouseEvent);
        }
    }, [onResizeStart]);

    const effectiveConfig = config || {
        showTooltips: true,
        showLegend: true,
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
        showGrid: true,
    };

    const themeColor = effectiveConfig.color || '#a855f7';
    
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: effectiveConfig.yAxisLabel || 'Energy Consumption',
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: `${themeColor}80`, // 50% opacity hex
                borderColor: themeColor,
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: themeColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: effectiveConfig.showLegend,
                position: 'bottom' as const,
                labels: {
                    color: '#e2e8f0',
                },
            },
            tooltip: {
                enabled: effectiveConfig.showTooltips,
            },
            title: {
                display: false,
            },
        },
        scales: type !== 'pie' && type !== 'gauge' ? {
            y: {
                title: {
                    display: !!effectiveConfig.yAxisLabel,
                    text: effectiveConfig.yAxisLabel,
                    color: '#94a3b8',
                },
                max: effectiveConfig.yAxisMax,
                grid: {
                    color: effectiveConfig.showGrid ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                },
                ticks: {
                    color: '#94a3b8',
                },
            },
            x: {
                title: {
                    display: !!effectiveConfig.xAxisLabel,
                    text: effectiveConfig.xAxisLabel,
                    color: '#94a3b8',
                },
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#94a3b8',
                },
            },
        } : undefined,
    };

    const renderChart = () => {
        const commonData = {
            ...data,
            datasets: data.datasets.map(ds => ({
                ...ds,
                backgroundColor: ds.backgroundColor,
                borderColor: ds.borderColor,
            }))
        };

        switch (type) {
            case 'bar':
                return <BarChart data={commonData} options={options} />;
            case 'horizontalBar':
                return (
                    <BarChart 
                        data={commonData} 
                        options={{ 
                            ...options, 
                            indexAxis: 'y' as const,
                            scales: {
                                ...options.scales,
                                x: { ...options.scales?.y },
                                y: { ...options.scales?.x },
                            }
                        }} 
                    />
                );
            case 'stackedBar':
                return (
                    <BarChart 
                        data={{
                            ...commonData,
                            datasets: [
                                ...commonData.datasets,
                                {
                                    label: 'Previous Period',
                                    data: [45, 39, 60, 71, 46, 35],
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    borderWidth: 1,
                                }
                            ]
                        }} 
                        options={{ 
                            ...options, 
                            scales: {
                                ...options.scales,
                                x: { ...options.scales?.x, stacked: true },
                                y: { ...options.scales?.y, stacked: true },
                            }
                        }} 
                    />
                );
            case 'line':
                return <LineChart data={commonData} options={options} />;
            case 'area':
                return <AreaChart data={commonData} options={options} />;
            case 'pie':
                return <PieChart data={commonData} options={options} />;
            case 'radar':
                return (
                    <RadarChart 
                        data={{
                            labels: ['Efficiency', 'Reliability', 'Availability', 'Performance', 'Cost', 'Safety'],
                            datasets: [{
                                label: 'Metrics',
                                data: [80, 70, 90, 85, 60, 75],
                                backgroundColor: `${themeColor}33`, // 20% opacity
                                borderColor: themeColor,
                                borderWidth: 2,
                                pointBackgroundColor: themeColor,
                                pointBorderColor: '#fff',
                            }]
                        }}
                        options={{
                            ...options,
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    pointLabels: { color: '#94a3b8' },
                                    ticks: { display: false, backdropColor: 'transparent' }
                                }
                            }
                        }}
                    />
                );
            case 'scatter':
                return (
                    <ScatterChart 
                        data={{
                            datasets: [{
                                label: 'Power vs Temp',
                                data: [
                                    { x: 10, y: 20 }, { x: 15, y: 10 }, { x: 20, y: 25 },
                                    { x: 25, y: 18 }, { x: 30, y: 30 }, { x: 35, y: 22 }
                                ],
                                backgroundColor: themeColor,
                            }]
                        }}
                        options={options}
                    />
                );
            case 'gauge':
                return (
                    <GaugeChart
                        data={{
                            ...data,
                            datasets: [{ ...data.datasets[0], data: [70, 30] }],
                        }}
                        options={{
                            ...options,
                            circumference: 180,
                            rotation: -90,
                        }}
                    />
                );
            case 'progressBar':
                const lastVal = data.datasets[0].data[data.datasets[0].data.length - 1];
                return <ProgressBar value={lastVal} color={themeColor} />;
            case 'circularProgress':
                const circleVal = data.datasets[0].data[data.datasets[0].data.length - 1];
                return <CircularProgress value={circleVal} color={themeColor} />;
            default:
                return null;
        }
    };

    return (
        <div className={`${styles['chart-wrapper']} ${['progressBar', 'circularProgress'].includes(type) ? styles.compact : ''}`}>
            <div className={styles['chart-header']}>
                <div className={styles['title-group']}>
                    <span className={styles['chart-title']}>{title}</span>
                    {type === 'progressBar' && (
                        <span className={styles['percentage-badge']}>
                            {data.datasets[0].data[data.datasets[0].data.length - 1]}%
                        </span>
                    )}
                </div>
                {isEditMode && (
                    <div className={styles['header-actions']}>
                        <button
                            className={styles['delete-btn']}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete();
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            <div className={styles['chart-content']}>
                {renderChart()}
            </div>
            {isEditMode && (
                <div
                    className={styles['resize-handle']}
                    onPointerDown={handleResizePointerDown}
                    data-resize-handle
                >
                    ◢
                </div>
            )}
        </div>
    );
};

export default Chart;