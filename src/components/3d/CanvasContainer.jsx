import { Component, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function LoadingState() {
  return (
    <Html center>
      <div className="canvas-loader"><span /> Preparing the model</div>
    </Html>
  )
}

// Keeps a 3D failure (no WebGL, blocked download) from unmounting the whole
// app: the rest of the page stays usable and the viewer shows a message.
class CanvasErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('The 3D view failed to render.', error)
  }

  render() {
    if (this.state.hasError) {
      return <div className="canvas-error" role="alert">The 3D view could not be shown in this browser.</div>
    }
    return this.props.children
  }
}

export default function CanvasContainer(props) {
  return (
    <CanvasErrorBoundary>
      <SceneCanvas {...props} />
    </CanvasErrorBoundary>
  )
}

function SceneCanvas({
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
