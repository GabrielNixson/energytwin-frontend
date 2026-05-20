import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
    PerspectiveCamera,
    OrthographicCamera,
    Grid,
    Environment,
    Line,
    useGLTF,
    Html
} from '@react-three/drei';
import {
    Selection,
    Select,
    EffectComposer,
    Outline
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { useDroppable } from '@dnd-kit/core';
import ChartOverlay from './components/ChartOverlay/ChartOverlay';
import Tools from '@/components/Tools/Tools';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useParams } from 'react-router-dom';
import Controls from '@/components/3D/Controls';
import ModelContextMenu from '@/components/ModelContextMenu/ModelContextMenu';
import AssetStatusCard from '@/components/3D/AssetStatusCard';
import { AssetStatus } from '@/pages/Projects/project';
import styles from './Project.module.scss';

interface PlacedModelProps {
    id: string;
    path: string;
    position: [number, number, number];
    rotation: [number, number, number];
    name: string;
    linkedTabName?: string;
    onContextMenu: (e: any) => void;
    isSelected: boolean;
    onSelect: (obj: THREE.Object3D) => void;
    onPointerOver?: (e: any) => void;
    onPointerOut?: () => void;
    showLabels?: boolean;
    isEditMode?: boolean;
    autoRotate?: boolean;
    status?: AssetStatus;
    isRelocating?: boolean;
    isRotating?: boolean;
}

const PlacedModel = ({ id, path, position, rotation, name, linkedTabName, onContextMenu, isSelected, onSelect, onPointerOver, onPointerOut, showLabels, isEditMode, autoRotate, status, isRelocating, isRotating }: PlacedModelProps) => {
    const groupRef = useRef<THREE.Group>(null!);
    const gltf = useGLTF(path) as any;
    const downPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: any) => {
        downPos.current = { x: e.clientX, y: e.clientY };
    };

    const isClick = (e: any) => {
        const dist = Math.sqrt(
            Math.pow(e.clientX - downPos.current.x, 2) +
            Math.pow(e.clientY - downPos.current.y, 2)
        );
        return dist < 10; // 10px threshold
    };

    // Auto-rotate logic (spinning idle animation)
    useFrame((_state, delta) => {
        if (autoRotate && groupRef.current) {
            groupRef.current.rotation.y += delta * 1.0;
        }
    });

    // Auto-select the object in the parent if store says this is the selected ID
    // This handles cases where selection happens outside direct 3D interaction
    useEffect(() => {
        if (isSelected && groupRef.current) {
            onSelect(groupRef.current);
        }
    }, [isSelected, onSelect]);

    // Fixed scale for visual consistency on the grid
    const DEFAULT_SCALE = 4.5;

    // 🎯 STABILIZE: Clone, scale, and center the geometry EXACTLY ONCE
    const [clonedScene, labelHeight] = useMemo(() => {
        const clone = gltf.scene.clone();
        clone.scale.set(DEFAULT_SCALE, DEFAULT_SCALE, DEFAULT_SCALE);
        clone.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // 🎯 STABILIZE: Center on X, but pin BOTTOM and BACK to (0,0,0)
        // This ensures the origin is at the base-back, making wall placement flush.
        clone.position.set(-center.x, -box.min.y, -box.min.z);

        // 🛡️ MATERIAL STABILIZATION: Fix internal z-fighting and ensure solid opaque look
        clone.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m: any) => {
                        m.transparent = false;
                        m.opacity = 1.0;
                        m.depthWrite = true;
                        m.depthTest = true;
                        m.side = THREE.FrontSide;
                        // Precision fix: Increased factor to separate large overlapping planes
                        m.polygonOffset = true;
                        m.polygonOffsetFactor = -1;
                        m.polygonOffsetUnits = -1;
                        m.needsUpdate = true;
                    });
                }
            }
        });

        return [clone, size.y + 1.5];
    }, [gltf.scene, path]);

    const handleSelect = (e: any) => {
        if (isClick(e)) {
            e.stopPropagation();
            if (e.nativeEvent) e.nativeEvent.stopPropagation();
            onSelect(groupRef.current);
        }
    };

    return (
        <Select enabled={isEditMode && isSelected}>
            <group
                ref={groupRef}
                position={position}
                rotation={rotation}
                userData={{ id, name }}
                name={id}
                onPointerDown={handlePointerDown}
                onPointerOver={onPointerOver}
                onPointerOut={onPointerOut}
                onClick={handleSelect}
                onContextMenu={(e: any) => {
                    if (isRelocating || isRotating) return;

                    // Stop propagation and prevent default browser menu
                    e.stopPropagation();
                    const domEvent = e.nativeEvent || e;
                    if (domEvent.preventDefault) domEvent.preventDefault();

                    // Trigger the context menu directly
                    onContextMenu(e);
                }}
            >
                <primitive object={clonedScene} name={name} />

                {showLabels && (
                    <AssetStatusCard
                        position={[0, labelHeight, 0]}
                        name={(linkedTabName || name || "Asset").toUpperCase()}
                        status={status || (() => {
                            const n = name.toLowerCase();
                            if (n.includes('ac') || n.includes('air')) return { type: 'warning', message: 'High Temperature Filter Alert', value: '28', unit: '°C', lastUpdated: '2M AGO' };
                            if (n.includes('fan') || n.includes('vent')) return { type: 'normal', message: 'Optimal Airflow', value: '1200', unit: 'RPM', lastUpdated: '10S AGO' };
                            if (n.includes('power') || n.includes('meter')) return { type: 'error', message: 'Voltage Fluctuation', value: '415', unit: 'V', lastUpdated: 'NOW' };
                            return { type: 'normal', message: 'System Operational', value: 'OK', unit: '', lastUpdated: 'JUST NOW' };
                        })()}
                    />
                )}
            </group>
        </Select>
    );
};


