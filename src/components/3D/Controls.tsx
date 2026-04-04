import { CameraControls } from '@react-three/drei';

const Controls = ({ enabled = true }: { enabled?: boolean }) => {
  return (
    <CameraControls
      enabled={enabled}
      truckSpeed={2}
      dollySpeed={1.5}
      smoothTime={0.25}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2.2}
      dollyToCursor
    />
  );
};

export default Controls;