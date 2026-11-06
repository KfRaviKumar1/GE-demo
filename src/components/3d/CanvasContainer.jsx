import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function LoadingState() {
  return (
    <Html center>
      <div className="canvas-loader"><span /> Preparing the engine</div>
    </Html>
  )
}

export default function CanvasContainer({
  children,
  cameraPosition = [4.1, 2.7, 5.2],
  canvasClassName = '',
  cameraNear = 0.1,
  cameraFar = 100,
  minDistance = 2.2,
  maxDistance = 14,
}) {
  return (
    <Canvas
      className={`object-canvas ${canvasClassName}`}
      camera={{ position: cameraPosition, fov: 34, near: cameraNear, far: cameraFar }}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.12
      }}
    >
      <Suspense fallback={<LoadingState />}>
        {children}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.7}
          zoomSpeed={0.7}
          panSpeed={0.75}
          zoomToCursor
          screenSpacePanning
          minDistance={minDistance}
          maxDistance={maxDistance}
          minPolarAngle={0.02}
          maxPolarAngle={Math.PI - 0.02}
          target={[0, 0.35, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
