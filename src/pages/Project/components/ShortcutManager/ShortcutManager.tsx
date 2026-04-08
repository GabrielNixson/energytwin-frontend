import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

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
            
            // Toggle Ortho/Perspective (5)
            if (e.key === '5') {
                e.preventDefault();
                setIsOrthoManual((prev: boolean) => !prev);
            }

            // Focus Selection (.)
            if (e.key === '.') {
                e.preventDefault();
                if (selectedModelId) {
                    const target = scene.getObjectByName(selectedModelId);
                    if (target) {
                        cameraRef.current.fitToBox(target, true, { 
                            paddingLeft: 1, paddingRight: 1, paddingTop: 1, paddingBottom: 1 
                        });
                    }
                }
            }

            const DIST = 30;
            // Views (Standard Numpad mapping)
            if (e.key === '1') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(0, 0, -DIST, 0, 0, 0, true); // Back
                else cameraRef.current.setLookAt(0, 0, DIST, 0, 0, 0, true); // Front
            }
            if (e.key === '3') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(-DIST, 0, 0, 0, 0, 0, true); // Left
                else cameraRef.current.setLookAt(DIST, 0, 0, 0, 0, 0, true); // Right
            }
            if (e.key === '7') {
                e.preventDefault();
                if (e.ctrlKey) cameraRef.current.setLookAt(0, -DIST, 0, 0, 0, 0, true); // Bottom
                else cameraRef.current.setLookAt(0, DIST, 0, 0, 0, 0, true); // Top
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cameraRef, selectedModelId, scene, setIsOrthoManual]);
    
    return null;
};

export default ShortcutManager;
