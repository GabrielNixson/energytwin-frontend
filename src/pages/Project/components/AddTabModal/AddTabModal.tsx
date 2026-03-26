import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/Modal/Modal';
import styles from './AddTabModal.module.scss';

interface AddTabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    initialValue?: string;
    title?: string;
}

const AddTabModal = ({ isOpen, onClose, onSubmit, initialValue, title }: AddTabModalProps) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName(initialValue || "");
        }
    }, [isOpen, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title || "Add New Tab"}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Tab Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Room A, Energy Stats..."
                        autoFocus
                    />
                </div>
                <div className={styles.actions}>
                    <button type="button" onClick={onClose} className={styles.cancelButton}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={!name.trim()}>
                        Create Tab
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTabModal;
