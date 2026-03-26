import { ChartData } from "../../types/chart.types";

export interface TabData {
    id: string;
    name: string;
    charts: ChartData[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    default?: boolean;
    tabs: TabData[];
}
