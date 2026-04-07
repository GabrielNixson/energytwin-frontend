import { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import styles from './AssetSidebar.module.scss';
import { SearchIcon } from '../ChartListSidebar/ChartListSidebarIcons';

const assets = [
    {
        id: 'main-office',
        name: 'Office Systems',
        models: [
            { name: 'Structural Floor Plan', path: '/models/office floor plan structural.glb' },
            { name: 'Office Digital Twin', path: '/models/Energy Analysis Digital Twin Office Model.glb' }
        ]
    },
    {
        id: 'hvac',
        name: 'HVAC Units',
        models: [
            { name: 'Air Conditioner', path: '/models/Air Conditioner.glb' }
        ]
    }
];

interface AssetSidebarProps {
    isOpen?: boolean;
}

const AssetSidebar = ({ isOpen: propIsOpen }: AssetSidebarProps) => {
    const { isAssetSidebarOpen: storeIsOpen, addPlacedModel, setDraggingAsset } = useUIStore();
    const isAssetSidebarOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
    const [searchQuery, setSearchQuery] = useState("");

    const handleAddModel = (model: { name: string, path: string }) => {
        addPlacedModel({
            name: model.name,
            path: model.path,
            position: [0, 0, 0]
        });
    };

    const handleDragStart = (e: React.DragEvent, model: { name: string, path: string }) => {
        e.dataTransfer.setData('application/json', JSON.stringify(model));
        e.dataTransfer.effectAllowed = 'copy';
        
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        setDraggingAsset({ ...model, position: [0, 0, 0] });
    };

    const handleDragEnd = () => {
        setDraggingAsset(null);
    };

    const filteredCategories = assets.map(category => ({
        ...category,
        models: category.models.filter(m => 
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.models.length > 0);

    return (
        <div 
            className={`${styles["asset-list-sidebar-container"]} ${!isAssetSidebarOpen ? styles.collapsed : ""}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={styles.header}>
                <h1>Assets</h1>
                <div className={styles["search-box"]}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles["asset-list-container"]}>
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                        <div key={category.id} className={styles.section}>
                            <div className={styles["section-label"]}>{category.name}</div>
                            {category.models.map(model => (
                                <div 
                                    key={model.name} 
                                    className={styles["asset-item"]}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, model)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className={styles.icon}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M9 3v18" />
                                        </svg>
                                    </div>
                                    <div className={styles.label}>{model.name}</div>
                                    <div 
                                        className={styles.add}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddModel(model);
                                        }}
                                    >+</div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className={styles["no-results"]}>No assets found</div>
                )}
            </div>
        </div>
    );
};

export default AssetSidebar;
