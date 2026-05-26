import React, { useCallback, useEffect, useState } from 'react';
import { socket } from '@/services/socket';
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
import BillingWidget from './components/BillingWidget';

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
    onSettingsClick?: () => void;
    isEditMode?: boolean;
}

const Chart: React.FC<ChartProps> = ({ id, type, title, config, onResizeStart, onDelete, onSettingsClick, isEditMode = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [fetchedData, setFetchedData] = useState<any>(null);

    useEffect(() => {
        if (!config?.fieldname) {
            return;
        }


        const responseEvent = `energyTwin:data:res:${id}`;

        const fetchData = () => {
            const payload = {
                fieldname: config.fieldname,
                timerange: config.timerange || '-1h',
                function: config.function || 'last',
                graphId: id
            };
            socket.emit('energyTwin:data:req', payload);
        };

        const handleResponse = (payload: any) => {
            setFetchedData(payload);
        };

        socket.on(responseEvent, handleResponse);

        // Initial fetch
        fetchData();

        // Polling every 2 seconds as requested
        const pollInterval = setInterval(() => {
            fetchData();
        }, 2000);

        return () => {
            clearInterval(pollInterval);
            socket.off(responseEvent, handleResponse);
        };
    }, [id, config?.fieldname, config?.timerange, config?.function]);

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
        gaugeStart: 100,
        gaugeMin: 500,
        gaugeMax: 600,
        gaugeEnd: 1000,
    };

    const themeColor = effectiveConfig.color || '#7c5dfa';

    // Data Transformation Logic
    const formatChartData = () => {
        if (!fetchedData) {
            // Default sample data
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: effectiveConfig.yAxisLabel || 'Energy Consumption',
                        data: [65, 59, 80, 81, 56, 55],
                        backgroundColor: `${themeColor}80`,
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
        }

        let labels: string[] = [];
        let dataPoints: number[] = [];

        // Extract the field name robustly
        const fullField = config.fieldname || '';
        const suffixField = fullField.includes('.') ? fullField.split('.').pop() || '' : fullField;

        // Handle Scenario A: Live Value
        if (fetchedData.timestamp && Array.isArray(fetchedData.value) && !fetchedData.results) {
            labels = fetchedData.timestamp.map((t: string) => new Date(t).toLocaleTimeString());
            dataPoints = fetchedData.value;
        }
        // Handle Scenario B/C: Daily/Weekly/Monthly (Bar/Line)
        // Check for both full field name (dotted) and suffix
        else if (fetchedData.timestamp && (fetchedData[fullField] || fetchedData[suffixField])) {
            labels = fetchedData.timestamp;
            dataPoints = fetchedData[fullField] || fetchedData[suffixField];
        }
        // Handle Scenario D: Historical List
        else if (fetchedData.results && Array.isArray(fetchedData.results)) {
            labels = fetchedData.results.map((r: any) => new Date(r.time).toLocaleTimeString());
            dataPoints = fetchedData.results.map((r: any) => r.value);
        }

        return {
            labels: labels,
            datasets: [
                {
                    label: effectiveConfig.yAxisLabel || config.fieldname || 'Data',
                    data: dataPoints,
                    backgroundColor: `${themeColor}80`,
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
    };

    const data = formatChartData();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 5,
                bottom: 5,
                left: 0,
                right: 0
            }
        },
        plugins: {
            legend: {
                display: effectiveConfig.showLegend,
                position: 'bottom' as const,
                labels: {
                    color: '#64748b',
                    font: {
                        size: 11
                    },
                    boxWidth: 12,
                    padding: 15
                },
            },
            tooltip: {
                enabled: effectiveConfig.showTooltips,
                backgroundColor: 'rgba(15, 15, 20, 0.9)',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
                displayColors: false
            },
        },
        scales: type !== 'pie' && type !== 'gauge' ? {
            y: {
                title: {
                    display: !!effectiveConfig.yAxisLabel,
                    text: effectiveConfig.yAxisLabel,
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        weight: '600' as const
                    }
                },
                max: effectiveConfig.yAxisMax,
                grid: {
                    color: effectiveConfig.showGrid ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    drawBorder: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    padding: 8
                },
            },
            x: {
                title: {
                    display: !!effectiveConfig.xAxisLabel,
                    text: effectiveConfig.xAxisLabel,
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        weight: '600' as const
                    }
                },
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    padding: 8
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
                                backgroundColor: `${themeColor}33`,
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
            case 'gauge': {
                const gaugeVal = data.datasets[0].data[data.datasets[0].data.length - 1];
                return (
                    <GaugeChart
                        value={gaugeVal}
                        start={effectiveConfig.gaugeStart ?? 0}
                        min={effectiveConfig.gaugeMin ?? 0}
                        max={effectiveConfig.gaugeMax ?? 100}
                        end={effectiveConfig.gaugeEnd ?? 1000}
                        color={themeColor}
                    />
                );
            }
            case 'progressBar': {
                const lastVal = data.datasets[0].data[data.datasets[0].data.length - 1];
                return <ProgressBar value={lastVal} color={themeColor} />;
            }
            case 'circularProgress': {
                const circleVal = data.datasets[0].data[data.datasets[0].data.length - 1];
                return <CircularProgress value={circleVal} color={themeColor} />;
            }
            case 'billing':
                return (
                    <BillingWidget
                        totalAmount={200000}
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded(!isExpanded)}
                    />
                );
            default:
                return null;
        }
    };

    const isBilling = type === 'billing';
    const isCompact = ['progressBar', 'circularProgress', 'billing'].includes(type);

    return (
        <div
            className={[
                styles.chartWrapper,
                isCompact ? styles.compact : '',
                isBilling ? styles.popOver : '',
                isExpanded ? styles.expanded : '',
            ].filter(Boolean).join(' ')}
            style={{
                zIndex: isExpanded ? 50 : 1,
                overflow: isBilling ? 'visible' : undefined,
            }}
        >
            <div className={styles.chartHeader}>
                <div className={styles.titleGroup}>
                    <span className={styles.chartTitle}>{title}</span>
                    {config?.fieldname && (
                        <div className={styles.liveIndicator}>
                            <div className={styles.dot} />
                            Live
                        </div>
                    )}
                    {type === 'progressBar' && (
                        <span className={styles.percentageBadge}>
                            {data.datasets[0].data[data.datasets[0].data.length - 1]}%
                        </span>
                    )}
                </div>
                {isEditMode && (
                    <div className={styles.headerActions}>
                        <button
                            className={styles.settingsBtn}
                            data-no-drag
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSettingsClick) onSettingsClick();
                            }}
                            title="Configure Chart"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                        <button
                            className={styles.deleteBtn}
                            data-no-drag
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete();
                            }}
                            title="Delete Chart"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div
                className={styles.chartContent}
                style={isBilling ? { overflow: 'visible' } : {
                    height: '100%',
                    width: '100%',
                    position: 'relative'
                }}
            >
                {renderChart()}
            </div>

            {isEditMode && onResizeStart && (
                <div
                    className={styles.resizeHandle}
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