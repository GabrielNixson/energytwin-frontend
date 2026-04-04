import { useUIStore } from '@/store/useUIStore';
import styles from './AssetSidebar.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

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

const AssetSidebar = () => {
    const { isAssetSidebarOpen, setIsAssetSidebarOpen, addPlacedModel, setDraggingAsset } = useUIStore();

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
        
        // Hide default drag image (2D ghost)
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent pixel
        e.dataTransfer.setDragImage(img, 0, 0);

        // Mark as dragging in store for 3D preview
        setDraggingAsset({ ...model, position: [0, 0, 0] });
    };

    const handleDragEnd = () => {
        // Clear drag state when finished (either dropped or cancelled)
        setDraggingAsset(null);
    };

    return (
        <AnimatePresence>
            {isAssetSidebarOpen && (
                <motion.div 
                    className={styles.sidebar}
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    <div className={styles.header}>
                        <h2>Assets</h2>
                        <button className={styles.closeBtn} onClick={() => setIsAssetSidebarOpen(false)}>×</button>
                    </div>

                    <div className={styles.content}>
                        {assets.map(category => (
                            <div key={category.id} className={styles.category}>
                                <h3>{category.name}</h3>
                                <div className={styles.modelGrid}>
                                    {category.models.map(model => (
                                        <div 
                                            key={model.name} 
                                            className={styles.modelItem}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, model)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => handleAddModel(model)}
                                        >
                                            <div className={styles.preview}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <path d="M9 3v18" />
                                                </svg>
                                            </div>
                                            <span>{model.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AssetSidebar;
