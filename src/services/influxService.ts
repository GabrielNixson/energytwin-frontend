import api from './api';

export interface SensorChild {
    id: string;
    label: string;
}

export interface SensorParent {
    id: string;
    label: string;
    children: SensorChild[];
}

export interface InfluxInputResponse {
    [key: string]: {
        [metric: string]: string; // "float", etc.
    };
}

const formatLabel = (str: string) => {
    // Convert camelCase or PascalCase to "Pascal Case"
    // e.g., pcConsumption1 -> PC Consumption 1
    // e.g., AvgAmp -> Avg Amp
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/([0-9]+)/g, ' $1')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
};

const influxService = {
    getSensorInputs: async (): Promise<SensorParent[]> => {
        try {
            const response = await api.get<InfluxInputResponse>('/api/influx/getinput');
            const data = response.data;

            return Object.entries(data).map(([parentKey, childrenObj]) => ({
                id: parentKey,
                label: formatLabel(parentKey),
                children: Object.keys(childrenObj).map((childKey) => ({
                    id: childKey,
                    label: formatLabel(childKey),
                })),
            }));
        } catch (error) {
            console.error('Error fetching sensor inputs:', error);
            // Return empty or dummy data on failure to prevent crash
            return [];
        }
    },
};

export default influxService;
