import React from 'react';
import { Doughnut } from 'react-chartjs-2';

interface GaugeChartProps {
    data: any;
    options: any;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ data, options }) => {
    return <Doughnut data={data} options={options} />;
};

export default GaugeChart;
