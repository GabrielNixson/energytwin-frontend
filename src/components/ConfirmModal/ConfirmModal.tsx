import React from "react";
import Modal from "../Modal/Modal";
import styles from "./ConfirmModal.module.scss";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = 'info'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className={styles.container}>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button 
                        className={`${styles.confirmButton} ${styles[type]}`} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
