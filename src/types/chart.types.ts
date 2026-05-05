export interface ChartConfig {
    showTooltips: boolean;
    showLegend: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    yAxisMax?: number;
    xAxisMax?: number;
    showGrid: boolean;
    color?: string;
    gaugeStart?: number;
    gaugeMin?: number;
    gaugeMax?: number;
    gaugeEnd?: number;
    sensorTopic?: string;
    fieldname?: string;
    timerange?: string;
    function?: string;
}

export interface ChartData {
    id: string;
    type: string;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    // 3D Overlay positions (pixels relative to anchor)
    x3d?: number;
    y3d?: number;
    w3d?: number;
    h3d?: number;
    anchorX?: 'left' | 'right';
    anchorY?: 'top' | 'bottom';
    isGhost?: boolean;
    isHidden?: boolean;
    config: ChartConfig;
}
