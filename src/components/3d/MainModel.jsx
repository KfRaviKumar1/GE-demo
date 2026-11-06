import { useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { getPartForMesh, mainModelPath, modelParts, USE_GLB_ASSETS } from '../../data/modelParts.js'
import Hotspot from '../ui/Hotspot.jsx'

function InteractiveMesh({ name, children, position, rotation, scale, material, onSelect, highlighted = false, geometry }) {
  const [hovered, setHovered] = useState(false)

  return (
    <mesh
      name={name}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(event) => {
        event.stopPropagation()
        const part = getPartForMesh(name)
        if (part) onSelect(part)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        const part = getPartForMesh(name)
        if (part) onSelect(part)
      }}
    >
      {children}
      <meshStandardMaterial
        {...material}
        emissive={highlighted || hovered ? '#bd8953' : '#000000'}
        emissiveIntensity={highlighted || hovered ? 0.18 : 0}
      />
    </mesh>
  )
}

function StageBlades({ position, count, radius, length, color, name, onSelect, highlighted }) {
  return (
    <group position={position}>
      <InteractiveMesh
        name={name}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color, metalness: 0.82, roughness: 0.25 }}
        onSelect={onSelect}
        highlighted={highlighted}
      >
        <cylinderGeometry args={[radius, radius, 0.1, 48]} />
      </InteractiveMesh>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2
        return (
          <mesh
            key={index}
            name={`${name}-blade`}
            position={[0, Math.cos(angle) * radius, Math.sin(angle) * radius]}
            rotation={[angle, 0, -0.24]}
            castShadow
            receiveShadow
            onClick={(event) => {
              event.stopPropagation()
              onSelect(getPartForMesh(`${name}-blade`))
            }}
          >
            <boxGeometry args={[0.075, length, 0.055]} />
            <meshStandardMaterial color={color} metalness={0.78} roughness={0.28} />
          </mesh>
        )
      })}
    </group>
  )
}

