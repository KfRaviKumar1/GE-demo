import { useMemo } from 'react'
import { Bounds, Center, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getPartModelPath, USE_GLB_ASSETS } from '../../data/modelParts.js'

function Mesh({ children, position, rotation, material, castShadow = true }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow={castShadow}>
      {children}
      <meshStandardMaterial {...material} />
    </mesh>
  )
}

function RotorStages({ turbine = false }) {
  const stages = turbine
    ? [{ x: -0.5, radius: 0.88, blades: 20 }, { x: 0.48, radius: 0.68, blades: 17 }]
    : [{ x: -0.88, radius: 0.62, blades: 16 }, { x: 0, radius: 0.86, blades: 20 }, { x: 0.88, radius: 1.05, blades: 24 }]
  const color = turbine ? '#9b7c61' : '#9da9aa'

  return (
    <group>
      <Mesh rotation={[0, 0, Math.PI / 2]} material={{ color: '#768184', metalness: 0.88, roughness: 0.2 }}>
        <cylinderGeometry args={[0.16, 0.16, 2.8, 40]} />
      </Mesh>
      {stages.map((stage, stageIndex) => (
        <group key={stage.x} position={[stage.x, 0, 0]}>
          <Mesh rotation={[0, 0, Math.PI / 2]} material={{ color, metalness: 0.82, roughness: 0.25 }}>
            <cylinderGeometry args={[stage.radius * 0.45, stage.radius * 0.45, 0.16, 40]} />
          </Mesh>
          {Array.from({ length: stage.blades }, (_, index) => {
            const angle = (index / stage.blades) * Math.PI * 2
            return (
              <Mesh
                key={`${stageIndex}-${index}`}
                position={[stage.x, Math.cos(angle) * stage.radius, Math.sin(angle) * stage.radius]}
                rotation={[angle, 0, -0.24]}
                material={{ color, metalness: 0.8, roughness: 0.27 }}
              >
                <boxGeometry args={[0.12, stage.radius * 0.72, 0.065]} />
              </Mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function FastenerDetail() {
  return (
    <group>
      {Array.from({ length: 14 }, (_, index) => {
        const x = ((index % 7) - 3) * 0.42
        const y = index < 7 ? -0.5 : 0.5
        return (
          <group key={index} position={[x, y, 0]}>
            <Mesh position={[0, 0, -0.14]} rotation={[Math.PI / 2, 0, 0]} material={{ color: '#727b7d', metalness: 0.9, roughness: 0.22 }}>
              <cylinderGeometry args={[0.09, 0.09, 0.26, 12]} />
            </Mesh>
            <Mesh rotation={[Math.PI / 2, 0, 0]} material={{ color: '#515a5d', metalness: 0.94, roughness: 0.19 }}>
              <cylinderGeometry args={[0.16, 0.16, 0.1, 6]} />
            </Mesh>
            <Mesh position={[0, 0, 0.052]} rotation={[0, 0, Math.PI / 4]} material={{ color: '#c2c7c3', metalness: 0.82, roughness: 0.25 }}>
              <boxGeometry args={[0.13, 0.022, 0.018]} />
            </Mesh>
          </group>
        )
      })}
    </group>
  )
}

function CasingDetail() {
  const shell = useMemo(() => new THREE.CylinderGeometry(1.05, 0.9, 2.7, 64, 1, true, Math.PI / 2, Math.PI), [])
  const liner = useMemo(() => new THREE.CylinderGeometry(0.82, 0.7, 2.62, 64, 1, true, Math.PI / 2, Math.PI), [])
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Mesh material={{ color: '#c6ceca', metalness: 0.35, roughness: 0.32, side: THREE.DoubleSide }}>
        <primitive object={shell} attach="geometry" />
      </Mesh>
      <Mesh material={{ color: '#7c8889', metalness: 0.58, roughness: 0.35, side: THREE.DoubleSide }} castShadow={false}>
        <primitive object={liner} attach="geometry" />
      </Mesh>
      <Mesh position={[0, -0.93, 0]} material={{ color: '#858e8e', metalness: 0.68, roughness: 0.32 }}>
        <boxGeometry args={[2.76, 0.14, 1.03]} />
      </Mesh>
      {[-1, 1].map((side) => (
        <Mesh key={side} position={[0, side * 0.52, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={{ color: '#4e585b', metalness: 0.92, roughness: 0.2 }}>
          <cylinderGeometry args={[0.045, 0.045, 0.08, 6]} />
        </Mesh>
      ))}
    </group>
  )
}

function CombustorDetail() {
  return (
    <group>
      <Mesh rotation={[0, 0, Math.PI / 2]} material={{ color: '#ad7142', metalness: 0.72, roughness: 0.3, side: THREE.DoubleSide }}>
        <cylinderGeometry args={[0.94, 0.94, 0.92, 56, 1, true]} />
      </Mesh>
      <Mesh rotation={[0, 0, Math.PI / 2]} material={{ color: '#6f6860', metalness: 0.65, roughness: 0.34, side: THREE.DoubleSide }}>
        <cylinderGeometry args={[0.63, 0.63, 0.86, 56, 1, true]} />
      </Mesh>
      {Array.from({ length: 14 }, (_, index) => {
        const angle = (index / 14) * Math.PI * 2
        return (
          <Mesh
            key={index}
            position={[0, Math.cos(angle) * 0.83, Math.sin(angle) * 0.83]}
            rotation={[angle, 0, 0]}
            material={{ color: '#d09960', metalness: 0.62, roughness: 0.28 }}
          >
            <boxGeometry args={[0.7, 0.045, 0.055]} />
          </Mesh>
        )
      })}
    </group>
  )
}

function ShaftDetail() {
  return (
    <group>
      <Mesh rotation={[0, 0, Math.PI / 2]} material={{ color: '#778387', metalness: 0.94, roughness: 0.16 }}>
        <cylinderGeometry args={[0.19, 0.19, 3.2, 48]} />
      </Mesh>
      {[-1.15, -0.72, 0.65, 1.12].map((x) => (
        <Mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={{ color: '#aeb8b6', metalness: 0.9, roughness: 0.2 }}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 40]} />
        </Mesh>
      ))}
      <Mesh position={[0, 0, 0.23]} rotation={[Math.PI / 2, 0, 0]} material={{ color: '#555f62', metalness: 0.92, roughness: 0.18 }}>
        <torusGeometry args={[0.21, 0.045, 12, 48]} />
      </Mesh>
    </group>
  )
}

function BearingDetail() {
  return (
    <group>
      {[0.9, 0.62, 0.32].map((radius, index) => (
        <Mesh key={radius} rotation={[0, 0, Math.PI / 2]} material={{ color: index === 1 ? '#626e71' : '#a9b2b1', metalness: 0.92, roughness: 0.18 }}>
          <cylinderGeometry args={[radius, radius, index === 1 ? 0.52 : 0.18, 56, 1, true]} />
        </Mesh>
      ))}
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2
        return (
          <Mesh key={index} position={[Math.cos(angle) * 0.76, Math.sin(angle) * 0.76, 0]} material={{ color: '#c3c9c5', metalness: 0.92, roughness: 0.16 }}>
            <sphereGeometry args={[0.095, 16, 12]} />
          </Mesh>
        )
      })}
    </group>
  )
}

function DuctDetail({ exhaust = false }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Mesh material={{ color: '#9ea9a8', metalness: 0.75, roughness: 0.26, side: THREE.DoubleSide }}>
        <cylinderGeometry args={exhaust ? [0.95, 0.54, 1.25, 56, 1, true] : [0.52, 0.98, 1.15, 56, 1, true]} />
      </Mesh>
      <Mesh position={[0, exhaust ? 0.64 : -0.59, 0]} material={{ color: '#c0c7c3', metalness: 0.85, roughness: 0.22 }}>
        <torusGeometry args={[exhaust ? 0.95 : 0.98, 0.065, 12, 56]} />
      </Mesh>
      <Mesh position={[0, 0, 0]} material={{ color: '#a9b2ae', metalness: 0.84, roughness: 0.22 }}>
        <cylinderGeometry args={[0.25, 0.25, 1.3, 40]} />
      </Mesh>
    </group>
  )
}

function ProceduralPart({ part }) {
  if (part.id === 'compressor') return <RotorStages />
  if (part.id === 'turbine') return <RotorStages turbine />
  if (part.id === 'combustor') return <CombustorDetail />
  if (part.id === 'shaft') return <ShaftDetail />
  if (part.id === 'bearing') return <BearingDetail />
  if (part.id === 'casing') return <CasingDetail />
  if (part.id === 'fasteners') return <FastenerDetail />
  if (part.id === 'exhaust') return <DuctDetail exhaust />
  return <DuctDetail />
}

function GltfPart({ part }) {
  const { scene } = useGLTF(getPartModelPath(part.id))
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])
  return <primitive object={clonedScene} />
}

export default function SubPartModel({ part }) {
  return (
    <Bounds key={part.id} fit clip observe margin={1.2}>
      <Center top>
        <group>
          {USE_GLB_ASSETS ? <GltfPart part={part} /> : <ProceduralPart part={part} />}
        </group>
      </Center>
    </Bounds>
  )
}

if (USE_GLB_ASSETS) {
  for (const id of ['intake', 'compressor', 'combustor', 'turbine', 'exhaust', 'shaft', 'bearing', 'casing', 'fasteners']) {
    useGLTF.preload(getPartModelPath(id))
  }
}
