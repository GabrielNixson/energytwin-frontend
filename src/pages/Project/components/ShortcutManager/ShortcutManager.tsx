import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ShortcutManagerProps {
    cameraRef: React.RefObject<any>;
    selectedModelId: string | null;
    setIsOrthoManual: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const ShortcutManager = ({ cameraRef, selectedModelId, setIsOrthoManual }: ShortcutManagerProps) => {
    const { scene } = useThree();
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!cameraRef.current) return;
            
            // 🛡️ Gating: Ignore shortcuts when typing in inputs, textareas, or contenteditables
            const isTyping = e.target instanceof HTMLInputElement || 
                             e.target instanceof HTMLTextAreaElement || 
                             (e.target as HTMLElement).isContentEditable;
            if (isTyping) return;
            
            // Toggle Ortho/Perspective (5)
            if (e.key === '5') {
                e.preventDefault();
                setIsOrthoManual((prev: boolean) => !prev);
            }

            // Focus Selection (.) - Maintains current angle
            if (e.key === '.') {
                e.preventDefault();
                if (selectedModelId) {
                    const target = scene.getObjectByName(selectedModelId);
                    if (target) {
                        const box = new THREE.Box3().setFromObject(target);
                        const center = new THREE.Vector3();
                        const size = new THREE.Vector3();
                        box.getCenter(center);
                        box.getSize(size);

                        // Calculate current camera state
                        const azimuth = cameraRef.current.azimuthAngle;
                        const polar = cameraRef.current.polarAngle;
                        
                        // Determine safe viewing distance based on object size
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const distance = maxDim * 2.5;

                        // Calculate new camera position using existing angles but new distance and center
                        const x = center.x + distance * Math.sin(azimuth) * Math.sin(polar);
                        const y = center.y + distance * Math.cos(polar);
                        const z = center.z + distance * Math.cos(azimuth) * Math.sin(polar);

                        cameraRef.current.setLookAt(
                            x, y, z,
                            center.x, center.y, center.z,
                            true
                        );
                    }
                }
            }

            // Helper to get target center and distance
            const getControlInfo = () => {
                const center = new THREE.Vector3();
                cameraRef.current.getTarget(center); // Fallback to current target
                let distance = cameraRef.current.distance;
                
                if (selectedModelId) {
                    const target = scene.getObjectByName(selectedModelId);
                    if (target) {
                        const box = new THREE.Box3().setFromObject(target);
                        box.getCenter(center);
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        // Safe viewing distance based on object size
                        distance = Math.max(size.x, size.y, size.z) * 4;
                    }
                }
                return { center, distance };
            };

            const info = getControlInfo();
            const { center, distance } = info;

            // Views (Standard Numpad mapping relative to target)
            if (e.key === '1') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(center.x, center.y, center.z - distance, center.x, center.y, center.z, true); // Back
                else cameraRef.current.setLookAt(center.x, center.y, center.z + distance, center.x, center.y, center.z, true); // Front
            }
            if (e.key === '3') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(center.x - distance, center.y, center.z, center.x, center.y, center.z, true); // Left
                else cameraRef.current.setLookAt(center.x + distance, center.y, center.z, center.x, center.y, center.z, true); // Right
            }
            if (e.key === '7') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(center.x, center.y - distance, center.z, center.x, center.y, center.z, true); // Bottom
                else cameraRef.current.setLookAt(center.x, center.y + distance, center.z, center.x, center.y, center.z, true); // Top
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cameraRef, selectedModelId, scene, setIsOrthoManual]);
    
    return null;
};

export default ShortcutManager;
