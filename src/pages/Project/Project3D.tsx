import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
    PerspectiveCamera,
    OrthographicCamera,
    Grid,
    Environment,
    Line,
    useGLTF,
    TransformControls,
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
}

const PlacedModel = ({ id, path, position, rotation, name, linkedTabName, onContextMenu, isSelected, onSelect, onPointerOver, onPointerOut, showLabels, isEditMode, autoRotate }: PlacedModelProps) => {
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

        return [clone, size.y + 0.5];
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
                    if (!isEditMode) return;
                    if (isClick(e)) {
                        // Select the model on right-click too for consistency
                        e.stopPropagation();
                        onSelect(groupRef.current);
                        onContextMenu(e);
                    } else {
                        // Prevent menu during pans
                        if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') {
                            e.nativeEvent.preventDefault();
                        } else if (typeof e.preventDefault === 'function') {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                    }
                }}
            >
                <primitive object={clonedScene} name={name} />

                {linkedTabName && showLabels && (
                    <Html
                        position={[0, labelHeight, 0]}
                        center
                        distanceFactor={10}
                        zIndexRange={[0, 10]}
                        style={{
                            pointerEvents: 'none',
                            zIndex: -1
                        }}
                    >
                        <div style={{
                            background: 'var(--surface)',
                            backdropFilter: 'blur(12px)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--accent)',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                            transform: 'translateY(-100%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            userSelect: 'none',
                            letterSpacing: '0.02em'
                        }}>
                            <span style={{ fontSize: '13px' }}>📍</span>
                            {(linkedTabName || name || "Asset").toUpperCase()}
                        </div>
                    </Html>
                )}
            </group>
        </Select>
    );
};


const DragPreview = ({ path, positionRef, rotationRef }: { path: string, positionRef: React.RefObject<THREE.Vector3>, rotationRef: React.RefObject<THREE.Euler> }) => {
    const meshRef = useRef<THREE.Group>(null);

    // Track transition opacities and scales
    const [style, setStyle] = useState({ modelOpacity: 0, modelScale: 0.8 });

    useFrame(() => {
        if (positionRef.current && meshRef.current) {
            meshRef.current.position.copy(positionRef.current);
        }
        if (rotationRef.current && meshRef.current) {
            meshRef.current.rotation.copy(rotationRef.current);
        }

        // Fast fade-in and scale-up instead of 3s loading box
        setStyle(prev => ({
            modelOpacity: THREE.MathUtils.lerp(prev.modelOpacity, 1.0, 0.15),
            modelScale: THREE.MathUtils.lerp(prev.modelScale, 1.0, 0.15)
        }));
    });

    return (
        <Suspense fallback={null}>
            <PlacedModelPreview
                path={path}
                meshRef={meshRef}
                opacity={style.modelOpacity}
                scale={style.modelScale}
            />
        </Suspense>
    );
};

const PlacedModelPreview = ({ path, meshRef, opacity, scale }: { path: string, meshRef: React.RefObject<THREE.Group>, opacity: number, scale: number }) => {
    const { scene } = useGLTF(path);
    const PREVIEW_SCALE = 4.5;

    // 🎯 STABILIZE Preview: Clone, scale, center, and apply opacity ONCE
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
            if (child.isMesh) {
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m: any) => {
                        m.transparent = true;
                        m.opacity = opacity;
                        m.side = THREE.FrontSide;
                        m.polygonOffset = true;
                        m.polygonOffsetFactor = -1; // Pull preview forward
                        m.needsUpdate = true;
                    });
                }
            }
        });
        return clone;
    }, [scene, path, opacity]);

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

