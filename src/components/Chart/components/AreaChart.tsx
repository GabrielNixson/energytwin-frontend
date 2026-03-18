import React from 'react';
import { Line } from 'react-chartjs-2';

interface AreaChartProps {
    data: any;
    options: any;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, options }) => {
    // Ensure the first dataset has fill enabled for Area Chart behavior
    const areaData = {
        ...data,
        datasets: data.datasets.map((ds: any) => ({
            ...ds,
            fill: true,
        })),
    };

    return <Line data={areaData} options={options} />;
};

export default AreaChart;
