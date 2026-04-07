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
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.2}
      dollyToCursor
    />
  );
});

Controls.displayName = 'Controls';

export default Controls;