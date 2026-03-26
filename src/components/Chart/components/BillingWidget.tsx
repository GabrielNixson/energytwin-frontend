import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BillingWidget.module.scss';

const ChevronDown = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

interface BillingWidgetProps {
    totalAmount?: number;
    isExpanded?: boolean;
    onToggle?: () => void;
    details?: {
        bill_start_date: string;
        bill_end_date: string;
        peak_hour_duration: string;
        night_hour_duration: string;
        peak_hour_price: number;
        night_hour_deduction_price: number;
        KVA_capacity: number;
        per_unit_price: number;
        tax_structure: {
            type: string;
            value: number;
        };
    };
}

const BillingWidget: React.FC<BillingWidgetProps> = ({
    totalAmount = 200000,
    isExpanded = false,
    onToggle,
    details = {
        bill_start_date: "2026-02-19",
        bill_end_date: "2026-03-19",
        peak_hour_duration: "09:00-18:00",
        night_hour_duration: "22:00-06:00",
        peak_hour_price: 1.73,
        night_hour_deduction_price: 0.345,
        KVA_capacity: 100,
        per_unit_price: 6.9,
        tax_structure: {
            type: "percentage",
            value: 18
        }
    }
}) => {
    return (
        // Wrapper div is needed so the absolutely-positioned dropdown
        // is scoped to this element, not clipped by chart-content overflow.
        <div className={styles.outerWrapper}>
            <div className={styles.container}>
                <div
                    className={styles.summary}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle?.();
                    }}
                >
                    <div className={styles.amountLabel}>
                        Total Amount : <span className={styles.amountValue}>{totalAmount.toLocaleString()}/</span>
                    </div>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={styles.expandIcon}
                    >
                        <ChevronDown size={24} />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, y: -8 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -8 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className={styles.detailsContainer}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.divider} />
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <tbody>
                                        <tr>
                                            <td className={styles.labelCell}>Bill Period</td>
                                            <td className={styles.valueCell}>{details.bill_start_date} → {details.bill_end_date}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Peak Duration</td>
                                            <td className={styles.valueCell}>{details.peak_hour_duration}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Night Duration</td>
                                            <td className={styles.valueCell}>{details.night_hour_duration}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Peak Price</td>
                                            <td className={styles.valueCell}>₹{details.peak_hour_price}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Night Deduction</td>
                                            <td className={styles.valueCell}>₹{details.night_hour_deduction_price}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>KVA Capacity</td>
                                            <td className={styles.valueCell}>{details.KVA_capacity} KVA</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Per Unit Price</td>
                                            <td className={styles.valueCell}>₹{details.per_unit_price}</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.labelCell}>Tax Structure</td>
                                            <td className={styles.valueCell}>{details.tax_structure.value}% {details.tax_structure.type}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BillingWidget;