import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './CustomDropdown.module.scss';

interface Option {
    id: string;
    label: string;
    description?: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string | null;
    onChange: (id: string) => void;
    placeholder?: string;
    label?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option",
    label
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number, width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (triggerRef.current && !triggerRef.current.contains(target) && !target.closest(`.${styles["options-list"]}`)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div 
                ref={triggerRef}
                className={`${styles.dropdown} ${isOpen ? styles.open : ''}`} 
                onClick={toggleDropdown}
            >
                <div className={styles["selected-value"]}>
                    {selectedOption ? selectedOption.label : <span className={styles.placeholder}>{placeholder}</span>}
                </div>
                <div className={styles.chevron}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {isOpen && menuPosition && createPortal(
                <div 
                    className={styles["options-list"]}
                    style={{
                        top: menuPosition.top + 8,
                        left: menuPosition.left,
                        width: menuPosition.width
                    }}
                >
                    {options.map(option => (
                        <div 
                            key={option.id} 
                            className={`${styles.option} ${option.id === value ? styles.selected : ''}`}
                            onClick={() => handleSelect(option.id)}
                        >
                            <div className={styles["option-label"]}>{option.label}</div>
                            {option.description && <div className={styles["option-description"]}>{option.description}</div>}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className={styles["no-options"]}>No options available</div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default CustomDropdown;
