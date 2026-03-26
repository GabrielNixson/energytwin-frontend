import React from 'react';
import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
    value: number; // 0 to 100
    label?: string;
    color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value = 65, color = "#a855f7" }) => {
    const safeValue = Math.min(100, Math.max(0, value));

    return (
        <div className={styles.container}>
            <div className={styles.track}>
                <div 
                    className={styles.fill} 
                    style={{ 
                        width: `${safeValue}%`,
                        background: color,
                        boxShadow: `0 0 20px ${color}44`,
                        borderRadius: safeValue > 98 ? 'inherit' : '999px 0 0 999px'
                    }}
                />
            </div>

            <div className={styles.markers}>
                {[0, 25, 50, 75, 100].map(v => (
                    <div
                        key={v}
                        className={`${styles.marker} ${safeValue >= v ? styles.active : ''}`}
                        style={{ left: `${v}%` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProgressBar;