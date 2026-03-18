import React, { useState } from 'react';
import styles from './ChartConfigSidebar.module.scss';
import { ChartData, ChartConfig } from '@/types/chart.types';

interface ChartConfigSidebarProps {
    chart: ChartData;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<ChartData>) => void;
}

const ChartConfigSidebar: React.FC<ChartConfigSidebarProps> = ({ chart, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'style' | 'data' | 'settings'>('style');

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
        <div className={styles.sidebar}>
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
                    className={activeTab === 'data' ? styles.active : ''} 
                    onClick={() => setActiveTab('data')}
                >
                    Data
                </button>
                <button 
                    className={activeTab === 'settings' ? styles.active : ''} 
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'style' && (
                    <>
                        <div className={styles.section}>
                            <h4>Visuals</h4>
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

                {activeTab === 'data' && (
                    <div className={styles.section}>
                        <h4>Data Source</h4>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                            Bind this chart to a live IIoT data stream.
                        </p>
                        <div className={styles["input-group"]}>
                            <label>Sensor / Topic</label>
                            <select>
                                <option>Main Transformer - Load</option>
                                <option>Solar Inverter - Output</option>
                                <option>Cooling System - Temp</option>
                                <option>Custom MQTT Topic</option>
                            </select>
                        </div>
                        <div className={styles["input-group"]}>
                            <label>Aggregation</label>
                            <select>
                                <option>None (Real-time)</option>
                                <option>Average (1m)</option>
                                <option>Sum (Hourly)</option>
                                <option>Percentile (95th)</option>
                            </select>
                        </div>
                    </div>
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
                                <label>Internal ID</label>
                                <input type="text" value={chart.id} disabled style={{ opacity: 0.5 }} />
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
                    </>
                )}
            </div>
        </div>
    );
};

export default ChartConfigSidebar;
