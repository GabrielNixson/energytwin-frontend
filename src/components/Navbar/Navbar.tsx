import { useState, useEffect, useRef } from "react";
import { RefreshIcon, BellIcon, SunIcon, MoonIcon } from "../../assets/svg/Misc";
import styles from "./Navbar.module.scss";
import { useUIStore } from "../../store/useUIStore";
import { NotificationDropdown } from "./NotificationDropdown/NotificationDropdown";
import { useLocation, useNavigate } from "react-router-dom";
import { LogoIcon } from "@/assets/svg/LogoSvg";

const initialNotifications = [
    {
        id: 1,
        type: "share",
        title: "Project Shared",
        message: "Nalvazhuthi shared the 'Smart City IIoT' project with you as an Editor.",
        time: "5 mins ago",
        isUnread: true,
        users: [{
            name: "Nalvazhuthi",
            avatar: "https://ui-avatars.com/api/?name=Nalvazhuthi&background=7c5dfa&color=fff"
        }]
    },
    {
        id: 2,
        type: "alert",
        title: "High Energy Usage",
        message: "HVAC Unit #3 in Server Room has exceeded its normal threshold by 15%.",
        time: "10 mins ago",
        isUnread: true,
    },
    {
        id: 3,
        type: "share",
        title: "Collaborators Added",
        message: "Sowmya, Developer, and 2 others joined your project.",
        time: "1 hour ago",
        isUnread: true,
        users: [
            { name: "Sowmya", avatar: "https://ui-avatars.com/api/?name=Sowmya&background=10b981&color=fff" },
            { name: "Developer", avatar: "https://ui-avatars.com/api/?name=Developer&background=3b82f6&color=fff" },
            { name: "Admin", avatar: "https://ui-avatars.com/api/?name=Admin&background=f59e0b&color=fff" },
            { name: "Guest" }
        ]
    },
    {
        id: 4,
        type: "warning",
        title: "Maintenance Reminder",
        message: "Chiller #1 requires routine filter replacement.",
        time: "5 hours ago",
        isUnread: false,
    },
];

const Navbar = () => {
    const { theme, setTheme, setIsShareModalOpen, setIsSidebarCollapsed, isSidebarCollapsed } = useUIStore();
    const location = useLocation();
    const navigate = useNavigate();
    const isProjectPage = location.pathname.includes("/project/");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const notificationRef = useRef<HTMLDivElement>(null);


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
                <div className={styles["logo-section"]} onClick={() => navigate("/")}>
                    <LogoIcon />
                    <span>Energy Twin</span>
                </div>
            </div>

            <div className={styles.right}>
                <div className={styles["status-indicator"]}>
                    <div className={styles.dot}></div>
                    <span>Live Context</span>
                </div>

                <div className={styles["action-icons"]}>
                    <button
                        className={styles["icon-btn"]}
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>

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

                    {isProjectPage && (
                        <button
                            className={`${styles["icon-btn"]} ${styles["share-nav-btn"]}`}
                            title="Share Project"
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                        </button>
                    )}
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

                <button
                    className={styles["hamburger-menu"]}
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Navbar;

