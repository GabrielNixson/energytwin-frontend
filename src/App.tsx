import styles from "./styles/App.module.scss";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Billing from "./pages/Billing/Billing";
import Admin from "./pages/Admin/Admin";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import Navbar from "./components/Navbar/Navbar";
import Project from "./pages/Project/Project";
import Auth from "./pages/Auth/Auth";
import SSOCallback from "./pages/Auth/SSOCallback";
import DeviceManagement from "./pages/DeviceManagement/DeviceManagement";
import EdgeDetails from "./pages/DeviceManagement/EdgeDetails";
import { useAuthStore } from "./store/useAuthStore";
import { useProjectStore } from "./store/useProjectStore";
import { useUIStore } from "./store/useUIStore";
import { initializeSocket, disconnectSocket, socket } from "./services/socket";
import { adminService } from "./services/adminService";

const App = () => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { initSocket } = useProjectStore();
  const { theme } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Logged in user details:", user);
      console.log("Initializing socket for user:", user._id);
      initializeSocket(user._id);
      initSocket();

      // Fetch user role details by ID
      const roleId =
        user.roleId ||
        (typeof user.role === "string"
          ? user.role
          : user.role?._id || user.role?.id);
      console.log("roleId", roleId);
      if (roleId) {
        adminService
          .getRoleById(roleId)
          .then((role) => {
            console.log("Logged in user role details:", role);
            useAuthStore.getState().setUserRole(role);
          })
          .catch((err) => {
            console.error("Failed to fetch user role details:", err);
          });
      }

      // Fetch initial data
      socket.emit("project:readAll", { userId: user._id });

      const handleReadAllResponse = (data: any) => {
        console.log("project:readAll:response received", data.success);
        if (data.success && data.data) {
          useProjectStore.getState().setProjects(data.data);
        }
      };

      socket.on("project:readAll:response", handleReadAllResponse);

      return () => {
        socket.off("project:readAll:response", handleReadAllResponse);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user, initSocket]);

  return (
    <div className={styles["app-container"]}>
      {isAuthenticated && <Sidebar />}
      <div className={styles.content}>
        {isAuthenticated && <Navbar />}
        <div className={styles["content-container"]}>
          <Routes>
            {/* SSO callback routes — always accessible, regardless of auth state */}
            <Route path="/auth/sso-success" element={<SSOCallback />} />
            <Route path="/auth/error" element={<SSOCallback />} />

            {!isAuthenticated ? (
              <Route path="*" element={<Auth />} />
            ) : (
              <>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="project/:projectID" element={<Project />} />
                <Route path="billing" element={<Billing />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="admin" element={<Admin />} />
                <Route
                  path="device-management"
                  element={<DeviceManagement />}
                />
                <Route path="device-management/:id" element={<EdgeDetails />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
// Test
