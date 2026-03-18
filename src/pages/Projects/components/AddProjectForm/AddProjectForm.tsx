import React, { useState } from 'react';
import styles from './AddProjectForm.module.scss';

interface AddProjectFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label htmlFor="name">Project Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter project description"
                    rows={4}
                />
            </div>

            <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                    Create Project
                </button>
            </div>
        </form>
    );
};

export default AddProjectForm;
