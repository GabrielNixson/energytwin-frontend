import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import styles from './CircularProgress.module.scss';

interface CircularProgressProps {
    value: number; // 0 to 100
    showPercentage?: boolean;
    color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value = 36, showPercentage = true, color = "#a855f7" }) => {
    const data = {
        datasets: [
            {
                data: [value, 100 - value],
                backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
                borderWidth: 0,
                borderRadius: [10, 0],
                hoverBackgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
            },
        ],
    };

    const options = {
        cutout: '80%',
        responsive: true,
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className={styles.container}>
            <div className={styles.chartWrapper}>
                <Doughnut data={data} options={options} />
                <div className={styles.inner}>
                    {showPercentage && <span className={styles.percentage}>{value}%</span>}
                </div>
            </div>
        </div>
    );
};

export default CircularProgress;