const DragPreview = ({ path, positionRef, rotationRef, instant }: { path: string, positionRef: React.RefObject<THREE.Vector3>, rotationRef: React.RefObject<THREE.Euler>, instant?: boolean }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [style, setStyle] = useState({ modelOpacity: instant ? 1.0 : 0, modelScale: instant ? 1.0 : 0.8 });

    useFrame(() => {
        if (positionRef.current && meshRef.current) {
            meshRef.current.position.copy(positionRef.current);
        }
        if (rotationRef.current && meshRef.current) {
            meshRef.current.rotation.copy(rotationRef.current);
        }

        if (!instant) {
            setStyle(prev => ({
                modelOpacity: THREE.MathUtils.lerp(prev.modelOpacity, 1.0, 0.15),
                modelScale: THREE.MathUtils.lerp(prev.modelScale, 1.0, 0.15)
            }));
        }
    });

    return (
        <Suspense fallback={null}>
            <PlacedModelPreview
                path={path}
                meshRef={meshRef}
                opacity={style.modelOpacity}
            />
        </Suspense>
    );
};

const PlacedModelPreview = ({ path, meshRef, opacity }: { path: string, meshRef: React.RefObject<THREE.Group>, opacity: number }) => {
    const { scene } = useGLTF(path);
    const PREVIEW_SCALE = 4.5;

    // 🎯 STABILIZE Preview: Clone, scale, center ONCE
    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.scale.set(PREVIEW_SCALE, PREVIEW_SCALE, PREVIEW_SCALE);
        clone.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Pin BOTTOM and BACK to (0,0,0)
        clone.position.set(-center.x, -box.min.y, -box.min.z);

        // 🛡️ PREVIEW STABILIZATION
        clone.traverse((child: any) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m: any) => {
                    m.transparent = true;
                    m.side = THREE.FrontSide;
                    m.polygonOffset = true;
                    m.polygonOffsetFactor = -1;
                    m.needsUpdate = true;
                });
            }
        });
        return clone;
    }, [scene, path]);

    // Update opacity separately without re-cloning/re-memoizing
    useEffect(() => {
        clonedScene.traverse((child: any) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m: any) => {
                    m.opacity = opacity;
                });
            }
        });
    }, [clonedScene, opacity]);

    return (
        <group ref={meshRef} position={[0, 0, 0]} name="ghost">
            <primitive object={clonedScene} visible={opacity > 0.01} />
        </group>
    );
};

