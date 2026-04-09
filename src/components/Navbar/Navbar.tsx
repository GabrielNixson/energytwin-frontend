import { RefreshIcon, SearchIcon, BellIcon, SettingsIcon } from "../../assets/svg/Misc";
import styles from "./Navbar.module.scss";
import { useLocation, useParams } from "react-router-dom";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";

const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

const Navbar = () => {
    const location = useLocation();
    const { projectID } = useParams();
    const { projects } = useProjectStore();
    const { theme, setTheme } = useUIStore();

    const currentProject = projects.find(p => p.id === projectID);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
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
                    <button className={styles["icon-btn"]} title="Notifications">
                        <BellIcon />
                        <div className={styles.badge}></div>
                    </button>
                    <button className={styles["icon-btn"]} title="Toggle Theme" onClick={toggleTheme}>
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button className={styles["icon-btn"]} title="Settings">
                        <SettingsIcon />
                    </button>
                </div>

                <div className={styles["refresh-container"]}>
                    <div className="icon">
                        <RefreshIcon />
                    </div>
                    <span>refresh</span>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
