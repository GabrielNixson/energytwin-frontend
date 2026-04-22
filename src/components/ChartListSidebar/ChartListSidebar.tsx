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

interface ChartItemProps {
    chart: {
        label: string;
        type: string;
        icon: JSX.Element;
    };
}

const DraggableChartItem = ({ chart }: ChartItemProps) => {
    const { isEditMode } = useUIStore();
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
        >
            <div className={styles.icon}>{chart.icon}</div>
            <div className={styles.label}>{chart.label}</div>
        </div>
    );
};

interface ChartListSidebarProps {
    isOpen?: boolean;
}

const ChartListSidebar = ({ isOpen = true }: ChartListSidebarProps) => {
    const { isEditMode, is3DMode } = useUIStore();
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
                <h1>Charts</h1>
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
