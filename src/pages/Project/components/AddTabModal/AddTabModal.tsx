import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/Modal/Modal';
import styles from './AddTabModal.module.scss';

interface AddTabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    initialValue?: string;
    title?: string;
    existingNames?: string[];
}

const AddTabModal = ({ isOpen, onClose, onSubmit, initialValue, title, existingNames = [] }: AddTabModalProps) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setName(initialValue || "");
            setError("");
        }
    }, [isOpen, initialValue]);

    useEffect(() => {
        if (name.trim() && existingNames.some(en => en.toLowerCase() === name.trim().toLowerCase() && en !== initialValue)) {
            setError("A tab with this name already exists in this project.");
        } else {
            setError("");
        }
    }, [name, existingNames, initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && !error) {
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
                        className={error ? styles.errorInput : ""}
                    />
                    {error && <span className={styles.errorMessage}>{error}</span>}
                </div>
                <div className={styles.actions}>
                    <button type="button" onClick={onClose} className={styles.cancelButton}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={!name.trim() || !!error}>
                        {title?.includes("Rename") ? "Rename Tab" : "Create Tab"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTabModal;
