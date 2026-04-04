import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project, TabData } from "../pages/Projects/project";
import { ChartData } from "../types/chart.types";
import { useAuthStore } from "./useAuthStore";
import socket from "../services/socket";

interface ProjectStore {
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'tabs'>) => void;
    removeProject: (id: string) => void;
    getProject: (projectId: string) => void;
    setDefaultProject: (id: string) => void;
    updateProjectCharts: (projectId: string, tabId: string, charts: ChartData[]) => void;
    addTab: (projectId: string, name: string, tabId?: string) => void;
    removeTab: (projectId: string, tabId: string) => void;
    updateTabName: (projectId: string, tabId: string, name: string) => void;
    
    addChart: (projectId: string, tabId: string, chart: ChartData) => void;
    removeChart: (projectId: string, tabId: string, chartId: string) => void;
    
    // Support functions for handling Socket.io callbacks
    _handleProjectCreated: (project: any) => void;
    _handleProjectUpdated: (project: any) => void;
    _handleProjectDeleted: (projectId: string) => void;
    _handleProjectRead: (data: any) => void;
    _handleTabCreated: (data: any) => void;
    _handleTabUpdated: (data: any) => void;
    _handleTabDeleted: (data: any) => void;
    _handleChartCreated: (data: any) => void;
    _handleChartUpdated: (data: any) => void;
    _handleChartDeleted: (data: any) => void;
    
    initSocket: () => void;
}

const mapProject = (p: any): Project => ({
    id: p._id || p.id,
    name: p.name,
    description: p.description || '',
    createdAt: p.createdAt || new Date().toISOString(),
    default: p.default || false,
    tabs: (p.tabs || []).map(mapTab)
});

const mapTab = (t: any): TabData => ({
    id: t._id || t.id,
    name: t.name,
    charts: (t.charts || []).map(mapChart)
});