const DxfLayer = () => {
    const { dxfData } = useUIStore();

    const entities = useMemo(() => {
        if (!dxfData || !dxfData.entities) return [];

        return dxfData.entities.map((entity: any, index: number) => {
            if (entity.type === 'LINE') {
                return (
                    <Line
                        key={index}
                        points={[
                            [entity.vertices[0].x, entity.vertices[0].y, 0],
                            [entity.vertices[1].x, entity.vertices[1].y, 0]
                        ]}
                        color="#00ffff"
                        lineWidth={1}
                    />
                );
            }
            if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
                const points = entity.vertices.map((v: any) => [v.x, v.y, 0]);
                if (entity.shape) points.push(points[0]);
                return (
                    <Line
                        key={index}
                        points={points}
                        color="#00ff00"
                        lineWidth={1}
                    />
                );
            }
            if (entity.type === 'CIRCLE') {
                // Approximate circle with many points for simplicity
                const points = [];
                for (let i = 0; i <= 64; i++) {
                    const angle = (i / 64) * Math.PI * 2;
                    points.push([
                        entity.center.x + Math.cos(angle) * entity.radius,
                        entity.center.y + Math.sin(angle) * entity.radius,
                        0
                    ]);
                }
                return (
                    <Line
                        key={index}
                        points={points as [number, number, number][]}
                        color="#ff00ff"
                        lineWidth={1}
                    />
                );
            }
            return null;
        });
    }, [dxfData]);

    if (!dxfData) return null;

    return (
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            {entities}
        </group>
    );
};

import FocusManager from './components/FocusManager/FocusManager';
import ShortcutManager from './components/ShortcutManager/ShortcutManager';

