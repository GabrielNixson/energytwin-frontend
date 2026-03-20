import { CameraControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';

interface ControlsProps {
  isOrthoView: boolean;
  cameraControlsRef?: React.MutableRefObject<any>;
}

const Controls = ({ isOrthoView, cameraControlsRef }: ControlsProps) => {
  const internalRef = useRef<any>(null);
  const ref = cameraControlsRef ?? internalRef;

  // Reset roll whenever we switch modes
  useEffect(() => {
    if (!ref.current) return;
    ref.current.rotateTo(0, 0, true);
  }, [isOrthoView]);

  return (
    <CameraControls
      ref={ref}
      mouseButtons={
        isOrthoView
          ? {
              left: 1,   // LEFT CLICK  → TRUCK (pan)
              middle: 1, // MIDDLE      → TRUCK (pan)
              right: 1,  // RIGHT CLICK → TRUCK (pan)
              wheel: 16, // WHEEL       → ZOOM (dolly)
            }
          : {
              left: 1,   // LEFT CLICK  → ROTATE
              middle: 8, // MIDDLE      → DOLLY
              right: 2,  // RIGHT CLICK → TRUCK (pan)
              wheel: 16, // WHEEL       → ZOOM (dolly)
            }
      }
      // Disable rotation axes in ortho mode
      minPolarAngle={isOrthoView ? Math.PI / 2 : 0}
      maxPolarAngle={isOrthoView ? Math.PI / 2 : Math.PI}
      minAzimuthAngle={isOrthoView ? 0 : -Infinity}
      maxAzimuthAngle={isOrthoView ? 0 : Infinity}
      truckSpeed={2}
      dollySpeed={0.5}
      smoothTime={0.15}
    />
  );
};

export default Controls;