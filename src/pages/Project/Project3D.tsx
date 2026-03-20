import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
    PerspectiveCamera,
    OrthographicCamera,
    Grid,
    Environment,
    ContactShadows,
    CameraControls,
    Line
} from '@react-three/drei';
import Tools from '@/components/Tools/Tools';
import { useUIStore } from '@/store/useUIStore';
import Controls from '@/components/3D/Controls';

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
                for(let i=0; i<=64; i++) {
                    const angle = (i/64) * Math.PI * 2;
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
    const { selectedSubOption } = useUIStore();
    const cameraRef = useRef<any>(null);

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

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Tools />

            <Suspense fallback={<div style={{ color: 'white' }}>Loading 3D Scene...</div>}>
                <Canvas shadows gl={{ antialias: true, alpha: true }}>

                    {/* 🎥 Cameras */}
                    {isOrthoView ? (
                        <OrthographicCamera makeDefault position={[0, 30, 0]} zoom={50} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[8, 6, 10]} fov={50} />
                    )}

                    <Controls />

                    {/* Lights */}
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

                    {/* Grid */}
                    <Grid
                        position={[0, 0, 0]}
                        args={[50, 50]}
                        cellSize={1}
                        cellThickness={0.6}
                        cellColor="#2a2a2a"
                        sectionSize={5}
                        sectionThickness={1.2}
                        sectionColor="#444"
                        fadeDistance={50}
                        fadeStrength={1}
                        infiniteGrid
                    />

                    {/* Uploaded DXF Content */}
                    <DxfLayer />

                    {/* Base Mock Content */}
                    <mesh castShadow position={[0, 1, 0]}>
                        <boxGeometry args={[2, 2, 2]} />
                        <meshStandardMaterial color="#4f46e5" />
                    </mesh>

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
        </div>
    );
}; 

export default Project3D;