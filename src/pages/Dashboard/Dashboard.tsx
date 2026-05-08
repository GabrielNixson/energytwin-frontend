import { useState, useMemo, useEffect } from "react"
import { useProjectStore } from "@/store/useProjectStore"
import Chart from "@/components/Chart/Chart"
import styles from "./Dashboard.module.scss"
import projectStyles from "../Project/Project.module.scss"
import { motion, AnimatePresence } from "framer-motion"
import AIChat from "@/components/AIChat/AIChat"

const Dashboard = () => {
    const { projects, getProject } = useProjectStore();
    console.log("Dashboard rendering, projects count:", projects.length);

    // Choose active project
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    // Initialize selectedProjectId if not set
    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            const defaultProj = projects.find(p => p.default) || projects[0];
            setSelectedProjectId(defaultProj.id);
        }
    }, [projects, selectedProjectId]);
 
    useEffect(() => {
        if (selectedProjectId) {
            getProject(selectedProjectId);
        }
    }, [selectedProjectId, getProject]);

    const currentProject = useMemo(() =>
        projects.find(p => p.id === selectedProjectId),
        [projects, selectedProjectId]);

    // Choose active tab
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    // Default to first tab if not set or invalid
    useEffect(() => {
        if (currentProject) {
            if (!activeTabId || !currentProject.tabs.find(t => t.id === activeTabId)) {
                setActiveTabId(currentProject.tabs[0]?.id || null);
            }
        } else {
            setActiveTabId(null);
        }
    }, [currentProject, activeTabId]);

    const activeTab = useMemo(() =>
        currentProject?.tabs.find(t => t.id === activeTabId),
        [currentProject, activeTabId]);

    return (
        <div className={projectStyles["project-container"]} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className={styles.header}>
                <div className={styles["header-content"]}>
                    <div className={styles["top-row"]}>
                        <div className={styles["title-section"]}>
                            <h1>Dashboard Overview</h1>
                            <p>Real-time monitoring across your projects</p>
                        </div>

                        {/* <div className={styles["selector-section"]}>
                            <CustomDropdown 
                                label="Active Project"
                                options={projectOptions}
                                value={selectedProjectId}
                                onChange={handleProjectChange}
                                placeholder="Select a project..."
                            />
                        </div> */}
                        {currentProject && currentProject.tabs.length > 0 && (
                            <div className={projectStyles["tab-bar-wrapper"]}>
                                <div className={projectStyles["tab-bar"]} >
                                    {currentProject.tabs.map(tab => (
                                        <div
                                            key={tab.id}
                                            className={`${projectStyles["tab-item"]} ${activeTabId === tab.id ? projectStyles.active : ""}`}
                                            onClick={() => setActiveTabId(tab.id)}
                                        >
                                            <span className={projectStyles["tab-name"]}>{tab.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className={projectStyles["chart-container"]} style={{ 
                padding: '40px',
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gridAutoRows: '150px',
                gap: '20px',
                alignContent: 'start',
            }}>
                <AnimatePresence mode="wait">
                    {activeTab?.charts && activeTab.charts.length > 0 ? (
                        activeTab.charts.map((chart) => (
                            <motion.div
                                key={`${selectedProjectId}-${activeTabId}-${chart.id}`}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                                className={projectStyles["chart-item"]}
                                style={{
                                    gridColumn: `${chart.x + 1} / span ${chart.w}`,
                                    gridRow: `${chart.y + 1} / span ${chart.h}`,
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            >
                                <Chart
                                    id={chart.id}
                                    type={chart.type}
                                    title={chart.title}
                                    config={chart.config || {
                                        showTooltips: true,
                                        showLegend: true,
                                        xAxisLabel: 'Time',
                                        yAxisLabel: 'Value',
                                        showGrid: true,
                                    }}
                                    isEditMode={false}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={styles["no-charts"]}
                        >
                            {currentProject
                                ? "This tab doesn't have any widgets yet."
                                : "Please select or create a project to see the dashboard."}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <AIChat 
                projectId={selectedProjectId || undefined} 
                tabId={activeTabId} 
            />
        </div>
    )
}

export default Dashboard;