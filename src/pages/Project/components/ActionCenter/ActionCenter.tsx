import { useUIStore } from "@/store/useUIStore";
import styles from "./ActionCenter.module.scss";

const ActionCenter = () => {
    const {
        isEditMode, setIsEditMode,
        showLabels, setShowLabels,
        showCharts, setShowCharts,
        setIsChartSidebarOpen,
        is3DMode
    } = useUIStore();

    const handleSwitchToView = () => {
        setIsEditMode(false);
        setIsChartSidebarOpen(false); // Auto-close sidebar when switching to view mode
    };

    return (
        <>
            {/* Mode Switch */}
            <div className={`${styles["mode-switch"]} ${!is3DMode ? styles.disabled : ""}`}>
                <button 
                    className={`${styles["mode-btn"]} ${!isEditMode ? styles.active : ""}`}
                    onClick={handleSwitchToView}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>View</span>
                </button>
                {is3DMode && (
                    <button 
                        className={`${styles["mode-btn"]} ${isEditMode ? styles.active : ""}`}
                        onClick={() => setIsEditMode(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>Edit</span>
                    </button>
                )}
                <div 
                    className={styles["mode-indicator"]} 
                    style={{ 
                        transform: `translateX(${isEditMode ? '100%' : '0%'})`,
                        width: is3DMode ? undefined : 'calc(100% - 6px)'
                    }}
                />
            </div>

            <div className={styles["divider"]} />

            {/* Visibility Toggles */}
            <div className={styles["visibility-group"]}>
                <button 
                    className={`${styles["toggle-btn"]} ${showLabels ? styles.active : ""}`}
                    onClick={() => setShowLabels(!showLabels)}
                    title={showLabels ? "Hide Labels" : "Show Labels"}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                    <span className={styles["btn-text"]}>Labels</span>
                    <div className={styles["status-dot"]} />
                </button>

                <button 
                    className={`${styles["toggle-btn"]} ${showCharts ? styles.active : ""}`}
                    onClick={() => {
                        const newShowCharts = !showCharts;
                        setShowCharts(newShowCharts);e
                    }}
                    title={isEditMode ? "Toggle Charts" : (showCharts ? "Hide Charts" : "Show Charts")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                    </svg>
                    <span className={styles["btn-text"]}>Charts</span>
                    <div className={styles["status-dot"]} />
                </button>
            </div>
        </>
    );
};

export default ActionCenter;
