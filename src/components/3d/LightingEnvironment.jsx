import { ContactShadows, Environment } from '@react-three/drei'

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
      <Environment preset="city" />
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