const mapChart = (c: any): ChartData => ({
    id: c._id || c.id,
    type: c.type || c.chartData?.type,
    title: c.title || c.chartData?.title,
    x: c.chartData?.x ?? c.x,
    y: c.chartData?.y ?? c.y,
    w: c.chartData?.w ?? c.w,
    h: c.chartData?.h ?? c.h,
    x3d: c.chartData?.x3d || c.x3d,
    y3d: c.chartData?.y3d || c.y3d,
    w3d: c.chartData?.w3d || c.w3d,
    h3d: c.chartData?.h3d || c.h3d,
    config: c.configData || c.config || {}
});

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            projects: [],
            setProjects: (newProjects) => set((state) => {
                const mapped = newProjects.map(mapProject);
                // Merge projects: prefer detailed objects (with tabs) over summary objects
                const merged = mapped.map(newP => {
                    const existing = state.projects.find(p => p.id === newP.id);
                    if (existing && existing.tabs.length > 0 && newP.tabs.length === 0) {
                        return { ...newP, tabs: existing.tabs };
                    }
                    return newP;
                });
                return { projects: merged };
            }),
            
            addProject: (projectData) => {
                const userId = useAuthStore.getState().user?._id;
                if (!userId) return;
                socket.emit('project:create', { 
                    userId, 
                    projectId: 'temp_' + Date.now(),
                    name: projectData.name, 
                    description: projectData.description, 
                    default: projectData.default 
                });
            },
            
            removeProject: (id) => {
                set((state) => ({
                    projects: state.projects.filter(p => p.id !== id)
                }));
                socket.emit('project:delete', { projectId: id });
            },
            
            getProject: (projectId) => {
                socket.emit('project:readOne', { projectId });
                console.log("readOne Socket "+ projectId);
                
            },
            
            setDefaultProject: (id) => {
                // Since there"s no explicit set default API, maybe we update the project
                set((state) => ({
                    projects: state.projects.map(p => ({
                        ...p,
                        default: p.id === id
                    }))
                }));
            },
            
            // This method was originally used to bulk update charts from Dashboard
            updateProjectCharts: (projectId, tabId, charts) => {
                set((state) => ({
                    projects: state.projects.map(p => 
                        p.id === projectId ? { 
                            ...p, 
                            tabs: p.tabs.map(tab => 
                                tab.id === tabId ? { ...tab, charts } : tab
                            ) 
                        } : p
                    )
                }));

                // ONLY send updates for existing charts (real IDs)
                charts.forEach(c => {
                    const isNew = String(c.id).startsWith('temp_') || String(c.id).startsWith('chart-');
                    if (!isNew) {
                        socket.emit('chart:update', {
                            chartId: c.id,
                            chartData: { 
                                x: c.x, y: c.y, w: c.w, h: c.h, 
                                x3d: c.x3d, y3d: c.y3d, w3d: c.w3d, h3d: c.h3d,
                                title: c.title, type: c.type 
                            },
                            configData: c.config
                        });
                    }
                });
            },
            
            addChart: (projectId, tabId, chart) => {
                // Optimistically add it
                set((state) => ({
                    projects: state.projects.map(p => 
                        p.id === projectId ? { 
                            ...p, 
                            tabs: p.tabs.map(tab => 
                                tab.id === tabId ? { ...tab, charts: [...tab.charts, chart] } : tab
                            ) 
                        } : p
                    )
                }));
                socket.emit('chart:create', {
                    projectId,
                    tabId,
                    chartData: { 
                        chartId: chart.id, // the frontend generated temp ID
                        type: chart.type, 
                        title: chart.title, 
                        x: chart.x, 
                        y: chart.y, 
                        w: chart.w, 
                        h: chart.h 
                    },
                    configData: chart.config
                });
            },
            
            removeChart: (projectId, tabId, chartId) => {
                set((state) => ({
                    projects: state.projects.map(p => 
                        p.id === projectId ? { 
                            ...p, 
                            tabs: p.tabs.map(tab => 
                                tab.id === tabId ? { ...tab, charts: tab.charts.filter(c => c.id !== chartId) } : tab
                            ) 
                        } : p
                    )
                }));
                socket.emit('chart:delete', { tabId, chartId });
            },
            
            addTab: (projectId, name, tabId) => {
                const tempTabId = tabId || 'temp_' + Date.now();
                set((state) => ({
                    projects: state.projects.map(p => 
                        p.id === projectId ? {
                            ...p,
                            tabs: [...p.tabs, { id: tempTabId, name, charts: [] }]
                        } : p
                    )
                }));
                socket.emit('tab:create', {
                    projectId,
                    data: { tabId: tempTabId, name }
                });
            },
            
            removeTab: (projectId, tabId) => {
                set((state) => ({
                    projects: state.projects.map(p => p.id === projectId ? {
                        ...p,
                        tabs: p.tabs.filter(t => t.id !== tabId)
                    } : p)
                }));
                socket.emit('tab:delete', { projectId, tabId });
            },
            
            updateTabName: (_projectId, tabId, name) => {
                socket.emit('tab:update', { tabId, data: { name } });
            },

            // Socket response handlers
            _handleProjectCreated: (project) => set((state) => {
                if (state.projects.find(p => p.id === project._id)) return state;
                return { projects: [...state.projects, mapProject(project)] };
            }),
            
            _handleProjectUpdated: (project) => set((state) => ({
                projects: state.projects.map(p => p.id === project._id ? mapProject(project) : p)
            })),
            
            _handleProjectDeleted: (projectId) => set((state) => ({
                projects: state.projects.filter(p => p.id !== projectId)
            })),
            
            _handleProjectRead: (data) => set((state) => {
                console.log("project:read:response", data);
                if (data.success && data.data) {
                    const fullProject = mapProject(data.data);
                    // Update if exists, otherwise add
                    const projectExists = state.projects.find(p => p.id === fullProject.id);
                    if (projectExists) {
                        return { projects: state.projects.map(p => p.id === fullProject.id ? fullProject : p) };
                    }
                    return { projects: [...state.projects, fullProject] };
                }
                return state;
            }),
            
            _handleTabCreated: (data) => set((state) => {
                console.log("tab:created/response", data);
                if (!data) return state;

                const tab = data.tab || data;
                if (!tab || (!tab._id && !tab.id)) return state;

                // If projectId is missing, try to find the correct project by name (best guess fallback)
                let targetProjectId: string | undefined = data.projectId;
                if (!targetProjectId) {
                    targetProjectId = state.projects.find(p => p.tabs.some(t => 
                        (String(t.id).startsWith('temp_') || String(t.id).startsWith('tab-')) && t.name === (tab.name || tab.tab?.name)
                    ))?.id;
                }

                if (!targetProjectId) return state;

                const pid = targetProjectId as string;

                return {
                    projects: state.projects.map(p => p.id === pid ? {
                        ...p, tabs: [
                            ...p.tabs.filter(t => {
                                const tabId = tab._id || tab.id;
                                const isRealMatch = t.id === tabId;
                                const isOptimisticMatch = 
                                    (String(t.id).startsWith('temp_') || String(t.id).startsWith('tab-') || String(t.id).length < 15) && 
                                    t.name === tab.name;
                                return !isRealMatch && !isOptimisticMatch;
                            }), 
                            mapTab(tab)
                        ]
                    } : p)
                };
            }),
            
             _handleTabUpdated: (data) => set((state) => {
                console.log("tab:updated broadcast", data);
                const tab = data.tab || data;
                const tabId = tab._id || tab.id;
                
                return {
                    projects: state.projects.map(p => ({
                        ...p,
                        tabs: p.tabs.map(t => t.id === tabId ? mapTab(tab) : t)
                    }))
                };
            }),
            
            _handleTabDeleted: (data) => set((state) => {
                console.log("tab:deleted broadcast", data);
                if (!data) return state;
                
                // Be very robust: check data.tab._id, data.tabId, data.id, or data itself
                const tab = data.tab || data;
                const tabId = tab._id || tab.id || data.tabId || (typeof data === 'string' ? data : undefined);
                
                if (!tabId) return state;
                
                return {
                    projects: state.projects.map(p => ({
                        ...p,
                        tabs: p.tabs.filter(t => t.id !== tabId)
                    }))
                };
            }),
            
            _handleChartCreated: (data) => set((state) => {
                console.log("chart:created broadcast/response received:", data);
                const chart = data.chart || data;
                if (!chart || (!chart._id && !chart.id)) {
                    console.warn("Invalid chart data received in broadcast", data);
                    return state;
                }
                
                let targetProjectId = data.projectId || chart.projectId;
                let targetTabId = data.tabId || chart.tabId;

                console.log(`Initial targets - Project: ${targetProjectId}, Tab: ${targetTabId}`);

                // Fallback: If projectId or tabId is missing, try to find them
                if (!targetProjectId || !targetTabId) {
                    console.log("Target IDs missing, attempting fallback search...");
                    for (const p of state.projects) {
                        for (const t of p.tabs) {
                            // 1. Check if this tab matches our targetTabId (for Window B observers)
                            if (targetTabId && t.id === targetTabId) {
                                console.log(`Found project ${p.id} which owns tab ${t.id}`);
                                targetProjectId = p.id;
                                break;
                            }
                            
                            // 2. Check for optimistic match (for creator Window A)
                            const isOptimisticMatch = t.charts.some(c => 
                                (String(c.id).startsWith('temp_') || String(c.id).startsWith('chart-')) &&
                                c.x === (chart.chartData?.x ?? chart.x) &&
                                c.y === (chart.chartData?.y ?? chart.y)
                            );
                            
                            if (isOptimisticMatch) {
                                console.log(`Found optimistic match in Project: ${p.id}, Tab: ${t.id}`);
                                targetProjectId = p.id;
                                if (!targetTabId) targetTabId = t.id;
                                break;
                            }
                        }
                        if (targetProjectId) break;
                    }
                }

                if (!targetProjectId || !targetTabId) {
                    console.warn("Could not determine target project or tab for chart creation", chart);
                    return state;
                }

                // Remove the corresponding temp chart and insert the real one
                return {
                    projects: state.projects.map(p => p.id === targetProjectId ? {
                        ...p, tabs: p.tabs.map(t => t.id === targetTabId ? {
                            ...t, 
                            // Try to remove a temp chart that matches this one's coordinates and type
                            charts: [
                                ...t.charts.filter(c => {
                                    const realId = chart._id || chart.id;
                                    const isRealMatch = c.id === realId;
                                    const isOptimisticMatch = 
                                        (String(c.id).startsWith('temp_') || String(c.id).startsWith('chart-')) 
                                        && c.x === (chart.chartData?.x ?? chart.x) 
                                        && c.y === (chart.chartData?.y ?? chart.y);
                                    return !isRealMatch && !isOptimisticMatch;
                                }), 
                                mapChart(chart)
                            ]
                        } : t)
                    } : p)
                };
            }),
            
            _handleChartUpdated: (data) => set((state) => {
                console.log("chart:updated broadcast", data);
                const chart = data.chart || data;
                const chartId = chart._id || chart.id || (chart as any).chartId || (data as any).chartId;

                return {
                    projects: state.projects.map(p => ({
                        ...p,
                        tabs: p.tabs.map(t => ({
                            ...t,
                            charts: t.charts.map(c => c.id === chartId ? mapChart(chart) : c)
                        }))
                    }))
                };
            }),
            
            _handleChartDeleted: (data) => set((state) => {
                console.log("chart:deleted broadcast", data);
                if (!data) return state;
                
                // Be very robust: check data.chart._id, data.chartId, data.id, or data itself
                const chart = data.chart || data;
                const chartId = chart._id || chart.id || data.chartId || (typeof data === 'string' ? data : undefined);
                
                if (!chartId) return state;

                return {
                    projects: state.projects.map(p => ({
                        ...p,
                        tabs: p.tabs.map(t => ({
                            ...t,
                            charts: t.charts.filter(c => c.id !== chartId)
                        }))
                    }))
                };
            }),
            
            initSocket: () => {
                const store = get();
                console.log("Initializing Socket Listeners...");
                
                socket.off('project:created').on('project:created', (data: any) => {
                    console.log("project:created broadcast", data);
                    store._handleProjectCreated(data);
                });
                socket.off('project:create:response').on('project:create:response', (data: any) => {
                    console.log("project:create:response", data);
                    data.success && store._handleProjectCreated(data.data);
                });
                socket.off('project:updated').on('project:updated', store._handleProjectUpdated);
                socket.off('project:deleted').on('project:deleted', store._handleProjectDeleted);
                socket.off('project:delete:response').on('project:delete:response', (data: any) => {
                    console.log("project:delete:response", data);
                    data.success && store._handleProjectDeleted(data.projectId || data.id);
                });
                socket.off('project:read:response').on('project:read:response', store._handleProjectRead);
                
                socket.off('tab:created').on('tab:created', store._handleTabCreated);
                socket.off('tab:create:response').on('tab:create:response', (data: any) => {
                    console.log("tab:create:response", data);
                    data.success && store._handleTabCreated(data.data);
                });
                socket.off('tab:updated').on('tab:updated', store._handleTabUpdated);
                socket.off('tab:deleted').on('tab:deleted', store._handleTabDeleted);
                socket.off('tab:delete:response').on('tab:delete:response', (data: any) => {
                    console.log("tab:delete:response", data);
                    data.success && store._handleTabDeleted(data.data || { tabId: data.tabId || data.id });
                });
                
                socket.off('chart:created').on('chart:created', store._handleChartCreated);
                socket.off('chart:create:response').on('chart:create:response', (data: any) => {
                    console.log("chart:create:response", data);
                    data.success && store._handleChartCreated(data.data);
                });
                socket.off('chart:updated').on('chart:updated', store._handleChartUpdated);
                socket.off('chart:deleted').on('chart:deleted', store._handleChartDeleted);
                socket.off('chart:delete:response').on('chart:delete:response', (data: any) => {
                    console.log("chart:delete:response", data);
                    data.success && store._handleChartDeleted(data.data || { tabId: data.tabId, chartId: data.chartId || data.id });
                });
            }
        }),
        {
            name: "project-store",
            version: 2,
            partialize: (state) => ({
                projects: state.projects.map(p => ({
                    ...p,
                    tabs: p.tabs.map(t => ({ ...t, charts: [] }))
                }))
            })
        }
    )
);
