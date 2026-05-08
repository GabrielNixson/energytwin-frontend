import React, { useLayoutEffect, useRef, useState } from 'react';
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
    onConfigure?: () => void;
}

const ModelContextMenu: React.FC<ModelContextMenuProps> = ({ x, y, onClose, onDelete, onDuplicate, onCopy, onLinkToTab, onRelocate, onConfigure }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: -9999, top: -9999, flipped: false });
    const [isMeasured, setIsMeasured] = useState(false);

    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let newLeft = x;
            let newTop = y;
            let isFlipped = false;

            // Horizontal check
            if (x + rect.width > windowWidth) {
                newLeft = windowWidth - rect.width - 10;
            }

            // Vertical check - If it overflows the bottom, flip it to open upwards
            if (y + rect.height > windowHeight) {
                isFlipped = true;
            }

            // If flipped and still overflows the top, clamp it
            if (isFlipped && y - rect.height < 0) {
                newTop = 10;
                isFlipped = false; // Force it to open downwards if it's too tall for both
            }

            setPosition({ left: newLeft, top: newTop, flipped: isFlipped });
            setIsMeasured(true);
        }
    }, [x, y]);

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
                ref={menuRef}
                className={`${styles.menu} ${position.flipped ? styles.flipped : ''} ${isMeasured ? styles.visible : ''}`} 
                style={{ 
                    left: position.left, 
                    top: position.top
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {onLinkToTab && (
                    <button onClick={() => { onLinkToTab(); onClose(); }}>
                        Link to Active Tab
                    </button>
                )}
                {onConfigure && (
                    <button onClick={() => { onConfigure(); onClose(); }}>
                        Configure
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
