import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import styles from "./ChartListSidebar.module.scss"
import { 
    AreaChartIcon, 
    BarChartIcon, 
    GaugeIcon, 
    LineChartIcon, 
    PieChartIcon, 
    SearchIcon, 
    RadarChartIcon, 
    ScatterChartIcon, 
    StackBarIcon, 
    HorizontalBarIcon, 
    CircularProgressIcon, 
    ProgressBarIcon,
    BillingIcon 
} from "./ChartListSidebarIcons";
import { useUIStore } from "@/store/useUIStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useParams } from "react-router-dom";
import { ChartData } from "@/types/chart.types";

interface ChartItemProps {
    chart: {
        label: string;
        type: string;
        icon: JSX.Element;
    };
}

const DraggableChartItem = ({ chart }: ChartItemProps) => {
    const { isEditMode, setActiveTabId } = useUIStore();
    const { projects, addChart } = useProjectStore();
    const { projectID } = useParams<{ projectID: string }>();

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditMode || !projectID) return;

        const currentProject = projects.find(p => p.id === projectID);
        if (!currentProject) return;

        // Use active tab or first tab as fallback
        const activeTabId = useUIStore.getState().activeTabId || currentProject.tabs[0]?.id;
        if (!activeTabId) return;

        const targetTab = currentProject.tabs.find(t => t.id === activeTabId);
        const currentCharts = targetTab?.charts || [];

        // Simple grid placement logic for 2D (fallback for 3D)
        let foundX = 0;
        let foundY = 0;
        let spotFound = false;

        for (let row = 0; row < 100 && !spotFound; row++) {
            for (let col = 0; col <= 8; col += 4) {
                const isOccupied = currentCharts.some(c =>
                    (col < c.x + c.w && col + 4 > c.x) &&
                    (row < c.y + c.h && row + 2 > c.y)
                );
                if (!isOccupied) {
                    foundX = col;
                    foundY = row;
                    spotFound = true;
                    break;
                }
            }
        }

        const newChart: ChartData = {
            id: `chart-${Date.now()}`,
            type: chart.type,
            title: chart.label,
            x: foundX,
            y: foundY,
            w: 4,
            h: 2,
            // 3D positioning defaults (Percentages)
            x3d: 5,
            y3d: 5,
            w3d: 500,
            h3d: 350,
            config: {
                showTooltips: true,
                showLegend: true,
                xAxisLabel: "Time",
                yAxisLabel: "Value",
                showGrid: true,
                fieldname: "",
                timerange: "-1h",
                function: "last"
            }
        };

        addChart(projectID, activeTabId, newChart);
        if (!useUIStore.getState().activeTabId) setActiveTabId(activeTabId);
    };

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `sidebar-${chart.type}`,
        disabled: !isEditMode, // Disable drag if not in edit mode
        data: {
            type: chart.type,
            label: chart.label,
            fromSidebar: true,
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div 
            ref={setNodeRef} 
            {...listeners} 
            {...attributes} 
            className={`${styles["chart-type"]} ${isDragging ? styles.dragging : ""}`}
            style={style}
            onClick={handleQuickAdd}
        >
            <div className={styles.icon}>{chart.icon}</div>
            <div className={styles.label}>{chart.label}</div>
            {isEditMode && <div className={styles.add}>+</div>}
        </div>
    );
};

interface ChartListSidebarProps {
    isOpen?: boolean;
}

const ChartListSidebar = ({ isOpen = true }: ChartListSidebarProps) => {
    const { isEditMode, is3DMode, setIsChartSidebarOpen } = useUIStore();
    const [searchQuery, setSearchQuery] = useState("");

    const chartList = [
        { label: "Bar Chart", type: "bar", icon: <BarChartIcon /> },
        { label: "Horizontal Bar", type: "horizontalBar", icon: <HorizontalBarIcon /> },
        { label: "Stacked Bar", type: "stackedBar", icon: <StackBarIcon /> },
        { label: "Line Chart", type: "line", icon: <LineChartIcon /> },
        { label: "Area Chart", type: "area", icon: <AreaChartIcon /> },
        { label: "Pie Chart", type: "pie", icon: <PieChartIcon /> },
        { label: "Radar Chart", type: "radar", icon: <RadarChartIcon /> },
        { label: "Scatter Chart", type: "scatter", icon: <ScatterChartIcon /> },
        { label: "Gauge Chart", type: "gauge", icon: <GaugeIcon /> },
        { label: "Progress Bar", type: "progressBar", icon: <ProgressBarIcon /> },
        { label: "Circular Progress", type: "circularProgress", icon: <CircularProgressIcon /> },
        { label: "Billing Details", type: "billing", icon: <BillingIcon /> },
    ]

    const filteredCharts = chartList.filter(chart =>
        chart.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // In 3D mode, we allow the sidebar to open via the toolbar toggle even if not in "Edit Mode"
    const shouldBeCollapsed = !is3DMode ? (!isEditMode || !isOpen) : !isOpen;

    return (
        <div 
            className={`${styles["chart-list-sidebar-container"]} ${shouldBeCollapsed ? styles.collapsed : ""}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={styles.header}>
                <div className={styles["title-row"]}>
                    <h1>Charts</h1>
                    <button 
                        className={styles["close-btn"]}
                        onClick={() => setIsChartSidebarOpen(false)}
                        title="Close Sidebar"
                    >
                        ✕
                    </button>
                </div>
                <div className={styles["search-box"]}>
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search charts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles["section-label"]}>Visualizations</div>

            <div className={styles["chart-list-container"]}>
                {filteredCharts.length > 0 ? (
                    filteredCharts.map((chart) => (
                        <DraggableChartItem key={chart.type} chart={chart} />
                    ))
                ) : (
                    <div className={styles["no-results"]}>No charts found</div>
                )}
            </div>
        </div>
    )
}
export default ChartListSidebar;
