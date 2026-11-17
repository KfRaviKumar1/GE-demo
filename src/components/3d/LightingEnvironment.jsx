import { useEffect } from 'react'
import { ContactShadows } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// Reflections come from a studio environment generated in the browser, so the
// viewer does not depend on downloading an HDR file from an external CDN
// (which some networks block, leaving the page blank).
function StudioEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    return () => {
      scene.environment = null
      environment.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return null
}

export default function LightingEnvironment() {
  return (
    <>
      <color attach="background" args={['#f5f4f0']} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#b9b5ad', 1.1]} />
      <directionalLight
        castShadow
        position={[4, 7, 5]}
        intensity={3.1}
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[-4, 2, -3]} intensity={1.5} color="#c5d4e4" />
      <pointLight position={[0, 5, 1]} intensity={0.7} color="#fff4e6" />
      <StudioEnvironment />
      <ContactShadows
        position={[0, -0.91, 0]}
        opacity={0.33}
        scale={8}
        blur={2.8}
        far={4}
        resolution={256}
        frames={1}
        color="#555149"
      />
    </>
  )
}
