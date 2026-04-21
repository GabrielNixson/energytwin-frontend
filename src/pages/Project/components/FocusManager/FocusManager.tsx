import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '@/store/useUIStore';
import { useProjectStore } from '@/store/useProjectStore';

interface FocusManagerProps {
    cameraRef: React.RefObject<any>;
    projectID: string;
}

const FocusManager = ({ cameraRef, projectID }: FocusManagerProps) => {
    const { scene } = useThree();
    const { activeTabId, setSelectedModelId } = useUIStore();
    const { projects } = useProjectStore();

    useEffect(() => {
        if (!cameraRef.current || !activeTabId) return;

        const timer = setTimeout(() => {
            const currentProject = projects.find(p => p.id === projectID);
            const tab = currentProject?.tabs.find(t => t.id === activeTabId);
            const targetId = tab?.assetId;
            const targetName = tab?.name;

            if (targetId || targetName) {
                let targetObject: THREE.Object3D | null = null;

                // 1. Search for EXACT ID match first (highest priority)
                if (targetId) {
                    scene.traverse((child) => {
                        if (targetObject) return; // Stop if already found
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
                    const safeDistance = distance * 2.5; // Slightly further for better context

                    // Create a vector representing "in front" of the object in its local space
                    // We'll aim for a position that is slightly elevated and forward
                    const localOffset = new THREE.Vector3(0, maxDim * 0.2, safeDistance);
                    
                    // Transform this local offset into world space based on object's rotation
                    const worldQuaternion = new THREE.Quaternion();
                    target.getWorldQuaternion(worldQuaternion);
                    const worldOffset = localOffset.applyQuaternion(worldQuaternion);
                    
                    // Final camera position is object center + world-space offset
                    const camPos = center.clone().add(worldOffset);

                    cameraRef.current.setLookAt(
                        camPos.x, camPos.y, camPos.z,
                        center.x, center.y, center.z,
                        true
                    );
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [activeTabId, scene, cameraRef, projectID, setSelectedModelId]);

    return null;
};

export default FocusManager;
