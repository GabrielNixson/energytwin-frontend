import React from 'react';
import { Bar } from 'react-chartjs-2';

interface BarChartProps {
  data: any;
  options: any;
}

const BarChart: React.FC<BarChartProps> = ({ data, options }) => {
  const updatedData = {
    ...data,
    datasets: data.datasets.map((dataset: any) => ({
      ...dataset,
      borderRadius: {
        topLeft: 8,
        topRight: 8,
        bottomLeft: 0,
        bottomRight: 0,
      },
      // ❌ don't use borderSkipped: false here
    })),
  };

  return <Bar data={updatedData} options={options} />;
};

export default BarChart;