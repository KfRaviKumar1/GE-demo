import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Bounds, Center, Html, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { createModelParts } from '../../data/modelParts.js'
import { registerUploadedScene } from './modelResources.js'

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

function UploadedModelScene({ url, selectedMeshId, onSelectMesh, onPartsChange, appearanceOverrides }) {
  const gltf = useGLTF(url)
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
  const [hoveredMeshId, setHoveredMeshId] = useState(null)
  const hoverTimeout = useRef(null)
  const hoveredMeshRef = useRef(null)

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
    hoveredMeshRef.current = event.object.uuid
    setHoveredMeshId(event.object.uuid)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (event) => {
    event.stopPropagation()
    const meshId = event.object.uuid
    hoverTimeout.current = window.setTimeout(() => {
      if (hoveredMeshRef.current !== meshId) return
      hoveredMeshRef.current = null
      setHoveredMeshId(null)
      document.body.style.cursor = 'auto'
    }, 120)
  }

  const handleClick = (event) => {
    event.stopPropagation()
    if (event.delta > 5) return
    window.clearTimeout(hoverTimeout.current)
    hoveredMeshRef.current = null
    setHoveredMeshId(null)
    document.body.style.cursor = 'auto'
    onSelectMesh(event.object.uuid)
  }

  const pinNodes = selectedMeshId
    ? []
    : meshes.filter(({ meshId }) => meshId === hoveredMeshId)

  return (
    <Bounds key={selectedMeshId || 'full-model'} fit clip observe margin={1.2}>
      <Center>
        <group>
          <primitive
            object={scene}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          />
          {pinNodes.map((mesh) => (
            <Html key={mesh.meshId} position={mesh.coordinates} center distanceFactor={10} pointerEvents="none">
              <span className="model-part-pin" aria-hidden="true">
                {mesh.name}
              </span>
            </Html>
          ))}
        </group>
      </Center>
    </Bounds>
  )
}
