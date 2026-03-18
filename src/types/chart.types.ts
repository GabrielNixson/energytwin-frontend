export interface ChartConfig {
    showTooltips: boolean;
    showLegend: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    yAxisMax?: number;
    xAxisMax?: number;
    colorScheme?: string;
    showGrid: boolean;
}

export interface ChartData {
    id: string;
    type: string;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isGhost?: boolean;
    isHidden?: boolean;
    config: ChartConfig;
}
