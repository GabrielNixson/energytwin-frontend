import { useState, useEffect, useRef } from "react";
import styles from "./Projects.module.scss";
import Modal from "../../components/Modal/Modal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import AddProjectForm from "./components/AddProjectForm/AddProjectForm";
import { useProjectStore } from "../../store/useProjectStore";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/store/useUIStore";
import AIChat from "@/components/AIChat/AIChat";

const Projects = () => {
  const navigate = useNavigate();
  const { projects, addProject, removeProject, setDefaultProject } =
    useProjectStore();
  const { setIsSidebarCollapsed } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string; name?: string }>({
    isOpen: false,
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleAddProject = (data: { name: string; description: string }) => {
    addProject({ ...data, assets: [] });
    handleCloseModal();
  };

  const [newlyCreatedIds, setNewlyCreatedIds] = useState<Set<string>>(new Set());
  const prevProjectsRef = useRef(projects);

  useEffect(() => {
    // Detect truly new projects (IDs that didn't exist before)
    const newlyAdded = projects.filter(
      (p) => !prevProjectsRef.current.some((prevP) => prevP.id === p.id)
    );

    if (newlyAdded.length > 0) {
      const newIds = newlyAdded.map((p) => p.id);
      setNewlyCreatedIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });

      // Remove IDs after animation completes (3 seconds for safety)
      const timer = setTimeout(() => {
        setNewlyCreatedIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);

      return () => clearTimeout(timer);
    }

    prevProjectsRef.current = projects;
  }, [projects]);

  return (
    <div className={styles["project-container"]}>
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>Projects</h1>
          <div className={styles.subheader}>Manage and track your projects</div>
        </div>
        <div className={styles.actions}>
          <button type="submit" onClick={handleOpenModal}>
            Add Project
          </button>
        </div>
      </div>

      <div className={styles["project-list"]}>
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className={styles["project-card"]}
              onClick={() => {
                setIsSidebarCollapsed(true);
                navigate(`/project/${project.id}`);
              }}
            >
              {newlyCreatedIds.has(project.id) && (
                <div className={styles["shine-overlay"]} />
              )}
              <div className={styles["card-header"]}>
                <h3>{project.name}</h3>
                <span className={styles.date}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              {project.default && (
                <div className={styles.defaultIndicator}>Default</div>
              )}
              <p className={styles.description}>
                {project.description || "No description provided."}
              </p>
              <div className={styles["card-footer"]}>
                {!project.default && (
                  <button
                    className={styles["default-btn"]}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultProject(project.id);
                    }}
                  >
                    Set as Default
                  </button>
                )}
                <button
                  className={styles["remove-btn"]}
                  onClick={(e) => openDeleteConfirm(e, project.id, project.name)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles["empty-state"]}>
            <p>No projects yet.</p>
            <button className={styles["create-btn"]} onClick={handleOpenModal}>
              Create your first project
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Project"
      >
        <AddProjectForm
          onSubmit={handleAddProject}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false })}
        // onConfirm={handleRemoveProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        type="danger"
      />

      <AIChat />
    </div>
  );
};
export default Projects;
