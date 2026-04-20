import { RefreshIcon, SearchIcon, BellIcon, SettingsIcon, SunIcon, MoonIcon } from "../../assets/svg/Misc";
import styles from "./Navbar.module.scss";
import { useLocation, useParams } from "react-router-dom";
import { useProjectStore } from "../../store/useProjectStore";
import { useUIStore } from "../../store/useUIStore";

const Navbar = () => {
    const location = useLocation();
    const { projectID } = useParams();
    const { projects } = useProjectStore();
    const { theme, setTheme } = useUIStore();

    const currentProject = projects.find(p => p.id === projectID);



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
                    <button 
                        className={styles["icon-btn"]} 
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
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
