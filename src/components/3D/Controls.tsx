import { forwardRef } from 'react';
import { CameraControls } from '@react-three/drei';

const Controls = forwardRef<CameraControls, { enabled?: boolean }>(({ enabled = true }, ref) => {
  return (
    <CameraControls
      ref={ref}
      enabled={enabled}
      truckSpeed={2}
      dollySpeed={1.5}
      smoothTime={0.25}

      // Infinite Zoom & Flexibility like Blender
      minDistance={0}
      maxDistance={Infinity}
      minPolarAngle={0}                // no flip under
      maxPolarAngle={Math.PI / 2.5}     // stop at horizon (adjust if needed)
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}

      dollyToCursor
      infinityDolly={true}
    />
  );
});

Controls.displayName = 'Controls';

export default Controls;