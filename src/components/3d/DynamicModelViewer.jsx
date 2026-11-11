import { Component, useEffect, useMemo, useRef } from 'react'
import { Bounds, Center, Html, useBounds, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Box3, Vector3 } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { createModelParts } from '../../data/modelParts.js'
import { registerUploadedScene } from './modelResources.js'

const HOTSPOT_SPACING = 40
const HOTSPOT_DIRECTIONS = Array.from({ length: 16 }, (_, index) =>
  (index * Math.PI * 2) / 16,
)

function findHotspotOffset(anchor, placed) {
  if (placed.every(({ x, y }) =>
    Math.hypot(anchor[0] - x, anchor[1] - y) >= HOTSPOT_SPACING,
  )) return [0, 0]

  for (let radius = HOTSPOT_SPACING + 2; ; radius += HOTSPOT_SPACING + 2) {
    for (const angle of HOTSPOT_DIRECTIONS) {
      const offset = [Math.cos(angle) * radius, Math.sin(angle) * radius]
      const isAvailable = placed.every(({ x, y }) =>
        Math.hypot(anchor[0] + offset[0] - x, anchor[1] + offset[1] - y) >= HOTSPOT_SPACING,
      )
      if (isAvailable) return offset
    }
  }
}

function UploadedModelHotspots({ meshes, onSelect, hoverTimeout }) {
  const markerRefs = useRef([])
  const connectorRefs = useRef([])
  const hasCalculatedOffsets = useRef(false)

  useFrame(() => {
    if (hasCalculatedOffsets.current) return

    const markers = markerRefs.current.slice(0, meshes.length)
    if (markers.some((marker) => !marker?.parentElement)) return

    const anchors = markers.map((marker) => {
      const bounds = marker.parentElement.getBoundingClientRect()
      return [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2]
    })

    const placed = []
    markers.forEach((marker, index) => {
      const [offsetX, offsetY] = findHotspotOffset(anchors[index], placed)
      marker.style.translate = `${offsetX}px ${offsetY}px`
      marker.style.visibility = 'visible'

      const connector = connectorRefs.current[index]
      if (connector) {
        connector.setAttribute('x2', String(offsetX))
        connector.setAttribute('y2', String(offsetY))
        connector.style.visibility = offsetX || offsetY ? 'visible' : 'hidden'
      }

      placed.push({ x: anchors[index][0] + offsetX, y: anchors[index][1] + offsetY })
    })
    hasCalculatedOffsets.current = true
  })

  return meshes.map((mesh, index) => (
    <Html key={mesh.meshId} position={mesh.coordinates} center distanceFactor={10} zIndexRange={[20, 0]}>
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <line
            ref={(line) => { connectorRefs.current[index] = line }}
            x1="0"
            y1="0"
            stroke="rgba(167,122,82,.85)"
            strokeWidth="1.5"
            style={{ visibility: 'hidden' }}
          />
        </svg>
        <button
          ref={(button) => { markerRefs.current[index] = button }}
          type="button"
          className="uploaded-model-marker"
          style={{ position: 'absolute', left: -17, top: -17, visibility: 'hidden' }}
          aria-label={`Select part ${mesh.number}: ${mesh.name}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            window.clearTimeout(hoverTimeout.current)
            document.body.style.cursor = 'auto'
            onSelect(mesh.meshId)
          }}
        >
          <span className="uploaded-model-marker-number">{mesh.number}</span>
          <span className="uploaded-model-marker-label">{mesh.name}</span>
        </button>
      </div>
    </Html>
  ))
}

function getMeshNodes(scene) {
  scene.updateMatrixWorld(true)
  const meshes = []
  const bounds = new Box3()
  const center = new Vector3()
  const size = new Vector3()

  scene.traverse((node) => {
    if (!node.isMesh) return
    bounds.setFromObject(node)
    bounds.getCenter(center)
    meshes.push({
      id: node.uuid,
      name: node.name.trim() || `Mesh ${meshes.length + 1}`,
      position: center.toArray(),
      size: bounds.getSize(size).toArray(),
      material: node.material,
      appearance: getMaterialAppearance(node.material),
    })
  })

  return createModelParts(meshes)
}

function getMaterialAppearance(materialValue) {
  const material = (Array.isArray(materialValue) ? materialValue : [materialValue]).find(Boolean)
  if (!material) return null

  return {
    color: material.color ? `#${material.color.getHexString()}` : '#ffffff',
    emissiveColor: material.emissive ? `#${material.emissive.getHexString()}` : '#000000',
    emissiveIntensity: material.emissiveIntensity ?? 1,
    roughness: material.roughness ?? 1,
    metalness: material.metalness ?? 0,
    supportsPbr: 'roughness' in material && 'metalness' in material,
    wireframe: Boolean(material.wireframe),
    transparent: Boolean(material.transparent),
    opacity: material.opacity ?? 1,
    maps: {
      baseColor: Boolean(material.map),
      roughness: Boolean(material.roughnessMap),
      metalness: Boolean(material.metalnessMap),
      normal: Boolean(material.normalMap),
      emissive: Boolean(material.emissiveMap),
      ambientOcclusion: Boolean(material.aoMap),
    },
    isPhysical: Boolean(material.isMeshPhysicalMaterial),
    transmission: material.transmission ?? 0,
    ior: material.ior ?? 1.5,
    clearcoat: material.clearcoat ?? 0,
    clearcoatRoughness: material.clearcoatRoughness ?? 0,
    sheen: material.sheen ?? 0,
  }
}

export default function DynamicModelViewer(props) {
  return (
    <ModelLoadBoundary key={props.url}>
      <UploadedModelScene {...props} />
    </ModelLoadBoundary>
  )
}

class ModelLoadBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Unable to load the uploaded 3D model.', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="canvas-loader model-load-error" role="alert">Could not load this model. Check that the file is a valid, self-contained GLB/glTF.</div>
        </Html>
      )
    }

    return this.props.children
  }
}

