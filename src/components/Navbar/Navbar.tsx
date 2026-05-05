import { useState, useEffect, useRef } from "react";
import { RefreshIcon, SearchIcon, BellIcon, SettingsIcon, SunIcon, MoonIcon } from "../../assets/svg/Misc";
import styles from "./Navbar.module.scss";
import { useLocation, useParams } from "react-router-dom";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";
import { NotificationDropdown } from "./NotificationDropdown/NotificationDropdown";

const initialNotifications = [
    {
        id: 1,
        type: "alert",
        title: "High Energy Usage",
        message: "HVAC Unit #3 in Server Room has exceeded its normal threshold by 15%.",
        time: "10 mins ago",
        isUnread: true,
    },
    {
        id: 2,
        type: "info",
        title: "Floor Plan Processed",
        message: "The 3D structural extraction for 'Lobby Level' is complete.",
        time: "1 hour ago",
        isUnread: true,
    },
    {
        id: 3,
        type: "warning",
        title: "Maintenance Reminder",
        message: "Chiller #1 requires routine filter replacement.",
        time: "5 hours ago",
        isUnread: false,
    },
    {
        id: 4,
        type: "error",
        title: "Sensor Offline",
        message: "Temperature sensor in Zone A is unresponsive.",
        time: "1 day ago",
        isUnread: false,
    },
];

const Navbar = () => {
    const location = useLocation();
    const { projectID } = useParams();
    const { projects } = useProjectStore();
    const { theme, setTheme } = useUIStore();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const notificationRef = useRef<HTMLDivElement>(null);

    const currentProject = projects.find(p => p.id === projectID);

    const unreadCount = notifications.filter(n => n.isUnread).length;

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Brief delay to show animation before reload
        setTimeout(() => {
            window.location.reload();
        }, 800);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };

        if (isNotificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isNotificationOpen]);

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
    };

    const handleMarkAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isUnread: false } : n
        ));
    };

    return (
        <div className={styles["navbar-container"]}>
            <div className={styles.left}>
                {/* <div className={styles["page-info"]}>
                    <span className={styles.breadcrumb}>Pages / {getPageTitle()}</span>
                    <h2 className={styles.title}>{getPageTitle()}</h2>
                </div>
                
                <div className={styles["search-wrapper"]}>
                    <SearchIcon />
                    <input type="text" placeholder="Search data points, charts..." />
                </div> */}
            </div>

            <div className={styles.right}>
                <div className={styles["status-indicator"]}>
                    <div className={styles.dot}></div>
                    <span>Live Context</span>
                </div>

                <div className={styles["action-icons"]}>
                    <div style={{ position: "relative" }} ref={notificationRef}>
                        <button
                            className={styles["icon-btn"]}
                            title="Notifications"
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        >
                            <BellIcon />
                            {unreadCount > 0 && <div className={styles.badge}></div>}
                        </button>
                        <NotificationDropdown
                            isOpen={isNotificationOpen}
                            onClose={() => setIsNotificationOpen(false)}
                            notifications={notifications}
                            onMarkAllRead={handleMarkAllRead}
                            onMarkAsRead={handleMarkAsRead}
                        />
                    </div>
                    <button
                        className={styles["icon-btn"]}
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>
                    {/* <button className={styles["icon-btn"]} title="Settings">
                        <SettingsIcon />
                    </button> */}
                </div>

                <div
                    className={`${styles["refresh-container"]} ${isRefreshing ? styles.refreshing : ""}`}
                    onClick={handleRefresh}
                    title="Refresh data"
                >
                    <div className="icon">
                        <RefreshIcon />
                    </div>
                    <span>{isRefreshing ? "refreshing..." : "refresh"}</span>
                </div>
            </div>
        </div>
    );
};

export default Navbar;

