import { useEffect, useState, useRef } from "react";
import styles from "./Sidebar.module.scss";

import userImage from "./user.jpg";

import {
  OverviewIcon,
  ServicesIcon,
  AdminIcon,
} from "./SidebarIcons";

import { LogoIcon } from "../../assets/svg/LogoSvg";
import { DropIcon } from "../../assets/svg/Misc";
import { useNavigate, useLocation } from "react-router-dom";
import type { OptionsType } from "./sidebar.types";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BillingIcon } from "@/assets/svg/SidebarSvg";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOption, setSelectedOption, isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore()
  const { user, logout } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300); // 300ms delay to open
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // 300ms delay to close
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const options: OptionsType = [
    { label: "overview", route: "/", icon: OverviewIcon },
    { label: "projects", route: "projects", icon: ServicesIcon },
    { label: "Billing", route: "billing", icon: BillingIcon },
    { label: "Admin", route: "admin", icon: AdminIcon },
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
      className={`${styles["sidebar-container"]} ${isSidebarCollapsed && !isHovered ? styles.collapsed : ""
        }`}
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
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
        <span>Energy Twin</span>
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

      <div
        className={styles["user-details-container"]}
        onClick={(e) => {
          e.stopPropagation();
          if (isSidebarCollapsed) setIsSidebarCollapsed(false);
        }}
      >
        <div className={styles["user-img"]}>
          <img src={userImage} alt="" />
        </div>

        <div className={styles["user-details"]}>
          <div className={styles["user-name"]}>{user?.userName ?? "Guest"}</div>
          <div className={styles["user-email"]}>{user?.emailId ?? ""}</div>
        </div>

        <button
          className={styles["logout-btn"]}
          onClick={handleLogout}
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
