import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
    PerspectiveCamera,
    OrthographicCamera,
    Grid,
    Environment,
    ContactShadows,
    Line,
    useGLTF,
    Outlines,
    TransformControls
} from '@react-three/drei';
import * as THREE from 'three';

// extend({ FillingMaterial }); // Removed as per request to remove loading box
import Tools from '@/components/Tools/Tools';
import { useUIStore } from '@/store/useUIStore';
import Controls from '@/components/3D/Controls';
import ModelContextMenu from '@/components/ModelContextMenu/ModelContextMenu';

const PlacedModel = ({ id, path, position, rotation, name, onContextMenu, isSelected, onSelect, children }: { id: string, path: string, position: [number, number, number], rotation: [number, number, number], name: string, onContextMenu: (e: any) => void, isSelected: boolean, onSelect: (obj: THREE.Object3D) => void, children?: React.ReactNode }) => {
    const groupRef = useRef<THREE.Group>(null!);
    const { scene } = useGLTF(path);
    const clonedScene = useMemo(() => scene.clone(), [scene]);
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

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            userData={{ id }}
            onPointerDown={handlePointerDown}
            onClick={(e) => {
                if (isClick(e)) {
                    e.stopPropagation();
                    if (e.nativeEvent) e.nativeEvent.stopPropagation(); // Prevent bubbling to DOM container
                    onSelect(groupRef.current);
                }
            }}
            onContextMenu={(e: any) => {
                if (isClick(e)) {
                    e.stopPropagation();
                    onContextMenu(e);
                }
            }}
        >
            <primitive object={clonedScene} name={name} />
            {isSelected && <Outlines color="#917efc" thickness={2} transparent opacity={1} />}
            {children}
        </group>
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

    // Optimize: Clone scene and materials only ONCE
    const clonedScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child: any) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat: THREE.Material) => {
                        const m = mat.clone();
                        m.transparent = true;
                        return m;
                    });
                } else {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                }
            }
        });
        return clone;
    }, [scene]);

    // Efficiently update opacity without re-cloning every frame
    useEffect(() => {
        clonedScene.traverse((child: any) => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat: THREE.Material) => {
                        mat.opacity = opacity;
                        mat.needsUpdate = true;
                    });
                } else {
                    child.material.opacity = opacity;
                    child.material.needsUpdate = true;
                }
            }
        });
    }, [clonedScene, opacity]);

    return <primitive ref={meshRef} object={clonedScene} visible={opacity > 0.01} scale={scale} />;
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

const Project3D = () => {
    const {
        selectedSubOption,
        placedModels,
        addPlacedModel,
        removePlacedModel,
        draggingAsset,
        setDraggingAsset,
        copiedModel,
        setCopiedModel,
        selectedModelId,
        setSelectedModelId,
        updateModelPosition,
        updateModelRotation
    } = useUIStore();
    const cameraRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mousePointer = useMemo(() => new THREE.Vector2(), []);
    const dragPositionRef = useRef(new THREE.Vector3());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, modelId: string } | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);
    const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

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
        if (!draggingAsset) return;

        addPlacedModel({
            name: draggingAsset.name,
            path: draggingAsset.path,
            position: [dragPositionRef.current.x, 0, dragPositionRef.current.z]
        });
        setDraggingAsset(null);
    };

    const DragTracker = () => {
        const { raycaster, camera } = useThree();
        const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

        useFrame(() => {
            if (draggingAsset) {
                raycaster.setFromCamera(mousePointer, camera);
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
        if (!contextMenu) return;
        const model = placedModels.find(m => m.id === contextMenu.modelId);
        if (model) {
            addPlacedModel({
                name: model.name,
                path: model.path,
                position: [model.position[0] + 2, model.position[1], model.position[2] + 2]
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'v' && copiedModel) {
                addPlacedModel({
                    ...copiedModel,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0]
                });
            }

            // Transform mode shortcuts
            if (e.key.toLowerCase() === 'w') setTransformMode('translate');
            if (e.key.toLowerCase() === 'e') setTransformMode('rotate');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [copiedModel, addPlacedModel]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
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
                <Canvas shadows gl={{ antialias: true, alpha: true }} onPointerMissed={() => {
                    setSelectedModelId(null);
                    setSelectedObject(null);
                }}>

                    {/* 🎥 Cameras */}
                    {isOrthoView ? (
                        <OrthographicCamera makeDefault position={[0, 30, 0]} zoom={50} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[8, 6, 10]} fov={50} />
                    )}

                    <Controls enabled={!isTransforming} />

                    {/* Lights */}
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

                    {/* Grid */}
                    <Grid
                        position={[0, -0.1, 0]}
                        args={[50, 50]}
                        cellSize={1}
                        cellThickness={0.6}
                        cellColor="#2a2a2a"
                        sectionSize={5}
                        sectionThickness={1.2}
                        sectionColor="#444"
                        // fadeDistance={50}
                        fadeStrength={1}
                        infiniteGrid
                    />

                    {/* Uploaded DXF Content */}
                    <DxfLayer />

                    {/* Placed 3D Models */}
                    {placedModels.map((model) => (
                        <PlacedModel
                            key={model.id}
                            id={model.id}
                            path={model.path}
                            position={model.position}
                            rotation={model.rotation}
                            name={model.name}
                            onContextMenu={(e) => handleModelContextMenu(e, model.id)}
                            isSelected={selectedModelId === model.id}
                            onSelect={(obj) => {
                                setSelectedModelId(model.id);
                                setSelectedObject(obj);
                            }}
                        />
                    ))}

                    {/* Centralized Transform Controls */}
                    {selectedObject && selectedModelId && (
                        <TransformControls
                            object={selectedObject as any}
                            mode={transformMode}

                            // Translation controls
                            showX={transformMode === 'translate'}
                            showY={true}
                            showZ={transformMode === 'translate'}

                            // Rotation controls (THIS is key)
                            // rotationAxis={
                            //     transformMode === 'rotate' ? 'y' : undefined
                            // }

                            onMouseDown={() => setIsTransforming(true)}
                            onMouseUp={() => {
                                setIsTransforming(false);

                                if (selectedObject) {
                                    const { x, y, z } = selectedObject.position;
                                    const { x: rx, y: ry, z: rz } = selectedObject.rotation;

                                    updateModelPosition(selectedModelId, [x, y, z]);

                                    // Force lock X & Z rotation
                                    updateModelRotation(selectedModelId, [0, ry, 0]);
                                }
                            }}
                        />)}

                    {/* Drag and Drop Preview */}
                    {draggingAsset && (
                        <>
                            <DragTracker />
                            <DragPreview
                                path={draggingAsset.path}
                                positionRef={dragPositionRef}
                            />
                        </>
                    )}

                    {/* Shadows */}
                    <ContactShadows
                        position={[0, 0.01, 0]}
                        opacity={0.5}
                        scale={20}
                        blur={2}
                        far={10}
                    />

                    <Environment preset="city" />

                </Canvas>
            </Suspense>

            {contextMenu && (
                <ModelContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDelete={() => removePlacedModel(contextMenu.modelId)}
                    onDuplicate={handleDuplicate}
                    onCopy={handleCopy}
                />
            )}
        </div>
    );
};

export default Project3D;