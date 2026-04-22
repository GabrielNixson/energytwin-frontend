import { forwardRef } from 'react';
import { CameraControls } from '@react-three/drei';

const Controls = forwardRef<CameraControls, { enabled?: boolean }>(({ enabled = true }, ref) => {
  return (
    <CameraControls
      ref={ref}
      enabled={enabled}
      truckSpeed={2}
      dollySpeed={1.5}
      smoothTime={0.3}

      // Infinite Zoom & Flexibility like Blender
      // Visual Constraints
      minDistance={5}
      maxDistance={150}
      minZoom={5}
      maxZoom={100}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.1}
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}

      dollyToCursor
      infinityDolly={false}
    />
  );
});

Controls.displayName = 'Controls';

export default Controls;