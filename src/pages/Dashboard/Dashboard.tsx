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

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getResponsiveSpan = (span: number) => {
        if (windowWidth < 768) return 12; // Full width on mobile/small tablet
        if (windowWidth < 1280) return Math.min(span * 1.5, 12); // Slightly larger on medium screens
        return span;
    };

    return (
        <div className={projectStyles["project-container"]} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className={styles.header}>
                <div className={styles["header-content"]}>
                    <div className={styles["top-row"]}>
                        <div className={styles["title-section"]}>
                            <h1>Dashboard Overview</h1>
                            <p>Real-time monitoring across your projects</p>
                        </div>

                        {currentProject && currentProject.tabs.length > 0 && (
                            <div className={projectStyles["tab-bar-wrapper"]} style={{ margin: 0 }}>
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
                padding: windowWidth < 640 ? '12px' : (windowWidth < 1024 ? '20px' : '32px'),
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gridAutoRows: windowWidth > 2000 ? '300px' : (windowWidth < 640 ? '140px' : '160px'),
                gap: windowWidth < 640 ? '12px' : '24px',
                alignContent: 'start',
            }}>
                <AnimatePresence mode="wait">
                    {activeTab?.charts && activeTab.charts.length > 0 ? (
                        activeTab.charts.map((chart) => {
                            const span = Math.round(getResponsiveSpan(chart.w));
                            return (
                                <motion.div
                                    key={`${selectedProjectId}-${activeTabId}-${chart.id}`}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                    transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                                    className={projectStyles["chart-item"]}
                                    style={{
                                        gridColumn: windowWidth < 768
                                            ? '1 / -1'
                                            : `span ${span}`,
                                        gridRow: `span ${chart.h}`,
                                        position: 'relative',
                                        zIndex: 1,
                                        minHeight: '200px'
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
                            );
                        })
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