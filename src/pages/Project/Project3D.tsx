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
}

const PlacedModel = ({ id, path, position, rotation, name, linkedTabName, onContextMenu, isSelected, onSelect, onPointerOver, onPointerOut }: PlacedModelProps) => {
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
        
        // 🎯 STABILIZE: Center on X/Z, but pin BOTTOM to Y=0
        clone.position.set(-center.x, -box.min.y, -center.z);

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
                            // Precision fix: Increased factor to separate large overlapping planes
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = 2;
                            m.polygonOffsetUnits = 2;
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
        <Select enabled={isSelected}>
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
                    if (isClick(e)) {
                        // Select the model on right-click too for consistency
                        e.stopPropagation();
                        onSelect(groupRef.current);
                        onContextMenu(e);
                    } else {
                        // Prevent menu during pans
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                <primitive object={clonedScene} name={name} />

                {linkedTabName && (
                    <Html
                        position={[0, labelHeight, 0]}
                        center
                        distanceFactor={10}
                        style={{
                            pointerEvents: 'none',
                            zIndex: 10
                        }}
                    >
                        <div style={{
                            background: 'rgba(28, 28, 32, 0.95)',
                            backdropFilter: 'blur(12px)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(145, 126, 252, 0.6)',
                            color: '#fff',
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
                            {linkedTabName.toUpperCase()}
                        </div>
                    </Html>
                )}
            </group>
        </Select>
    );
};


const DragPreview = ({ path, positionRef }: { path: string, positionRef: React.RefObject<THREE.Vector3> }) => {
    const meshRef = useRef<THREE.Group>(null);

    // Track transition opacities and scales
    const [style, setStyle] = useState({ modelOpacity: 0, modelScale: 0.8 });

    useFrame(() => {
        if (positionRef.current && meshRef.current) {
            meshRef.current.position.copy(positionRef.current);
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

        // Pin BOTTOM to ground
        clone.position.set(-center.x, -box.min.y, -center.z);

        // 🛡️ PREVIEW STABILIZATION
        clone.traverse((child: any) => {
            if (child.isMesh) {
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m: any) => {
                        m.transparent = true;
                        m.opacity = opacity;
                        m.polygonOffset = true;
                        m.polygonOffsetFactor = -1; // Pull preview forward
                    });
                }
            }
        });
        return clone;
    }, [scene, path, opacity]);

    return (
        <group ref={meshRef} position={[0, 0, 0]}>
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

const FocusManager = ({ cameraRef, projectID }: { cameraRef: React.RefObject<any>, projectID: string }) => {
    const { scene } = useThree();
    const { activeTabId, setSelectedModelId } = useUIStore();
    const { projects } = useProjectStore();

    useEffect(() => {
        if (!cameraRef.current || !activeTabId) return;

        // console.log("FocusManager check for:", activeTabId);
        const timer = setTimeout(() => {
            const currentProject = projects.find(p => p.id === projectID);
            const tab = currentProject?.tabs.find(t => t.id === activeTabId);
            const targetId = tab?.assetId;
            const targetName = tab?.name;

            // console.log("FocusManager found tab info:", { targetId, targetName });

            if (targetId || targetName) {
                let targetObject: THREE.Object3D | null = null;

                // 1. Search for EXACT ID match first (highest priority)
                if (targetId) {
                    scene.traverse((child) => {
                        if (targetObject) return; // Stop if already found
                        // Check both userData.id and child.name (the primitive/group name)
                        if (child.userData?.id === targetId || child.name === targetId || (child.parent?.name === targetId && child.type==='Mesh')) {
                            targetObject = child;
                        }
                    });
                }

                // 2. Fallback to Name match only if ID not found or not provided
                if (!targetObject && targetName) {
                    scene.traverse((child) => {
                        if (targetObject) return;
                        if (child.name === targetName || (child.userData?.name === targetName)) {
                            targetObject = child;
                        }
                    });
                }

                if (targetObject) {
                    const target = targetObject as THREE.Object3D;
                    const objectId = target.userData?.id || target.name;
                    if (objectId) setSelectedModelId(objectId);

                    target.updateMatrixWorld(true);
                    const box = new THREE.Box3().setFromObject(target);
                    const center = new THREE.Vector3();
                    const size = new THREE.Vector3();
                    box.getCenter(center);
                    box.getSize(size);

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const distance = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(50 / 2));
                    const safeDistance = distance * 2.0;

                    cameraRef.current.setLookAt(
                        center.x + (maxDim * 0.4), center.y + (maxDim * 0.6), center.z + safeDistance,
                        center.x, center.y, center.z,
                        true
                    );
                }
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [activeTabId, scene, cameraRef, projectID, setSelectedModelId]);

    return null;
};

const Project3D = () => {
    const { projectID } = useParams<{ projectID: string }>();
    if (!projectID) return null; // Ensure projectID exists 

    const { 
        projects, 
        updateProjectCharts, 
        removeChart, 
        updateTabAssetId,
        addSceneObject,
        removeSceneObject,
        updateSceneObject
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
        isEyedropperActive,
        setIsEyedropperActive,
        setEyedropperSelection,
        setHoveredAsset
    } = useUIStore();

    // Get current project and scene data
    const currentProject = projects.find(p => p.id === projectID);
    const placedModels = currentProject?.scene || [];
    const activeTab = currentProject?.tabs.find(t => t.id === activeTabId) || currentProject?.tabs[0];
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

    const { setNodeRef } = useDroppable({
        id: '3d-overlay-area',
    });

    // We are in "Ortho" mode if a tool is selected
    const isOrthoView = !!selectedSubOption;

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

    // Handle drag state tracking for animations
    const startTimeRef = useRef(Date.now());
    useEffect(() => {
        if (draggingAsset) {
            startTimeRef.current = Date.now();
        }
    }, [!!draggingAsset]);

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
        if (!draggingAsset || !projectID) return;
        
        addSceneObject(projectID, {
            name: draggingAsset.name,
            path: draggingAsset.path,
            position: [dragPositionRef.current.x, 0, dragPositionRef.current.z],
            rotation: [0, 0, 0]
        });
        setDraggingAsset(null);
    };

    const DragTracker = () => {
        const { raycaster, camera } = useThree();
        const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

        useFrame(() => {
            if (draggingAsset) {
                raycaster.setFromCamera(mousePointer, camera);
                // Directly update the ref to ensure it's always the latest for handleDrop
                raycaster.ray.intersectPlane(plane, dragPositionRef.current);
            }
        });

        return null;
    };

    const handleModelContextMenu = (e: any, modelId: string) => {
        const domEvent = e.nativeEvent;
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
            addSceneObject(projectID, {
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
        updateTabAssetId(projectID, activeTabId, contextMenu.modelId);
        setContextMenu(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) setIsCtrlPressed(true);

            if (e.ctrlKey && e.key === 'v' && copiedModel && projectID) {
                addSceneObject(projectID, {
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
    }, [copiedModel, addSceneObject]);

    return (
        <div
            ref={(node) => {
                if (node) {
                    containerRef.current = node;
                    setNodeRef(node);
                }
            }}
            className={`${styles["three-container"]} ${isEyedropperActive ? styles["eyedropper-active"] : ""}`}
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >

            {/* Project Persistent Charts rendered as Overlays */}
            {projectCharts.map((chart) => (
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
            {uniqueOverlays.map((chart) => (
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
            {selectedModelId && (
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(20, 20, 20, 0.85)',
                    padding: '6px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setTransformMode('translate'); }}
                        style={{
                            padding: '8px 16px',
                            background: transformMode === 'translate' ? '#917efc' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>⤒</span> Move (W)
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setTransformMode('rotate'); }}
                        style={{
                            padding: '8px 16px',
                            background: transformMode === 'rotate' ? '#917efc' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>↻</span> Rotate (E)
                    </button>
                </div>
            )}

            <Suspense fallback={<div style={{ color: 'white' }}>Loading 3D Scene...</div>}>
                <Canvas 
                    shadows 
                    gl={{ 
                        antialias: true, 
                        alpha: true, 
                        logarithmicDepthBuffer: true,
                        powerPreference: "high-performance"
                    }} 
                    onPointerMissed={() => {
                        setSelectedModelId(null);
                        setSelectedObject(null);
                    }}
                >
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
                            position={[0, -0.5, 0]}
                            args={[1000, 1000]}
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
                        <axesHelper />
                        {/* Uploaded DXF Content */}
                        <DxfLayer />

                        {/* Placed 3D Models */}
                        {placedModels.map((model) => {
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
                                    onPointerOver={(e: any) => {
                                        e.stopPropagation();
                                        if (isEyedropperActive) setHoveredAsset({ name: model.name, id: model.id });
                                    }}
                                    onPointerOut={() => setHoveredAsset(null)}
                                    onSelect={(obj: THREE.Object3D) => {
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
                                    />
                                </Select>
                            </>
                        )}
                    </Selection>

                    {/* Centralized Transform Controls */}
                    {selectedObject && selectedModelId && (
                        <TransformControls
                            object={selectedObject as any}
                            mode={transformMode}
                            space={transformMode === 'translate' ? 'world' : 'local'}

                            // Snapping logic
                            translationSnap={isCtrlPressed ? 0.5 : null}
                            rotationSnap={isCtrlPressed ? Math.PI / 12 : null}

                            // Axis visibility
                            showX={transformMode === 'translate'}
                            showY={transformMode === 'rotate'} // Only show Y for rotation (upright spin), hide for Move
                            showZ={transformMode === 'translate'}

                            onMouseDown={() => setIsTransforming(true)}
                            onObjectChange={() => {
                                if (selectedObject) {
                                    if (transformMode === 'rotate') {
                                        // Robust axis lock: Always enforce perfectly upright verticality
                                        selectedObject.rotation.order = 'YXZ';
                                        selectedObject.rotation.set(0, selectedObject.rotation.y, 0);
                                    } else {
                                        // Floor lock: prevent vertical movement
                                        selectedObject.position.y = 0;
                                    }
                                }
                            }}
                            onMouseUp={() => {
                                if (projectID && selectedModelId && selectedObject) {
                                    updateSceneObject(projectID, selectedModelId, {
                                        position: [selectedObject.position.x, selectedObject.position.y, selectedObject.position.z],
                                        rotation: [selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z]
                                    });
                                }
                                setIsTransforming(false);
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
                            removeSceneObject(projectID, contextMenu.modelId);
                            setContextMenu(null);
                        }
                    }}
                    onDuplicate={handleDuplicate}
                    onCopy={handleCopy}
                    onLinkToTab={handleLinkToActiveTab}
                />
            )}
        </div>
    );
};

export default Project3D;