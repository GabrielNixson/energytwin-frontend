import styles from "./styles/App.module.scss";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import Navbar from "./components/Navbar/Navbar";
import Project from "./pages/Project/Project";

const App = () => {
  return (
    <div className={styles["app-container"]}>
      <Sidebar />
      <div className={styles.content}>
        <Navbar />
        <div className={styles["content-container"]}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="project/:projectID" element={<Project />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
