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
    onLinkToTab?: () => void;
}

const ModelContextMenu: React.FC<ModelContextMenuProps> = ({ x, y, onClose, onDelete, onDuplicate, onCopy, onLinkToTab }) => {
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
                {onLinkToTab && (
                    <button onClick={() => { onLinkToTab(); onClose(); }}>
                        <div className={styles.icon}>🔗</div>
                        Link to Active Tab
                    </button>
                )}
                <button onClick={() => { onDuplicate(); onClose(); }}>
                    <div className={styles.icon}>📁</div>
                    Duplicate
                </button>
                <button onClick={() => { onCopy(); onClose(); }}>
                    <div className={styles.icon}>✂️</div>
                    Copy
                </button>
                <div className={styles.divider} />
                <button className={styles.danger} onClick={() => { onDelete(); onClose(); }}>
                    <div className={styles.icon}>🗑️</div>
                    Delete
                </button>
            </div>
        </div>,
        document.body
    );
};

export default ModelContextMenu;
