import React from 'react';
import styles from './ProgressBar.module.scss';

interface ProgressBarProps {
    value: number; // 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value = 65 }) => {
    return (
        <div className={styles.container}>
            <div className={styles.track}>
                <div 
                    className={styles.fill} 
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
            <div className={styles.markers}>
                {[0, 25, 50, 75, 100].map(v => (
                    <div key={v} className={styles.marker} style={{ left: `${v}%` }} />
                ))}
            </div>
        </div>
    );
};

export default ProgressBar;