function FocusSelectedMesh({ scene, selectedMeshId }) {
  const bounds = useBounds()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = selectedMeshId
        ? scene.getObjectByProperty('uuid', selectedMeshId)
        : scene
      if (target) bounds.refresh(target).fit().clip()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [bounds, scene, selectedMeshId])

  return null
}

function UploadedModelScene({ url, selectedMeshId, onSelectMesh, onPartsChange, appearanceOverrides }) {
  const gltf = useGLTF(url)
  const rotation = selectedMeshId ? [0, 0, 0] : [0, -Math.PI / 3.5, 0]
  const scene = useMemo(() => {
    const clonedScene = clone(gltf.scene)
    clonedScene.traverse((node) => {
      if (!node.isMesh || !node.material) return
      node.material = Array.isArray(node.material)
        ? node.material.map((material) => material.clone())
        : node.material.clone()
    })
    return clonedScene
  }, [gltf.scene])
  const meshes = useMemo(() => getMeshNodes(scene), [scene])
  const selectableMeshIds = useMemo(() => new Set(meshes.map(({ meshId }) => meshId)), [meshes])
  const hoverTimeout = useRef(null)

  useEffect(() => {
    registerUploadedScene(url, gltf.scene)
  }, [gltf.scene, url])

  useEffect(() => () => {
    scene.traverse((node) => {
      if (!node.isMesh || !node.material) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => material.dispose())
    })
  }, [scene])

  useEffect(() => {
    onPartsChange(meshes)
  }, [meshes, onPartsChange])

  useEffect(() => {
    const visibility = new Map()
    scene.traverse((node) => {
      if (!node.isMesh) return
      visibility.set(node, node.visible)
      node.visible = selectedMeshId ? node.uuid === selectedMeshId : visibility.get(node)
    })

    return () => {
      visibility.forEach((visible, node) => {
        node.visible = visible
      })
    }
  }, [scene, selectedMeshId])

  useEffect(() => {
    scene.traverse((node) => {
      if (!node.isMesh || !node.material) return
      const overrides = appearanceOverrides[node.uuid]
      if (!overrides) return

      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => {
        Object.entries(overrides).forEach(([key, value]) => {
          if (key === 'color' && material.color) material.color.set(value)
          else if (key === 'emissiveColor' && material.emissive) material.emissive.set(value)
          else if (key in material) material[key] = value
        })

        if (overrides.transparent !== undefined || overrides.wireframe !== undefined) {
          material.needsUpdate = true
        }
      })
    })
  }, [appearanceOverrides, scene])

  useEffect(() => () => {
    window.clearTimeout(hoverTimeout.current)
    document.body.style.cursor = 'auto'
  }, [])

  const handlePointerOver = (event) => {
    event.stopPropagation()
    window.clearTimeout(hoverTimeout.current)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (event) => {
    event.stopPropagation()
    hoverTimeout.current = window.setTimeout(() => {
      document.body.style.cursor = 'auto'
    }, 120)
  }

  const handleClick = (event) => {
    event.stopPropagation()
    if (selectedMeshId || !selectableMeshIds.has(event.object.uuid)) return
    if (event.delta > 5) return
    window.clearTimeout(hoverTimeout.current)
    document.body.style.cursor = 'auto'
    onSelectMesh(event.object.uuid)
  }

  return (
    <Bounds fit clip observe margin={selectedMeshId ? 2 : 1.8}>
      <Center>
        <group rotation={rotation}>
          <FocusSelectedMesh scene={scene} selectedMeshId={selectedMeshId} />
          <primitive
            object={scene}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          />
          {!selectedMeshId && (
            <UploadedModelHotspots meshes={meshes} onSelect={onSelectMesh} hoverTimeout={hoverTimeout} />
          )}
        </group>
      </Center>
    </Bounds>
  )
}