const Project3D = ({ isConfigOpen, projectContainerRef }: { isConfigOpen: boolean, projectContainerRef: React.RefObject<HTMLDivElement> }) => {
    const { projectID } = useParams<{ projectID: string }>();
    if (!projectID) return null; // Ensure projectID exists 

    const {
        projects,
        updateProjectCharts,
        removeChart,
        updateTabAssetId,
        addAsset,
        removeAsset,
        updateAsset
    } = useProjectStore();
    const {
        selectedSubOption,
        draggingAsset,
        setDraggingAsset,
        copiedModel,
        setCopiedModel,
        selectedModelId,
        setSelectedModelId,
        overlayCharts,
        draggingChartPreview,
        activeTabId,
        setActiveTabId,
        isEyedropperActive,
        setIsEyedropperActive,
        setEyedropperSelection,
        setHoveredAsset,
        isEditMode,
        showLabels,
        showCharts,
        setSelectedChartId
    } = useUIStore();

    // Get current project and asset data
    const currentProject = projects.find(p => p.id === projectID);
    const placedModels = currentProject?.assets || [];
    const activeTab = currentProject?.tabs.find(t => t.id === activeTabId);
    const projectCharts = activeTab?.charts || [];

    // Filter overlayCharts to only show those NOT in projectCharts (avoiding double rendering)
    const uniqueOverlays = overlayCharts.filter(oc => !projectCharts.some(pc => pc.id === oc.id));
    const cameraRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null!);
    // mousePointer is used for dragging and 3D interactions
    const mousePointer = useMemo(() => new THREE.Vector2(), []);
    const dragPositionRef = useRef(new THREE.Vector3());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'asset' | 'chart' } | null>(null);
    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [isRelocating, setIsRelocating] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [axisLock, setAxisLock] = useState<'x' | 'y' | 'z' | null>(null);
    const [relocatingAssetId, setRelocatingAssetId] = useState<string | null>(null);
    const dragRotationRef = useRef(new THREE.Euler(0, 0, 0));
    const [initialTransform, setInitialTransform] = useState<{ position: [number, number, number], rotation: [number, number, number] } | null>(null);
    const mouseStartPos = useRef({ x: 0, y: 0 });
    const initialRayPoint = useRef(new THREE.Vector3());
    const [shouldCaptureInitialRay, setShouldCaptureInitialRay] = useState(false);

    const relocatingAsset = useMemo(() => {
        if (!relocatingAssetId) return null;
        return placedModels.find(m => m.id === relocatingAssetId);
    }, [relocatingAssetId, placedModels]);

    const { setNodeRef } = useDroppable({
        id: '3d-overlay-area',
    });

    const [isOrthoManual, setIsOrthoManual] = useState(false);

    // We are in "Ortho" mode if a tool is selected OR if manually toggled (e.g., via Numpad 5)
    const isOrthoView = !!selectedSubOption || isOrthoManual;

    // 🎯 Switch camera animation automatically when view type changes
    useEffect(() => {
        if (!cameraRef.current) return;

        if (isOrthoView) {
            // TOP VIEW (Orthographic)
            cameraRef.current.setLookAt(
                0, 30, 0,  // camera position (top)
                0, 0, 0,   // target
                true       // enable transition animation
            );
        } else {
            // PERSPECTIVE VIEW
            cameraRef.current.setLookAt(
                8, 6, 10,
                0, 0, 0,
                true
            );
        }
    }, [isOrthoView]);

    // Fix: Prevent "Unable to preventDefault inside passive event listener" error
    // By explicitly registering a non-passive wheel listener on the container
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            // No action needed, presence of listener with passive: false solves the issue
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        if (draggingAsset || isRelocating) {
            startTimeRef.current = Date.now();
        }
    }, [!!draggingAsset, isRelocating]);

    const updateMousePointer = (clientX: number, clientY: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((clientY - rect.top) / rect.height) * 2 + 1;
            mousePointer.set(x, y);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        updateMousePointer(e.clientX, e.clientY);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Calculate normalized coordinates (-1 to +1)
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            mousePointer.set(x, y);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isEditMode || !draggingAsset || !projectID) return;

        addAsset(projectID, {
            name: draggingAsset.name,
            path: draggingAsset.path,
            position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z],
            rotation: [dragRotationRef.current.x, dragRotationRef.current.y, dragRotationRef.current.z]
        });
        setDraggingAsset(null);
        setAxisLock(null);
        setInitialTransform(null);
    };

    const DragTracker = ({ mode }: { mode?: 'translate' | 'rotate' } = {}) => {
        const { raycaster, camera, scene } = useThree();
        const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

        useFrame(() => {
            // Force update world matrices to ensure raycasting hits models at their new positions
            scene.updateMatrixWorld(true);

            if (shouldCaptureInitialRay) {
                raycaster.setFromCamera(mousePointer, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);
                const validHit = intersects.find(hit => {
                    let p: any = hit.object;
                    while (p) {
                        if (p.name === 'ghost' || p.type === 'GridHelper' || p.type === 'AxesHelper') return false;
                        p = p.parent;
                    }
                    return (hit.object as any).isMesh;
                });

                if (validHit) {
                    initialRayPoint.current.copy(validHit.point);
                } else {
                    raycaster.ray.intersectPlane(plane, initialRayPoint.current);
                }
                setShouldCaptureInitialRay(false);
            }

            if (draggingAsset || (isRelocating && mode === 'translate')) {
                raycaster.setFromCamera(mousePointer, camera);

                const intersects = raycaster.intersectObjects(scene.children, true);
                const validHit = intersects.find(hit => {
                    let p: any = hit.object;
                    while (p) {
                        if (p.name === 'ghost' || p.type === 'GridHelper' || p.type === 'AxesHelper') return false;
                        p = p.parent;
                    }
                    return (hit.object as any).isMesh;
                });

                let newRayPos = new THREE.Vector3();
                if (validHit) {
                    // Pull point slightly INTO the surface to ensure flushness and avoid floating gaps
                    // -0.05m (5cm) helps assets with small paddings or corner offsets look flush
                    const offset = validHit.face ? validHit.face.normal.clone().multiplyScalar(-0.05) : new THREE.Vector3(0, 0, 0);
                    newRayPos.copy(validHit.point).add(offset);
                } else {
                    raycaster.ray.intersectPlane(plane, newRayPos);
                }

                if (initialTransform) {
                    const delta = newRayPos.clone().sub(initialRayPoint.current);
                    const initPos = initialTransform.position;
                    const finalPos = new THREE.Vector3(initPos[0] + delta.x, initPos[1] + delta.y, initPos[2] + delta.z);

                    if (axisLock) {
                        if (axisLock === 'x') dragPositionRef.current.set(finalPos.x, initPos[1], initPos[2]);
                        else if (axisLock === 'y') dragPositionRef.current.set(initPos[0], finalPos.y, initPos[2]);
                        else if (axisLock === 'z') dragPositionRef.current.set(initPos[0], initPos[1], finalPos.z);
                    } else {
                        dragPositionRef.current.copy(finalPos);

                        // Surface Alignment Rotation (only when NOT axis locked)
                        if (validHit && validHit.face) {
                            const normal = validHit.face.normal.clone();
                            const worldQuaternion = new THREE.Quaternion();
                            validHit.object.getWorldQuaternion(worldQuaternion);
                            normal.applyQuaternion(worldQuaternion);

                            const angle = Math.atan2(normal.x, normal.z);
                            dragRotationRef.current.set(0, angle, 0);
                        }
                    }
                } else {
                    // Sidebar Drop: use absolute ray point
                    dragPositionRef.current.copy(newRayPos);
                    if (validHit && validHit.face) {
                        const normal = validHit.face.normal.clone();
                        normal.applyQuaternion(validHit.object.quaternion);
                        const angle = Math.atan2(normal.x, normal.z);
                        dragRotationRef.current.set(0, angle, 0);
                    }
                }

            } else if (isRotating && mode === 'rotate') {
                const deltaX = mousePointer.x - mouseStartPos.current.x;
                if (initialTransform) {
                    const sensitivity = 5;
                    const rotationDelta = deltaX * sensitivity;

                    if (axisLock === 'x') {
                        dragRotationRef.current.set(initialTransform.rotation[0] + rotationDelta, initialTransform.rotation[1], initialTransform.rotation[2]);
                    } else if (axisLock === 'z') {
                        dragRotationRef.current.set(initialTransform.rotation[0], initialTransform.rotation[1], initialTransform.rotation[2] + rotationDelta);
                    } else {
                        // Default to Y rotation
                        dragRotationRef.current.set(initialTransform.rotation[0], initialTransform.rotation[1] + rotationDelta, initialTransform.rotation[2]);
                    }
                }
            }
        });

        return null;
    };

    const AxisGuide = () => {
        if (!axisLock || !initialTransform) return null;

        const pos = [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z] as [number, number, number];
        const color = axisLock === 'x' ? '#ff4444' : axisLock === 'y' ? '#44ff44' : '#4444ff';

        const length = 1000;
        const points: [number, number, number][] = [];

        if (axisLock === 'x') {
            points.push([pos[0] - length, pos[1], pos[2]], [pos[0] + length, pos[1], pos[2]]);
        } else if (axisLock === 'y') {
            points.push([pos[0], pos[1] - length, pos[2]], [pos[0], pos[1] + length, pos[2]]);
        } else if (axisLock === 'z') {
            points.push([pos[0], pos[1], pos[2] - length], [pos[0], pos[1], pos[2] + length]);
        }

        return <Line points={points} color={color} lineWidth={1} transparent opacity={0.5} />;
    };

    const handleModelContextMenu = (e: any, id: string, type: 'asset' | 'chart' = 'asset') => {
        if (isRelocating || isRotating) return;

        // Prevent default browser context menu
        const domEvent = e.nativeEvent || e;
        if (domEvent.preventDefault) domEvent.preventDefault();

        // Extract coordinates from either native event or synthetic event
        const x = domEvent.clientX ?? e.clientX;
        const y = domEvent.clientY ?? e.clientY;

        if (x !== undefined && y !== undefined) {
            setContextMenu({
                x,
                y,
                id,
                type
            });
        }
    };

    const handleDuplicate = () => {
        if (!contextMenu || !projectID || contextMenu.type !== 'asset') return;
        const model = placedModels.find(m => m.id === contextMenu.id);
        if (model) {
            addAsset(projectID, {
                name: model.name,
                path: model.path,
                position: [model.position[0] + 2, model.position[1], model.position[2] + 2],
                rotation: model.rotation
            });
        }
    };

    const handleCopy = () => {
        if (!contextMenu || contextMenu.type !== 'asset') return;
        const model = placedModels.find(m => m.id === contextMenu.id);
        if (model) {
            setCopiedModel({ name: model.name, path: model.path });
        }
    };

    const handleLinkToActiveTab = () => {
        if (!contextMenu || !projectID || !activeTabId || contextMenu.type !== 'asset') return;

        // Check if asset is already linked to another tab
        const currentProject = projects.find(p => p.id === projectID);
        const existingLinkTab = currentProject?.tabs.find(t => t.assetId === contextMenu.id);

        if (existingLinkTab && existingLinkTab.id !== activeTabId) {
            alert(`This asset is already linked to the "${existingLinkTab.name}" tab. An asset can only be linked to one tab.`);
            setContextMenu(null);
            return;
        }

        updateTabAssetId(projectID, activeTabId, contextMenu.id);
        setContextMenu(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) setIsCtrlPressed(true);

            const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
            if (isTyping) return;

            if (e.ctrlKey && e.key === 'v' && copiedModel && projectID) {
                addAsset(projectID, {
                    ...copiedModel,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0]
                });
            }

            // Blender-style Shortcuts
            if (e.key.toLowerCase() === 'g' && selectedModelId) {
                const asset = placedModels.find(m => m.id === selectedModelId);
                if (asset) {
                    setRelocatingAssetId(selectedModelId);
                    setInitialTransform({ position: asset.position, rotation: asset.rotation });
                    dragPositionRef.current.set(...asset.position);
                    dragRotationRef.current.set(...asset.rotation);
                    setShouldCaptureInitialRay(true);
                    setIsRelocating(true);
                    setIsRotating(false);
                    setAxisLock(null);
                }
            }
            if (e.key.toLowerCase() === 'r' && selectedModelId) {
                const asset = placedModels.find(m => m.id === selectedModelId);
                if (asset) {
                    setRelocatingAssetId(selectedModelId);
                    setInitialTransform({ position: asset.position, rotation: asset.rotation });
                    dragPositionRef.current.set(...asset.position);
                    dragRotationRef.current.set(...asset.rotation);
                    mouseStartPos.current = { x: mousePointer.x, y: mousePointer.y };
                    setIsRotating(true);
                    setIsRelocating(false);
                    setAxisLock(null);
                }
            }

            // Axis Locking
            if (isRelocating || isRotating || draggingAsset) {
                if (draggingAsset && !initialTransform) {
                    setInitialTransform({ position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z], rotation: [0, 0, 0] });
                }
                if (e.key.toLowerCase() === 'x') setAxisLock(prev => prev === 'x' ? null : 'x');
                if (e.key.toLowerCase() === 'y') setAxisLock(prev => prev === 'y' ? null : 'y');
                if (e.key.toLowerCase() === 'z') setAxisLock(prev => prev === 'z' ? null : 'z');
            }

            if (e.key === 'Escape') {
                if (isRelocating || isRotating) {
                    setIsRelocating(false);
                    setIsRotating(false);
                    setRelocatingAssetId(null);
                    setAxisLock(null);
                } else {
                    setSelectedModelId(null);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [copiedModel, addAsset, selectedModelId, placedModels, projectID, mousePointer, isRelocating, isRotating]);

    // Clear selection when switching out of edit mode
    useEffect(() => {
        if (!isEditMode) {
            setSelectedModelId(null);
            setSelectedObject(null);
        }
    }, [isEditMode, setSelectedModelId]);

    const handleRelocate = () => {
        if (!contextMenu || contextMenu.type !== 'asset') return;
        const asset = placedModels.find(m => m.id === contextMenu.id);
        if (asset) {
            setRelocatingAssetId(contextMenu.id);
            setInitialTransform({ position: asset.position, rotation: asset.rotation });
            dragPositionRef.current.set(...asset.position);
            dragRotationRef.current.set(...asset.rotation);
            setShouldCaptureInitialRay(true);
            setIsRelocating(true);
            setIsRotating(false);
            setAxisLock(null);
        }
        setContextMenu(null);
    };

    return (
        <div
            ref={(node) => {
                if (node) {
                    containerRef.current = node;
                    setNodeRef(node);
                }
            }}
            id="3d-overlay-area"
            className={`${styles["three-container"]} ${isEyedropperActive ? styles["eyedropper-active"] : ""} ${isRelocating ? styles["relocating-active"] : ""}`}
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleMouseMove}
        >

            {/* Project Persistent Charts rendered as Overlays */}
            {showCharts && projectCharts.map((chart) => (
                <ChartOverlay
                    key={chart.id}
                    {...chart}
                    // Map 3D fields to expected props or fallback
                    x={chart.x3d ?? 10}
                    y={chart.y3d ?? 10}
                    w={chart.w3d ?? 400}
                    h={chart.h3d ?? 300}
                    constraintsRef={containerRef}
                    onUpdate={(updates) => {
                        if (projectID && activeTab) {
                            const newCharts = projectCharts.map(c =>
                                c.id === chart.id ? {
                                    ...c,
                                    // Update 3D specific fields primarily
                                    x3d: updates.x !== undefined ? updates.x : c.x3d,
                                    y3d: updates.y !== undefined ? updates.y : c.y3d,
                                    w3d: updates.w !== undefined ? updates.w : c.w3d,
                                    h3d: updates.h !== undefined ? updates.h : c.h3d,
                                    anchorX: updates.anchorX !== undefined ? updates.anchorX : c.anchorX,
                                    anchorY: updates.anchorY !== undefined ? updates.anchorY : c.anchorY,
                                } : c
                            );
                            console.log(`[Project3D] Requesting chart update: id=${chart.id}, x=${updates.x}%, y=${updates.y}%, anchorX=${updates.anchorX}, anchorY=${updates.anchorY}`);
                            updateProjectCharts(projectID, activeTab.id, newCharts);
                        }
                    }}
                    onDelete={() => {
                        if (projectID && activeTab) {
                            removeChart(projectID, activeTab.id, chart.id);
                        }
                    }}
                    isConfigOpen={isConfigOpen}
                    onContextMenu={(e) => {
                        handleModelContextMenu(e, chart.id, 'chart');
                    }}
                />
            ))}

            {/* Transient/Temp Overlays (for newly dropped but not yet saved, if any) */}
            {showCharts && uniqueOverlays.map((chart) => (
                <ChartOverlay
                    key={chart.id}
                    {...chart}
                    h={chart.h}
                    constraintsRef={containerRef}
                />
            ))}






            <Tools />




            <Suspense fallback={<div style={{ color: 'white' }}>Loading 3D Scene...</div>}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
                    <Canvas
                        shadows
                        gl={{
                            antialias: true,
                            alpha: true,
                            powerPreference: "high-performance",
                            precision: "highp",
                        }}
                        style={{ pointerEvents: 'auto' }}
                        onContextMenu={(e) => e.preventDefault()}
                        onPointerMissed={(e) => {
                            // Confirm on left click, cancel on right click
                            if (isRelocating || isRotating) {
                                if (e.button === 0) { // Left click
                                    if (projectID && relocatingAssetId) {
                                        updateAsset(projectID, relocatingAssetId, {
                                            position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z],
                                            rotation: [dragRotationRef.current.x, dragRotationRef.current.y, dragRotationRef.current.z]
                                        });
                                    }
                                    setIsRelocating(false);
                                    setIsRotating(false);
                                    setRelocatingAssetId(null);
                                    setAxisLock(null);
                                } else if (e.button === 2) { // Right click
                                    setIsRelocating(false);
                                    setIsRotating(false);
                                    setRelocatingAssetId(null);
                                    setAxisLock(null);
                                }
                                return;
                            }

                            setSelectedModelId(null);
                            setSelectedObject(null);
                        }}
                    >
                        <ShortcutManager
                            cameraRef={cameraRef}
                            selectedModelId={selectedModelId}
                            setIsOrthoManual={setIsOrthoManual}
                        />
                        <Selection>
                            <EffectComposer multisampling={8} autoClear={false}>
                                <Outline
                                    visibleEdgeColor={0xff9900}
                                    hiddenEdgeColor={0xff9900}
                                    edgeStrength={5}
                                />
                            </EffectComposer>

                            {/* 🎥 Cameras */}
                            {isOrthoView ? (
                                <OrthographicCamera makeDefault position={[0, 30, 0]} zoom={50} />
                            ) : (
                                <PerspectiveCamera makeDefault position={[8, 6, 10]} fov={50} />
                            )}

                            <Controls ref={cameraRef} enabled={true} />
                            <FocusManager cameraRef={cameraRef} projectID={projectID} />


                            <Grid
                                position={[0, -0.1, 0]}
                                args={[100, 100]}
                                cellSize={1}
                                cellThickness={0.7}
                                cellColor="#1a1a1a"        // visible but still dark
                                sectionSize={5}
                                sectionThickness={1.2}
                                sectionColor="#262626"     // slightly brighter for structure
                                fadeDistance={500}
                                fadeStrength={1.2}
                                infiniteGrid
                            />

                            <Environment preset="city" />
                            {/* <axesHelper /> */}
                            {/* Uploaded DXF Content */}
                            <DxfLayer />

                            {/* Placed 3D Models */}
                            {placedModels.filter(m => m.id !== relocatingAssetId).map((model) => {
                                // Find linked tab by assetId (direct link only)
                                const linkedTab = currentProject?.tabs.find(t =>
                                    t.assetId && (String(t.assetId) === String(model.id))
                                );

                                return (
                                    <PlacedModel
                                        key={model.id}
                                        id={model.id}
                                        path={model.path}
                                        position={model.position}
                                        rotation={model.rotation}
                                        name={model.name}
                                        linkedTabName={linkedTab?.name}
                                        onContextMenu={(e: any) => handleModelContextMenu(e, model.id)}
                                        isSelected={selectedModelId === model.id}
                                        showLabels={showLabels}
                                        isEditMode={isEditMode}
                                        autoRotate={model.autoRotate}
                                        isRelocating={isRelocating}
                                        isRotating={isRotating}
                                        onPointerOver={(e: any) => {
                                            e.stopPropagation();
                                            if (isEyedropperActive) setHoveredAsset({ name: model.name, id: model.id });
                                        }}
                                        onPointerOut={() => setHoveredAsset(null)}
                                        onSelect={(obj: THREE.Object3D) => {
                                            if (isRelocating || isRotating) {
                                                if (relocatingAssetId && projectID) {
                                                    updateAsset(projectID, relocatingAssetId, {
                                                        position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z],
                                                        rotation: [dragRotationRef.current.x, dragRotationRef.current.y, dragRotationRef.current.z]
                                                    });
                                                    setIsRelocating(false);
                                                    setIsRotating(false);
                                                    setRelocatingAssetId(null);
                                                    setAxisLock(null);
                                                }
                                                return;
                                            }
                                            if (!isEditMode && !isEyedropperActive) return;
                                            if (isEyedropperActive) {
                                                setEyedropperSelection({ name: model.name, id: model.id });
                                                // Also select it immediately to show focus/controls
                                                setSelectedModelId(model.id);
                                                setIsEyedropperActive(false);
                                                setHoveredAsset(null);
                                                return;
                                            }
                                            setSelectedModelId(model.id);
                                            setSelectedObject(obj);

                                            // Automatically switch to the linked tab if it exists
                                            if (linkedTab) {
                                                setActiveTabId(linkedTab.id);
                                            }
                                        }}
                                        status={model.status}
                                    />
                                );
                            })}

                            {/* Drag and Drop Preview */}
                            {draggingAsset && (
                                <>
                                    <DragTracker mode="translate" />
                                    <AxisGuide />
                                    <Select enabled={true}>
                                        <DragPreview
                                            path={draggingAsset.path}
                                            positionRef={dragPositionRef}
                                            rotationRef={dragRotationRef}
                                        />
                                    </Select>
                                </>
                            )}
                            {/* Relocation/Grab Preview */}
                            {isRelocating && relocatingAsset && (
                                <>
                                    <DragTracker mode="translate" />
                                    <AxisGuide />
                                    <Select enabled={true}>
                                        <DragPreview
                                            path={relocatingAsset.path}
                                            positionRef={dragPositionRef}
                                            rotationRef={dragRotationRef}
                                            instant
                                        />
                                    </Select>
                                </>
                            )}
                            {/* Rotation Preview */}
                            {isRotating && relocatingAsset && (
                                <>
                                    <DragTracker mode="rotate" />
                                    <AxisGuide />
                                    <Select enabled={true}>
                                        <DragPreview
                                            path={relocatingAsset.path}
                                            positionRef={dragPositionRef}
                                            rotationRef={dragRotationRef}
                                            instant
                                        />
                                    </Select>
                                </>
                            )}
                        </Selection>

                        {/* TransformControls removed in favor of Blender-style G/R shortcuts */}

                    </Canvas>
                </div>
            </Suspense>

            {contextMenu && (
                <ModelContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDelete={isEditMode ? () => {
                        if (contextMenu.type === 'asset') {
                            if (projectID) removeAsset(projectID, contextMenu.id);
                        } else {
                            if (projectID && activeTabId) removeChart(projectID, activeTabId, contextMenu.id);
                        }
                        setContextMenu(null);
                    } : undefined}
                    onDuplicate={isEditMode ? handleDuplicate : undefined}
                    onCopy={isEditMode ? handleCopy : undefined}
                    onLinkToTab={(isEditMode && contextMenu.type === 'asset') ? handleLinkToActiveTab : undefined}
                    onRelocate={(isEditMode && contextMenu.type === 'asset') ? handleRelocate : undefined}
                    onConfigure={contextMenu.type === 'chart' ? () => setSelectedChartId(contextMenu.id) : undefined}
                />
            )}
        </div>
    );
};

export default Project3D;