const Project3D = () => {
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
        showCharts
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
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, modelId: string } | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);
    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [isRelocating, setIsRelocating] = useState(false);
    const [relocatingAssetId, setRelocatingAssetId] = useState<string | null>(null);
    const dragRotationRef = useRef(new THREE.Euler(0, 0, 0));

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
            position: [dragPositionRef.current.x, 0, dragPositionRef.current.z],
            rotation: [0, 0, 0]
        });
        setDraggingAsset(null);
    };

    const DragTracker = ({ relocating }: { relocating?: boolean } = {}) => {
        const { raycaster, camera, scene } = useThree();
        const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

        useFrame(() => {
            if (draggingAsset || relocating) {
                raycaster.setFromCamera(mousePointer, camera);

                // Smart Raycasting: Try hitting geometry first (walls, floors, etc.)
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Filter out the ghost/preview itself and some helpers
                const validHit = intersects.find(hit => {
                    let p: any = hit.object;
                    while (p) {
                        if (p.name === 'ghost' || p.type === 'GridHelper' || p.type === 'AxesHelper') return false;
                        p = p.parent;
                    }
                    return hit.object.type === 'Mesh';
                });

                if (validHit) {
                    // Offset by 0.1 units along the normal to prevent merging into the wall
                    const offset = validHit.face ? validHit.face.normal.clone().multiplyScalar(0.1) : new THREE.Vector3(0, 0, 0);
                    dragPositionRef.current.copy(validHit.point).add(offset);

                    // Surface Alignment Rotation
                    if (validHit.face) {
                        const normal = validHit.face.normal.clone();
                        normal.applyQuaternion(validHit.object.quaternion);
                        const angle = Math.atan2(normal.x, normal.z);
                        dragRotationRef.current.set(0, angle, 0);
                    }
                } else {
                    // Fallback to ground plane
                    raycaster.ray.intersectPlane(plane, dragPositionRef.current);
                    dragRotationRef.current.set(0, 0, 0);
                }
            }
        });

        return null;
    };

    const handleModelContextMenu = (e: any, modelId: string) => {
        const domEvent = e.nativeEvent || e;
        if (domEvent.preventDefault) domEvent.preventDefault();
        
        // Use direct window coordinates for precision with fixed overlay
        setContextMenu({
            x: domEvent.clientX,
            y: domEvent.clientY,
            modelId: modelId
        });
    };

    const handleDuplicate = () => {
        if (!contextMenu || !projectID) return;
        const model = placedModels.find(m => m.id === contextMenu.modelId);
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
        if (!contextMenu) return;
        const model = placedModels.find(m => m.id === contextMenu.modelId);
        if (model) {
            setCopiedModel({ name: model.name, path: model.path });
        }
    };

    const handleLinkToActiveTab = () => {
        if (!contextMenu || !projectID || !activeTabId) return;

        // Check if asset is already linked to another tab
        const currentProject = projects.find(p => p.id === projectID);
        const existingLinkTab = currentProject?.tabs.find(t => t.assetId === contextMenu.modelId);

        if (existingLinkTab && existingLinkTab.id !== activeTabId) {
            alert(`This asset is already linked to the "${existingLinkTab.name}" tab. An asset can only be linked to one tab.`);
            setContextMenu(null);
            return;
        }

        updateTabAssetId(projectID, activeTabId, contextMenu.modelId);
        setContextMenu(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) setIsCtrlPressed(true);

            if (e.ctrlKey && e.key === 'v' && copiedModel && projectID) {
                addAsset(projectID, {
                    ...copiedModel,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0]
                });
            }

            // Transform mode shortcuts
            if (e.key.toLowerCase() === 'w') setTransformMode('translate');
            if (e.key.toLowerCase() === 'e') setTransformMode('rotate');
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
    }, [copiedModel, addAsset]);

    // Clear selection when switching out of edit mode
    useEffect(() => {
        if (!isEditMode) {
            setSelectedModelId(null);
            setSelectedObject(null);
        }
    }, [isEditMode, setSelectedModelId]);

    const handleRelocate = () => {
        if (!contextMenu) return;
        setRelocatingAssetId(contextMenu.modelId);
        setIsRelocating(true);
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
                    x={chart.x3d ?? 400}
                    y={chart.y3d ?? 200}
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
                                    h3d: updates.h !== undefined ? updates.h : c.h3d
                                } : c
                            );
                            updateProjectCharts(projectID, activeTab.id, newCharts);
                        }
                    }}
                    onDelete={() => {
                        if (projectID && activeTab) {
                            removeChart(projectID, activeTab.id, chart.id);
                        }
                    }}
                />
            ))}

            {/* Transient/Temp Overlays (for newly dropped but not yet saved, if any) */}
            {showCharts && uniqueOverlays.map((chart) => (
                <ChartOverlay
                    key={chart.id}
                    {...chart}
                    constraintsRef={containerRef}
                />
            ))}

            {/* Live Drag Preview for Charts */}
            {draggingChartPreview && (
                <div style={{ pointerEvents: 'none', opacity: 0.5 }}>
                    <ChartOverlay
                        id="preview-ghost"
                        {...draggingChartPreview}
                        w={500}
                        h={350}
                        constraintsRef={containerRef}
                    />
                </div>
            )}




            <Tools />

            {/* Transform Mode Toggle UI */}
            {isEditMode && selectedModelId && (
                <div className={styles["transform-toolbar"]}>
                    <button
                        className={`${styles["transform-btn"]} ${transformMode === 'translate' ? styles.active : ""}`}
                        onClick={(e) => { e.stopPropagation(); setTransformMode('translate'); }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="5 9 2 12 5 15" />
                            <polyline points="9 5 12 2 15 5" />
                            <polyline points="15 19 12 22 9 19" />
                            <polyline points="19 9 22 12 19 15" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <line x1="12" y1="2" x2="12" y2="22" />
                        </svg>
                        Move (W)
                    </button>
                    <button
                        className={`${styles["transform-btn"]} ${transformMode === 'rotate' ? styles.active : ""}`}
                        onClick={(e) => { e.stopPropagation(); setTransformMode('rotate'); }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6" />
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                            <path d="M3 22v-6h6" />
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                        Rotate (E)
                    </button>
                </div>
            )}

            <Suspense fallback={<div style={{ color: 'white' }}>Loading 3D Scene...</div>}>
                <Canvas
                    shadows
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: "high-performance",
                        precision: "highp",
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onPointerMissed={() => {
                        // Prevent deselection if we were just transforming something or relocating
                        if (isTransforming || (isRelocating && relocatingAssetId)) {
                             return;
                        }

                        if (isRelocating && relocatingAssetId && projectID) {
                            updateAsset(projectID, relocatingAssetId, {
                                position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z],
                                rotation: [dragRotationRef.current.x, dragRotationRef.current.y, dragRotationRef.current.z]
                            });
                            setIsRelocating(false);
                            setRelocatingAssetId(null);
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

                        <Controls ref={cameraRef} enabled={!isTransforming} />
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
                                    onPointerOver={(e: any) => {
                                        e.stopPropagation();
                                        if (isEyedropperActive) setHoveredAsset({ name: model.name, id: model.id });
                                    }}
                                    onPointerOut={() => setHoveredAsset(null)}
                                    onSelect={(obj: THREE.Object3D) => {
                                        if (isRelocating) {
                                            if (relocatingAssetId && projectID) {
                                                updateAsset(projectID, relocatingAssetId, {
                                                    position: [dragPositionRef.current.x, dragPositionRef.current.y, dragPositionRef.current.z],
                                                    rotation: [dragRotationRef.current.x, dragRotationRef.current.y, dragRotationRef.current.z]
                                                });
                                                setIsRelocating(false);
                                                setRelocatingAssetId(null);
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
                                />
                            );
                        })}

                        {/* Drag and Drop Preview */}
                        {draggingAsset && (
                            <>
                                <DragTracker />
                                <Select enabled={true}>
                                    <DragPreview
                                        path={draggingAsset.path}
                                        positionRef={dragPositionRef}
                                        rotationRef={dragRotationRef}
                                    />
                                </Select>
                            </>
                        )}
                        {/* Relocation Preview */}
                        {isRelocating && relocatingAsset && (
                            <>
                                <DragTracker relocating />
                                <Select enabled={true}>
                                    <DragPreview
                                        path={relocatingAsset.path}
                                        positionRef={dragPositionRef}
                                        rotationRef={dragRotationRef}
                                    />
                                </Select>
                            </>
                        )}
                    </Selection>

                    {/* Centralized Transform Controls */}
                    {isEditMode && selectedObject && selectedModelId && (
                        <TransformControls
                            object={selectedObject as any}
                            mode={transformMode}
                            space={transformMode === 'translate' ? 'world' : 'local'}

                            // Snapping logic
                            translationSnap={isCtrlPressed ? 0.5 : null}
                            rotationSnap={isCtrlPressed ? Math.PI / 12 : null}

                            // Axis visibility
                            showX={transformMode === 'translate'}
                            showY={transformMode === 'translate' || transformMode === 'rotate'}
                            showZ={transformMode === 'translate'}

                            onMouseDown={() => setIsTransforming(true)}
                            onObjectChange={() => {
                                if (selectedObject) {
                                    if (transformMode === 'rotate') {
                                        // Robust axis lock: Always enforce perfectly upright verticality
                                        selectedObject.rotation.order = 'YXZ';
                                        selectedObject.rotation.set(0, selectedObject.rotation.y, 0);
                                    }
                                }
                            }}
                            onMouseUp={() => {
                                if (projectID && selectedModelId && selectedObject) {
                                    updateAsset(projectID, selectedModelId, {
                                        position: [selectedObject.position.x, selectedObject.position.y, selectedObject.position.z],
                                        rotation: [selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z]
                                    });
                                }
                                // Small delay to prevent onPointerMissed from firing immediately
                                setTimeout(() => setIsTransforming(false), 100);
                            }}
                        />)}



                </Canvas>
            </Suspense>

            {contextMenu && (
                <ModelContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDelete={() => {
                        if (projectID) {
                            removeAsset(projectID, contextMenu.modelId);
                            setContextMenu(null);
                        }
                    }}
                    onDuplicate={handleDuplicate}
                    onCopy={handleCopy}
                    onLinkToTab={handleLinkToActiveTab}
                    onRelocate={handleRelocate}
                    autoRotate={placedModels.find(m => m.id === contextMenu.modelId)?.autoRotate}
                    onToggleAutoRotate={() => {
                        if (projectID) {
                            const model = placedModels.find(m => m.id === contextMenu.modelId);
                            updateAsset(projectID, contextMenu.modelId, {
                                autoRotate: !model?.autoRotate
                            });
                        }
                        setContextMenu(null);
                    }}
                />
            )}
        </div>
    );
};

export default Project3D;