function ProceduralTurbine({ onSelect, activePart }) {
  const outerCasing = useMemo(() => new THREE.CylinderGeometry(1.02, 0.88, 2.9, 64, 1, true, Math.PI / 2, Math.PI), [])
  const innerCasing = useMemo(() => new THREE.CylinderGeometry(0.82, 0.72, 2.82, 64, 1, true, Math.PI / 2, Math.PI), [])
  const fastenerPositions = [
    [-1.23, -0.78, 0.3], [-0.82, -0.82, 0.3], [-0.4, -0.85, 0.3], [0, -0.86, 0.3],
    [0.42, -0.84, 0.3], [0.84, -0.81, 0.3], [1.24, -0.76, 0.3],
    [-1.2, 0.78, 0.3], [-0.8, 0.83, 0.3], [-0.4, 0.86, 0.3],
    [0, 0.87, 0.3], [0.4, 0.85, 0.3], [0.8, 0.82, 0.3], [1.2, 0.77, 0.3],
  ]

  return (
    <group rotation={[0.08, -0.18, 0]}>
      <InteractiveMesh
        name="main-shaft"
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#758087', metalness: 0.88, roughness: 0.2 }}
        onSelect={onSelect}
        highlighted={activePart === 'shaft'}
      >
        <cylinderGeometry args={[0.16, 0.16, 3.65, 48]} />
      </InteractiveMesh>

      <InteractiveMesh
        name="intake"
        position={[-1.58, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#aeb7b8', metalness: 0.72, roughness: 0.28 }}
        onSelect={onSelect}
        highlighted={activePart === 'intake'}
      >
        <cylinderGeometry args={[0.24, 0.64, 0.5, 48, 1, true]} />
      </InteractiveMesh>
      <mesh position={[-1.61, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.64, 0.055, 12, 48]} />
        <meshStandardMaterial color="#c0c6c3" metalness={0.78} roughness={0.25} />
      </mesh>

      <StageBlades position={[-1.02, 0, 0]} count={14} radius={0.49} length={0.48} color="#aeb8b8" name="compressor-rotor" onSelect={onSelect} highlighted={activePart === 'compressor'} />
      <StageBlades position={[-0.55, 0, 0]} count={16} radius={0.64} length={0.4} color="#9da9aa" name="compressor-rotor" onSelect={onSelect} highlighted={activePart === 'compressor'} />
      <StageBlades position={[-0.05, 0, 0]} count={18} radius={0.74} length={0.34} color="#909d9e" name="compressor-rotor" onSelect={onSelect} highlighted={activePart === 'compressor'} />

      <InteractiveMesh
        name="combustor"
        position={[0.42, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#bd8953', metalness: 0.66, roughness: 0.31 }}
        onSelect={onSelect}
        highlighted={activePart === 'combustor'}
      >
        <cylinderGeometry args={[0.68, 0.68, 0.53, 48, 1, true]} />
      </InteractiveMesh>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[0.42, Math.cos(angle) * 0.69, Math.sin(angle) * 0.69]}
            rotation={[angle, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.4, 0.045, 0.045]} />
            <meshStandardMaterial color="#d29a5f" metalness={0.6} roughness={0.3} />
          </mesh>
        )
      })}

      <StageBlades position={[0.94, 0, 0]} count={16} radius={0.71} length={0.38} color="#a8b2b1" name="turbine-rotor" onSelect={onSelect} highlighted={activePart === 'turbine'} />
      <StageBlades position={[1.35, 0, 0]} count={14} radius={0.6} length={0.34} color="#bac1be" name="turbine-rotor" onSelect={onSelect} highlighted={activePart === 'turbine'} />

      <InteractiveMesh
        name="exhaust"
        position={[1.72, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#aeb6b4', metalness: 0.72, roughness: 0.27 }}
        onSelect={onSelect}
        highlighted={activePart === 'exhaust'}
      >
        <cylinderGeometry args={[0.59, 0.34, 0.55, 48, 1, true]} />
      </InteractiveMesh>
      <mesh position={[1.99, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.59, 0.045, 12, 48]} />
        <meshStandardMaterial color="#c5cac6" metalness={0.76} roughness={0.25} />
      </mesh>

      <InteractiveMesh
        name="bearing"
        position={[-1.25, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#7c8789', metalness: 0.92, roughness: 0.18 }}
        onSelect={onSelect}
        highlighted={activePart === 'bearing'}
      >
        <cylinderGeometry args={[0.28, 0.28, 0.2, 48]} />
      </InteractiveMesh>
      <mesh position={[1.58, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.055, 12, 40]} />
        <meshStandardMaterial color="#818d8e" metalness={0.9} roughness={0.2} />
      </mesh>

      <InteractiveMesh
        name="casing"
        geometry={outerCasing}
        position={[0.05, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={{ color: '#d8dcd7', metalness: 0.3, roughness: 0.34, side: THREE.DoubleSide }}
        onSelect={onSelect}
        highlighted={activePart === 'casing'}
      />
      <mesh geometry={innerCasing} position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#879294" metalness={0.55} roughness={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, -0.83, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.12, 0.98]} />
        <meshStandardMaterial color="#899294" metalness={0.65} roughness={0.35} />
      </mesh>

      {fastenerPositions.map((position, index) => (
        <InteractiveMesh
          key={index}
          name="fasteners"
          position={position}
          rotation={[Math.PI / 2, 0, 0]}
          material={{ color: '#aab2b0', metalness: 0.82, roughness: 0.24 }}
          onSelect={onSelect}
          highlighted={activePart === 'fasteners'}
        >
          <cylinderGeometry args={[0.052, 0.052, 0.045, 6]} />
        </InteractiveMesh>
      ))}

      {modelParts.map((part) => (
        <Hotspot key={part.id} part={part} active={activePart === part.id} onClick={onSelect} />
      ))}
    </group>
  )
}

function GltfMainModel({ onSelect }) {
  const { scene } = useGLTF(mainModelPath)
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone()
      }
    })
    return clone
  }, [scene])

  const [activePart, setActivePart] = useState(null)
  return (
    <group>
      <primitive
        object={clonedScene}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
          const materials = Array.isArray(event.object.material) ? event.object.material : [event.object.material]
          materials.forEach((material) => {
            if (material?.emissive) {
              material.emissive.set('#bd8953')
              material.emissiveIntensity = 0.2
            }
          })
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'auto'
          const materials = Array.isArray(event.object.material) ? event.object.material : [event.object.material]
          materials.forEach((material) => {
            if (material?.emissive) {
              material.emissive.set('#000000')
              material.emissiveIntensity = 0
            }
          })
        }}
        onClick={(event) => {
          event.stopPropagation()
          const part = getPartForMesh(event.object.name)
          if (part) {
            setActivePart(part.id)
            onSelect(part)
          }
        }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          const part = getPartForMesh(event.object.name)
          if (part) onSelect(part)
        }}
      />
      {modelParts.map((part) => (
        <Hotspot key={part.id} part={part} active={activePart === part.id} onClick={onSelect} />
      ))}
    </group>
  )
}

export default function MainModel({ onSelectPart }) {
  return (
    <group position={[0, 0.4, 0]}>
      {USE_GLB_ASSETS
        ? <GltfMainModel onSelect={onSelectPart} />
        : <ProceduralTurbine onSelect={onSelectPart} />}
    </group>
  )
}

if (USE_GLB_ASSETS) useGLTF.preload(mainModelPath)
