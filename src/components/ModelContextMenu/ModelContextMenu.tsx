import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ModelContextMenu.module.scss';

interface ModelContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onCopy: () => void;
}

const ModelContextMenu: React.FC<ModelContextMenuProps> = ({ x, y, onClose, onDelete, onDuplicate, onCopy }) => {
    return createPortal(
        <div 
            className={styles.overlay} 
            onClick={onClose} 
            onContextMenu={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <div 
                className={styles.menu} 
                style={{ left: x, top: y }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={() => { onDuplicate(); onClose(); }}>
                    <span className={styles.icon}>📋</span>
                    Duplicate
                </button>
                <button onClick={() => { onCopy(); onClose(); }}>
                    <span className={styles.icon}>✂️</span>
                    Copy
                </button>
                <div className={styles.divider} />
                <button className={styles.danger} onClick={() => { onDelete(); onClose(); }}>
                    <span className={styles.icon}>🗑️</span>
                    Delete
                </button>
            </div>
        </div>,
        document.body
    );
};

export default ModelContextMenu;
