import { useProjectStore } from "@/store/useProjectStore"
import Chart from "@/components/Chart/Chart"
import styles from "./Dashboard.module.scss"
import projectStyles from "../Project/Project.module.scss"
import { Project } from "../Projects/project"

const Dashboard = () => {
    const { projects } = useProjectStore();

    // Find the default project
    const defaultProject = projects.find((p: Project) => p.default) || projects[0];

    return (
        <div className={projectStyles["project-container"]} style={{ flexDirection: 'column' }}>
            <div className={styles.header}>
                <div className={styles["header-content"]}>
                    <h1>{defaultProject ? `${defaultProject.name} Dashboard` : 'Dashboard'}</h1>
                    <p>{defaultProject?.description}</p>
                </div>
            </div>
            <div className={projectStyles["chart-container"]} style={{ padding: '20px 40px 40px 40px' }}>

                {defaultProject?.charts && defaultProject.charts.length > 0 ? (
                    defaultProject.charts.map((chart) => (
                        <div
                            key={chart.id}
                            className={projectStyles["chart-item"]}
                            style={{
                                gridColumn: `${chart.x + 1} / span ${chart.w}`,
                                gridRow: `${chart.y + 1} / span ${chart.h}`,
                                cursor: 'default' // Disable grab cursor on dashboard
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
                        </div>
                    ))
                ) : (
                    <div className={styles["no-charts"]}>
                        {defaultProject
                            ? "No charts added to this project yet."
                            : "Create a project to start building your dashboard."}
                    </div>
                )}
            </div>
        </div>
    )
}
export default Dashboard;