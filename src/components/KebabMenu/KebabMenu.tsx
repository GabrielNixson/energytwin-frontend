import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './KebabMenu.module.scss';

interface KebabOption {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
}

interface KebabMenuProps {
    options: KebabOption[];
}

const KebabMenu: React.FC<KebabMenuProps> = ({ options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number, right: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY + 5,
                right: window.innerWidth - rect.right - window.scrollX
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.container}>
            <button 
                ref={buttonRef}
                className={styles.kebabBtn} 
                onClick={toggleMenu}
                aria-label="Actions"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
            </button>

            {isOpen && menuPosition && createPortal(
                <div 
                    ref={menuRef}
                    className={styles.menu}
                    style={{
                        top: menuPosition.top,
                        right: menuPosition.right
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option, idx) => (
                        <button 
                            key={idx} 
                            className={`${styles.menuItem} ${option.danger ? styles.danger : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                option.onClick();
                                setIsOpen(false);
                            }}
                        >
                            {option.icon && <span className={styles.icon}>{option.icon}</span>}
                            {option.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

export default KebabMenu;
