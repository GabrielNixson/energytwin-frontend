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
    onRelocate?: () => void;
    autoRotate?: boolean;
    onToggleAutoRotate?: () => void;
}

const ModelContextMenu: React.FC<ModelContextMenuProps> = ({ x, y, onClose, onDelete, onDuplicate, onCopy, onLinkToTab, onRelocate, autoRotate, onToggleAutoRotate }) => {
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
                        Link to Active Tab
                    </button>
                )}
                {onRelocate && (
                    <button onClick={() => { onRelocate(); onClose(); }}>
                        Relocate Asset
                    </button>
                )}
                
                <button onClick={() => { onDuplicate(); onClose(); }}>
                    Duplicate
                </button>
                <button onClick={() => { onCopy(); onClose(); }}>
                    Copy
                </button>
                <div className={styles.divider} />
                <button className={styles.danger} onClick={() => { onDelete(); onClose(); }}>
                    Delete
                </button>
            </div>
        </div>,
        document.body
    );
};

export default ModelContextMenu;
