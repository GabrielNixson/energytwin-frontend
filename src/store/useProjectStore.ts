import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "../pages/Projects/project";

interface ProjectStore {
    projects: Project[];
    addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
    removeProject: (id: string) => void;
    setDefaultProject: (id: string) => void;
    updateProjectCharts: (id: string, charts: any[]) => void;
}

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set) => ({
            projects: [],
            addProject: (projectData) => set((state) => ({
                projects: [
                    ...state.projects,
                    {
                        ...projectData,
                        id: Math.random().toString(36).substring(2, 9),
                        createdAt: new Date().toISOString(),
                        charts: [],
                    }
                ]
            })),
            removeProject: (id) => set((state) => ({
                projects: state.projects.filter(p => p.id !== id)
            })),
            setDefaultProject: (id) => set((state) => ({
                projects: state.projects.map(p => ({
                    ...p,
                    default: p.id === id
                }))
            })),
            updateProjectCharts: (id, charts) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === id ? { ...p, charts } : p
                )
            })),
        }),
        {
            name: "project-store",
        }
    )
);
