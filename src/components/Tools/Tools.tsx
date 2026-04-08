import { useEffect, useRef, useMemo } from "react"

import { useUIStore } from "@/store/useUIStore"
import styles from "./Tools.module.scss"

const AssetsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </svg>
);

const Tools = () => {
    const {
        isAssetSidebarOpen, setIsAssetSidebarOpen,
        isChartSidebarOpen, setIsChartSidebarOpen,
        isEyedropperActive, setIsEyedropperActive,
        isEditMode
    } = useUIStore();
    const containerRef = useRef<HTMLDivElement>(null);

    const tools = useMemo(() => [
        {
            label: "Assets",
            icon: AssetsIcon
        }
    ], []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // No local activeTool to clear anymore
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToolClick = (toolLabel: string) => {
        console.log(toolLabel)
        if (toolLabel === "Assets") {
            setIsAssetSidebarOpen(!isAssetSidebarOpen);
        }
    };

    if (!isEditMode) return null;

    return (
        <div
            className={styles["tools-container"]}
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >


            <div className={styles["tools-wrapper"]}>
                {/* Charts Toggle */}
                <div className={styles["tool-item-group"]}>
                    <button
                        className={`${styles["tool-button"]} ${isChartSidebarOpen ? styles.active : ""}`}
                        onClick={(e) => { e.stopPropagation(); setIsChartSidebarOpen(!isChartSidebarOpen); }}
                        title="Toggle Project Charts"
                    >
                        <div className={styles.icon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="12" y1="20" x2="12" y2="10" />
                                <line x1="18" y1="20" x2="18" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="16" />
                            </svg>
                        </div>
                        <div className={styles.label}>Charts List</div>
                    </button>
                </div>

                <div className={styles["tool-item-group"]}>
                    <button
                        className={`${styles["tool-button"]} ${isEyedropperActive ? styles.active : ""}`}
                        onClick={(e) => { e.stopPropagation(); setIsEyedropperActive(!isEyedropperActive); }}
                        title="Link Model to New Tab"
                    >
                        <div className={styles.icon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m2 22 1-1h3l9-9" />
                                <path d="M3 21v-3l9-9" />
                                <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l-3-3Z" />
                            </svg>
                        </div>
                        <div className={styles.label}>Add Tab</div>
                    </button>
                </div>

                {/* Other Tools (Assets) */}
                {isEditMode && tools.map((tool) => {
                    const isActive = tool.label === "Assets" ? isAssetSidebarOpen : false;
                    return (
                        <div key={tool.label} className={styles["tool-item-group"]}>
                            <button
                                className={`${styles["tool-button"]} ${isActive ? styles.active : ""}`}
                                onClick={(e) => { e.stopPropagation(); handleToolClick(tool.label); }}
                                title={`Toggle ${tool.label} Sidebar`}
                            >
                                <div className={styles.icon}>
                                    <tool.icon />
                                </div>
                                <div className={styles.label}>{tool.label}</div>
                            </button>
                        </div>
                    );
                })}
            </div>


        </div>
    );
};

export default Tools