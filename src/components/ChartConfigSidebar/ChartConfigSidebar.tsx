import React, { useState } from 'react';
import styles from './ChartConfigSidebar.module.scss';
import { ChartData, ChartConfig } from '@/types/chart.types';
import CustomDropdown from '../CustomDropdown/CustomDropdown';
import NestedDropdown from '../NestedDropdown/NestedDropdown';
import influxService, { SensorParent } from '@/services/influxService';
import { useEffect } from 'react';

interface ChartConfigSidebarProps {
    chart: ChartData;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<ChartData>) => void;
    onDelete?: (id: string) => void;
}

const ChartConfigSidebar: React.FC<ChartConfigSidebarProps> = ({ chart, onClose, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'style' | 'advanced' | 'settings'>('style');
    const [sensorData, setSensorData] = useState<SensorParent[]>([]);

    useEffect(() => {
        const loadSensors = async () => {
            const data = await influxService.getSensorInputs();
            setSensorData(data);
        };
        loadSensors();
    }, []);

    const isProgressType = ['progressBar', 'circularProgress'].includes(chart.type);
    const supportsAxes = !['progressBar', 'circularProgress', 'pie', 'gauge', 'radar'].includes(chart.type);
    const supportsLegend = !['progressBar', 'circularProgress'].includes(chart.type);
    const supportsGrid = !['progressBar', 'circularProgress', 'pie', 'gauge', 'radar'].includes(chart.type);
    const supportsTooltips = !['progressBar', 'circularProgress'].includes(chart.type);

    const effectiveConfig = chart.config || {
        showTooltips: true,
        showLegend: true,
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
        showGrid: true,
    };

    const updateConfig = (updates: Partial<ChartConfig>) => {
        onUpdate(chart.id, {
            config: {
                ...effectiveConfig,
                ...updates
            }
        });
    };

    const renderToggle = (label: string, value: boolean, onChange: (val: boolean) => void) => (
        <div className={styles["toggle-group"]}>
            <label>{label}</label>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </label>
        </div>
    );

    return (
        <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
                <h3>Configuration</h3>
                <button className={styles["close-btn"]} onClick={onClose}>✕</button>
            </div>
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'style' ? styles.active : ''}
                    onClick={() => setActiveTab('style')}
                >
                    Style
                </button>
                <button
                    className={activeTab === 'settings' ? styles.active : ''}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
                <button
                    className={activeTab === 'advanced' ? styles.active : ''}
                    onClick={() => setActiveTab('advanced')}
                >
                    Advanced
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'style' && (
                    <>
                        <div className={styles.section}>
                            <h4>Visuals</h4>
                            <div className={styles["input-group"]}>
                                <label>Theme Color</label>
                                <div className={styles["color-input-wrapper"]}>
                                    <input
                                        type="color"
                                        value={effectiveConfig.color || '#7c5dfa'}
                                        onChange={(e) => updateConfig({ color: e.target.value })}
                                    />
                                    <span>{effectiveConfig.color || '#7c5dfa'}</span>
                                </div>
                            </div>
                            {supportsTooltips && renderToggle('Show Tooltips', effectiveConfig.showTooltips, (v) => updateConfig({ showTooltips: v }))}
                            {supportsLegend && renderToggle('Show Legend', effectiveConfig.showLegend, (v) => updateConfig({ showLegend: v }))}
                            {supportsGrid && renderToggle('Show Grid Lines', effectiveConfig.showGrid, (v) => updateConfig({ showGrid: v }))}
                            {isProgressType && (
                                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                    Standard chart visuals are not applicable for progress indicators.
                                </p>
                            )}
                        </div>

                        {supportsAxes && (
                            <div className={styles.section}>
                                <h4>Axes Configuration</h4>
                                <div className={styles["input-group"]}>
                                    <label>Y-Axis Label</label>
                                    <input
                                        type="text"
                                        value={effectiveConfig.yAxisLabel}
                                        onChange={(e) => updateConfig({ yAxisLabel: e.target.value })}
                                        placeholder="e.g. Energy (kWh)"
                                    />
                                </div>
                                <div className={styles["input-group"]}>
                                    <label>Y-Axis Max Value</label>
                                    <input
                                        type="number"
                                        value={effectiveConfig.yAxisMax || ''}
                                        onChange={(e) => updateConfig({ yAxisMax: parseInt(e.target.value) || undefined })}
                                        placeholder="Auto"
                                    />
                                </div>
                                <div className={styles["input-group"]}>
                                    <label>X-Axis Label</label>
                                    <input
                                        type="text"
                                        value={effectiveConfig.xAxisLabel}
                                        onChange={(e) => updateConfig({ xAxisLabel: e.target.value })}
                                        placeholder="e.g. Time"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'advanced' && (
                    <>
                        <div className={styles.section}>
                            <h4>Data Stream Configuration</h4>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                                Advanced binding for live IIoT data streams.
                            </p>
                            <div className={styles["input-group"]}>
                                <label>Sensor / Topic</label>
                                <NestedDropdown
                                    data={sensorData}
                                    value={effectiveConfig.fieldname}
                                    onChange={(val) => updateConfig({ fieldname: val })}
                                />
                            </div>
                            {effectiveConfig.function !== 'last' && (
                                <div className={styles["input-group"]}>
                                    <label>Time Range</label>
                                    <CustomDropdown
                                        options={[
                                            { id: '-1m', label: 'Last 1 Minute' },
                                            { id: '-5m', label: 'Last 5 Minutes' },
                                            { id: '-15m', label: 'Last 15 Minutes' },
                                            { id: '-30m', label: 'Last 30 Minutes' },
                                            { id: '-1h', label: 'Last 1 Hour' },
                                            { id: '-6h', label: 'Last 6 Hours' },
                                            { id: '-12h', label: 'Last 12 Hours' },
                                            { id: '-24h', label: 'Last 24 Hours' },
                                            { id: '-7d', label: 'Last 7 Days' },
                                            { id: '-30d', label: 'Last 30 Days' }
                                        ]}
                                        value={effectiveConfig.timerange || '-1h'}
                                        onChange={(val) => updateConfig({ timerange: val })}
                                    />
                                </div>
                            )}
                            <div className={styles["input-group"]}>
                                <label>Aggregation Function</label>
                                <CustomDropdown
                                    options={[
                                        { id: 'last', label: 'Last State (Live)' },
                                        { id: 'mean', label: 'Mean (Average)' },
                                        { id: 'sum', label: 'Sum (Total)' },
                                        { id: 'min', label: 'Minimum' },
                                        { id: 'max', label: 'Maximum' }
                                    ]}
                                    value={effectiveConfig.function || 'last'}
                                    onChange={(val) => {
                                        const updates: Partial<ChartConfig> = { function: val };
                                        if (val === 'last') updates.timerange = '-1h';
                                        updateConfig(updates);
                                    }}
                                />
                            </div>
                        </div>

                        {chart.type === 'gauge' && (
                            <div className={styles.section}>
                                <h4>Gauge Scale & Thresholds</h4>

                                <div className={styles["range-group"]}>
                                    <div className={styles["range-header"]}>
                                        <label>Start Value</label>
                                        <span className={styles["range-value"]}>{effectiveConfig.gaugeStart ?? 0}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        step="10"
                                        value={effectiveConfig.gaugeStart ?? 0}
                                        onChange={(e) => updateConfig({ gaugeStart: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className={styles["range-group"]}>
                                    <div className={styles["range-header"]}>
                                        <label>End Value (Scale Max)</label>
                                        <span className={styles["range-value"]}>{effectiveConfig.gaugeEnd ?? 1000}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="10"
                                        value={effectiveConfig.gaugeEnd ?? 1000}
                                        onChange={(e) => updateConfig({ gaugeEnd: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className={styles["range-group"]}>
                                    <div className={styles["range-header"]}>
                                        <label>Warning (Min Threshold)</label>
                                        <span className={styles["range-value"]}>{effectiveConfig.gaugeMin ?? 0}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="10"
                                        value={effectiveConfig.gaugeMin ?? 0}
                                        onChange={(e) => updateConfig({ gaugeMin: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className={styles["range-group"]}>
                                    <div className={styles["range-header"]}>
                                        <label>Danger (Max Threshold)</label>
                                        <span className={styles["range-value"]}>{effectiveConfig.gaugeMax ?? 100}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="10"
                                        value={effectiveConfig.gaugeMax ?? 100}
                                        onChange={(e) => updateConfig({ gaugeMax: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '-8px' }}>
                                    Warning triggers below Min or near Danger. Danger triggers above Max.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <>
                        <div className={styles.section}>
                            <h4>Identity</h4>
                            <div className={styles["input-group"]}>
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={chart.title}
                                    onChange={(e) => onUpdate(chart.id, { title: e.target.value })}
                                />
                            </div>
                            <div className={styles["input-group"]}>
                                <label>Chart Type</label>
                                <CustomDropdown
                                    options={[
                                        { id: 'bar', label: 'Bar Chart' },
                                        { id: 'horizontalBar', label: 'Horizontal Bar' },
                                        { id: 'stackedBar', label: 'Stacked Bar' },
                                        { id: 'line', label: 'Line Chart' },
                                        { id: 'area', label: 'Area Chart' },
                                        { id: 'pie', label: 'Pie Chart' },
                                        { id: 'radar', label: 'Radar Chart' },
                                        { id: 'scatter', label: 'Scatter Chart' },
                                        { id: 'gauge', label: 'Gauge Chart' },
                                        { id: 'progressBar', label: 'Progress Bar' },
                                        { id: 'circularProgress', label: 'Circular Progress' },
                                    ]}
                                    value={chart.type}
                                    onChange={(val: string) => onUpdate(chart.id, { type: val })}
                                />
                            </div>
                        </div>


                        <div className={styles.section}>
                            <h4>Layout</h4>
                            <div className={styles["style-grid"]}>
                                <div className={styles["input-group"]}>
                                    <label>Columns (W)</label>
                                    <input
                                        type="number"
                                        value={chart.w}
                                        onChange={(e) => onUpdate(chart.id, { w: parseInt(e.target.value) || 1 })}
                                        min="1" max="12"
                                    />
                                </div>
                                <div className={styles["input-group"]}>
                                    <label>Rows (H)</label>
                                    <input
                                        type="number"
                                        value={chart.h}
                                        onChange={(e) => onUpdate(chart.id, { h: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {onDelete && (
                            <div className={styles.section}>
                                <button 
                                    className={styles["delete-chart-btn"]}
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this chart?')) {
                                            onDelete(chart.id);
                                            onClose();
                                        }
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                    Delete Chart
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChartConfigSidebar;
