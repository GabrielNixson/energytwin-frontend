import { ChartData } from "../../types/chart.types";

export interface TabData {
    id: string;
    name: string;
    assetId?: string;
    charts: ChartData[];
}

export interface Asset {
    id: string;
    name: string;
    path: string;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    default?: boolean;
    tabs: TabData[];
    assets: Asset[];
}
