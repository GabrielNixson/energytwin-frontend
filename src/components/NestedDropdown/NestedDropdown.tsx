import React, { useState, useRef, useEffect } from 'react';
import styles from './NestedDropdown.module.scss';
import { SensorParent } from '@/services/influxService';

interface NestedDropdownProps {
    data: SensorParent[];
    value?: string; // e.g. "pcConsumption1.AvgAmp"
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

const NestedDropdown: React.FC<NestedDropdownProps> = ({
    data,
    value,
    onChange,
    placeholder = "Select Sensor / Topic",
    label
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeParentId, setActiveParentId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse the current value to find selected parent and child labels for display
    const [selectedParentId, selectedChildId] = value ? value.split('.') : [null, null];
    
    const selectedParent = data.find(p => p.id === selectedParentId);
    const selectedChild = selectedParent?.children.find(c => c.id === selectedChildId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Set active parent to selected parent when opening if nothing else is active
    useEffect(() => {
        if (isOpen && !activeParentId) {
            setActiveParentId(selectedParentId || (data.length > 0 ? data[0].id : null));
        }
    }, [isOpen, selectedParentId, data]);

    const handleSelect = (parentId: string, childId: string) => {
        onChange(`${parentId}.${childId}`);
        setIsOpen(false);
    };

    const activeParent = data.find(p => p.id === activeParentId);

    return (
        <div className={styles.container} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div 
                className={`${styles["dropdown-btn"]} ${isOpen ? styles.open : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles["selected-value"]}>
                    {selectedParent && selectedChild ? (
                        <>
                            <span className={styles["parent-name"]}>{selectedParent.label}</span>
                            <span className={styles["path-separator"]}>/</span>
                            <span>{selectedChild.label}</span>
                        </>
                    ) : (
                        <span className={styles.placeholder}>{placeholder}</span>
                    )}
                </div>
                <div className={styles.chevron}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    {data.length > 0 ? (
                        <>
                            <div className={styles["parents-list"]}>
                                {data.map(parent => (
                                    <div 
                                        key={parent.id}
                                        className={`${styles["parent-item"]} ${activeParentId === parent.id ? styles.active : ''}`}
                                        onMouseEnter={() => setActiveParentId(parent.id)}
                                        onClick={() => setActiveParentId(parent.id)}
                                    >
                                        <span>{parent.label}</span>
                                        <span className={styles.arrow}>→</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles["children-list"]}>
                                {activeParent ? (
                                    activeParent.children.map(child => (
                                        <div 
                                            key={child.id}
                                            className={`${styles["child-item"]} ${selectedParentId === activeParent.id && selectedChildId === child.id ? styles.selected : ''}`}
                                            onClick={() => handleSelect(activeParent.id, child.id)}
                                        >
                                            {child.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles["no-data"]}>Select a category</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles["no-data"]}>No sensors available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NestedDropdown;
