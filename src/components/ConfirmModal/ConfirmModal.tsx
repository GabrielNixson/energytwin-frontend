import React from 'react';
import Modal from '../Modal/Modal';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmText?: string;
    cancelLabel?: string;
    cancelText?: string;
    isDanger?: boolean;
    type?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel,
    confirmText,
    cancelLabel,
    cancelText,
    isDanger,
    type
}) => {
    const finalConfirmLabel = confirmText || confirmLabel || "Confirm";
    const finalCancelLabel = cancelText || cancelLabel || "Cancel";
    const finalIsDanger = isDanger !== undefined ? isDanger : (type === 'danger' || type === undefined);

    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className={styles.container}>
                <div className={styles.message}>
                    {message}
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        {finalCancelLabel}
                    </button>
                    <button 
                        className={`${styles.confirmBtn} ${finalIsDanger ? styles.danger : ''}`} 
                        onClick={handleConfirm}
                    >
                        {finalConfirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
