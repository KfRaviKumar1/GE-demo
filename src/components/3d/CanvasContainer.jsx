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

export default function CanvasContainer({ children, cameraPosition = [4.1, 2.7, 5.2], canvasClassName = '' }) {
  return (
    <Canvas
      className={`object-canvas ${canvasClassName}`}
      camera={{ position: cameraPosition, fov: 34, near: 0.1, far: 100 }}
      shadows
      dpr={[1, 1.75]}
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
          dampingFactor={0.075}
          minDistance={2.2}
          maxDistance={14}
          minPolarAngle={Math.PI * 0.13}
          maxPolarAngle={Math.PI * 0.48}
          target={[0, 0.35, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
