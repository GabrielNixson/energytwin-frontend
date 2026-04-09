import styles from "./styles/App.module.scss";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import Billing from "./pages/Billing/Billing";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import Navbar from "./components/Navbar/Navbar";
import Project from "./pages/Project/Project";
import Auth from "./pages/Auth/Auth";
import { useAuthStore } from "./store/useAuthStore";
import { useProjectStore } from "./store/useProjectStore";
import { initializeSocket, disconnectSocket, socket } from "./services/socket";
import { useUIStore } from "./store/useUIStore";

const App = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { initSocket } = useProjectStore();
  const { theme } = useUIStore();

  console.log("App rendering, isAuthenticated:", isAuthenticated, "userId:", user?._id);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Initializing socket for user:", user._id);
      initializeSocket(user._id);
      initSocket();
      
      // Fetch initial data
      socket.emit('project:readAll', { userId: user._id });

      const handleReadAllResponse = (data: any) => {
        console.log("project:readAll:response received", data.success);
        if (data.success && data.data) {
           useProjectStore.getState().setProjects(data.data);
        }
      };
      
      socket.on('project:readAll:response', handleReadAllResponse);

      return () => {
        socket.off('project:readAll:response', handleReadAllResponse);
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
            {!isAuthenticated ? (
              <Route path="*" element={<Auth />} />
            ) : (
              <>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="project/:projectID" element={<Project />} />
                <Route path="billing" element={<Billing />} />
                <Route path="/billing" element={<Billing />} />
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