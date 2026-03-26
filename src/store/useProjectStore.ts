import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "../pages/Projects/project";
import { ChartData } from "../types/chart.types";

interface ProjectStore {
    projects: Project[];
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'tabs'>) => void;
    removeProject: (id: string) => void;
    setDefaultProject: (id: string) => void;
    updateProjectCharts: (projectId: string, tabId: string, charts: ChartData[]) => void;
    addTab: (projectId: string, name: string, tabId?: string) => void;
    removeTab: (projectId: string, tabId: string) => void;
    updateTabName: (projectId: string, tabId: string, name: string) => void;
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
                        tabs: [
                            {
                                id: 'default',
                                name: 'Main Tab',
                                charts: []
                            }
                        ],
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
            updateProjectCharts: (projectId, tabId, charts) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? { 
                        ...p, 
                        tabs: p.tabs.map(tab => 
                            tab.id === tabId ? { ...tab, charts } : tab
                        ) 
                    } : p
                )
            })),
            addTab: (projectId, name, tabId) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? {
                        ...p,
                        tabs: [
                            ...p.tabs,
                            {
                                id: tabId || Math.random().toString(36).substring(2, 9),
                                name,
                                charts: []
                            }
                        ]
                    } : p
                )
            })),
            removeTab: (projectId, tabId) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? {
                        ...p,
                        tabs: p.tabs.filter(tab => tab.id !== tabId)
                    } : p
                )
            })),
            updateTabName: (projectId, tabId, name) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? {
                        ...p,
                        tabs: p.tabs.map(tab => 
                            tab.id === tabId ? { ...tab, name } : tab
                        )
                    } : p
                )
            })),
        }),
        {
            name: "project-store",
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    return {
                        ...persistedState,
                        projects: persistedState.projects?.map((p: any) => ({
                            ...p,
                            tabs: p.tabs || [
                                {
                                    id: 'default',
                                    name: 'Main Tab',
                                    charts: p.charts || []
                                }
                            ]
                        })) || []
                    };
                }
                return persistedState;
            }
        }
    )
);
