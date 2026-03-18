import { useEffect } from "react";
import styles from "./Sidebar.module.scss";

import userImage from "./user.jpg";

import {
  OverviewIcon,
  ServicesIcon,
} from "./SidebarIcons";

import { LogoIcon } from "../../assets/svg/LogoSvg";
import { DropIcon } from "../../assets/svg/Misc";
import { useNavigate, useLocation } from "react-router-dom";
import type { OptionsType } from "./sidebar.types";
import { useUIStore } from "../../store/useUIStore";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOption, setSelectedOption, isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore()

  const options: OptionsType = [
    { label: "overview", route: "/", icon: OverviewIcon },
    { label: "projects", route: "projects", icon: ServicesIcon },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const activeOption = options.find(opt => {
      const route = opt.route === "/" ? "/" : `/${opt.route}`;
      return route === currentPath;
    });

    if (activeOption) {
      setSelectedOption(activeOption.label);
    }
  }, [location.pathname, setSelectedOption]);

  const optionsSelect = (item: any) => {
    navigate(item.route);
  };
  return (
    <div
      className={`${styles["sidebar-container"]} ${isSidebarCollapsed ? styles.collapsed : ""
        }`}
    >
      <div
        className={styles["visibility-toggle"]}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        <DropIcon />
      </div>

      <div
        className={styles["logo-container"]}
        onClick={() => navigate("/")}
      >
        <div className={styles.icon}>
          <LogoIcon />
        </div>
        <span>Energy Module</span>
      </div>

      <div className={styles["options-container"]}>
        {options.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={index}
              title={item.label}
              onClick={() => optionsSelect(item)}
              className={`${styles.option} ${selectedOption === item.label ? styles.selected : ""
                }`}
            >
              <div className={styles.icon}>
                <Icon />
              </div>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles["user-details-container"]}>
        <div className={styles["user-img"]}>
          <img src={userImage} alt="" />
        </div>

        <div className={styles["user-details"]}>
          <div className={styles["user-name"]}>Nalvazhuthi</div>
          <div className={styles["user-email"]}>nalvazhuthi03@gmail.com</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
