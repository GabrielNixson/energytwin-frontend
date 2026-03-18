export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    default?: boolean;
    charts?: any[]; // Using any[] here to avoid circular dependencies or keep it simple, but better if we can import ChartData
}
