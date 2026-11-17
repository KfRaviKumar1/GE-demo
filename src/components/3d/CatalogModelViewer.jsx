import { Component, useEffect, useMemo, useRef } from 'react'
import { Bounds, Html, useBounds } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Box3, Raycaster, Sphere, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh'
import { ArrowRight } from 'lucide-react'

const VIEW_DIRECTION = new Vector3(1, 0.45, 1).normalize()
const TRANSPARENT_OPACITY = 0.28

const isInside = (object, root) => {
  for (let current = object; current; current = current.parent) if (current === root) return true
  return false
}

// One marker anchor per catalog item, placed on a real vertex of the part:
// aim slightly above/in front of the part's centre, staggered along the
// model's long axis between siblings so markers of one level don't stack.
function computeAnchors(model, scene) {
  scene.updateMatrixWorld(true)
  const items = []
  ;(function walk(item) { items.push(item); item.children?.forEach(walk) })(model)

  const boxes = new Map()
  items.forEach((item) => {
    const object = scene.getObjectByName(item.node)
    if (object) boxes.set(item, new Box3().setFromObject(object, true))
    else console.warn(`[${model.id}] node not found in GLB:`, item.node)
  })

  const size = boxes.get(model)?.getSize(new Vector3()) ?? new Vector3(1, 1, 1)
  const axis = new Vector3(
    +(size.x >= size.y && size.x >= size.z), +(size.y > size.x && size.y >= size.z), +(size.z > size.x && size.z > size.y),
  )
  const toward = new Vector3(0, 1, 0).addScaledVector(VIEW_DIRECTION, 0.6).normalize()
  const anchors = new Map()
  const vertex = new Vector3()
  const aim = new Vector3()

  items.forEach((item) => {
    const box = boxes.get(item)
    if (!box || !item.parent) return
    const siblings = item.parent.children
    const k = siblings.length > 1 ? siblings.indexOf(item) / (siblings.length - 1) - 0.5 : 0
    aim.copy(box.getCenter(new Vector3()))
      .addScaledVector(toward, box.getBoundingSphere(new Sphere()).radius * 0.5)
      .addScaledVector(axis, k * box.getSize(new Vector3()).dot(axis) * 0.5)

    let best = Infinity
    let anchor = null
    scene.getObjectByName(item.node).traverse((object) => {
      if (!object.isMesh) return
      const position = object.geometry.attributes.position
      const step = Math.max(1, Math.floor(position.count / 20000)) // sample large meshes
      for (let i = 0; i < position.count; i += step) {
        vertex.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld)
        const distance = vertex.distanceToSquared(aim)
        if (distance < best) { best = distance; anchor = vertex.clone() }
      }
    })
    if (anchor) anchors.set(item, anchor)
  })
  return anchors
}

// Spatial index per geometry so occlusion rays stay cheap on large models.
// Built once and kept with the cached GLTF.
function ensureBoundsTrees(root) {
  root.traverse((object) => {
    if (!object.isMesh) return
    if (!object.geometry.boundsTree) computeBoundsTree.call(object.geometry)
    object.raycast = acceleratedRaycast
  })
}

function FocusItem({ scene, item }) {
  const bounds = useBounds()
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = scene.getObjectByName(item.node) ?? scene
      // Bounds.fit() keeps the current view direction, so first look at the
      // target from the standard 3/4 angle (models can be far from the origin).
      const sphere = new Box3().setFromObject(target, true).getBoundingSphere(new Sphere())
      camera.position.copy(sphere.center).addScaledVector(VIEW_DIRECTION, sphere.radius * 3)
      camera.lookAt(sphere.center)
      controls?.target.copy(sphere.center)
      bounds.refresh(target).fit().clip()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [bounds, camera, controls, scene, item])

  return null
}

// Numbered marker pinned to a point on the model (same look as the hotspots).
function Marker({ position, item, onSelect, markerRef }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]}>
      <button
        ref={markerRef}
        className="hotspot"
        onClick={(event) => { event.stopPropagation(); onSelect(item) }}
        aria-label={`Explore ${item.name}`}
      >
        <span className="hotspot-pulse" />
        <span className="hotspot-number">{item.id}</span>
        <span className="hotspot-label">{item.name}</span>
        <ArrowRight className="hotspot-arrow" size={14} />
      </button>
    </Html>
  )
}

// Hides markers whose point is behind other geometry from the current view
// (e.g. after rotating the model), and shows them again when it comes back
// into view. Checked only when the camera moves.
function useMarkerOcclusion({ target, markers, anchors, refs, enabled }) {
  const camera = useThree((state) => state.camera)
  const raycaster = useMemo(() => {
    const caster = new Raycaster()
    caster.firstHitOnly = true
    return caster
  }, [])
  const lastView = useRef(null)
  const direction = useMemo(() => new Vector3(), [])
  const radius = useMemo(() => new Box3().setFromObject(target).getBoundingSphere(new Sphere()).radius, [target])

  useEffect(() => { lastView.current = null }, [target, markers, enabled])

  useFrame(() => {
    const view = camera.matrixWorld.elements.join(',')
    if (view === lastView.current) return
    lastView.current = view

    markers.forEach((item, index) => {
      const element = refs.current[index]
      if (!element) return
      let hidden = false
      if (enabled) {
        const point = anchors.get(item)
        const distance = camera.position.distanceTo(point)
        raycaster.set(camera.position, direction.subVectors(point, camera.position).normalize())
        raycaster.far = distance
        const hit = raycaster.intersectObject(target, true)[0]
        hidden = Boolean(hit && hit.distance < distance - Math.max(radius * 0.02, distance * 0.002))
      }
      element.classList.toggle('hotspot-occluded', hidden)
    })
  })
}

const useMeshopt = (loader) => loader.setMeshoptDecoder(MeshoptDecoder)

function CatalogModelScene({ item, onSelect, onProgress, displayMode = 'opaque' }) {
  // useLoader (not drei's useGLTF) so download progress can be reported.
  const { scene } = useLoader(GLTFLoader, item.model.file, useMeshopt, onProgress)
  const anchors = useMemo(() => computeAnchors(item.model, scene), [item.model, scene])
  const target = scene.getObjectByName(item.node) ?? scene
  const markers = useMemo(() => (item.children ?? []).filter((child) => anchors.has(child)), [item, anchors])
  const markerRefs = useRef([])

  useMemo(() => ensureBoundsTrees(scene), [scene])

  // Show only the selected item (and everything under it).
  useEffect(() => {
    scene.traverse((object) => { if (object.isMesh) object.visible = isInside(object, target) })
    return () => scene.traverse((object) => { if (object.isMesh) object.visible = true })
  }, [scene, target])

  // Transparent mode: swap the visible part's materials for see-through copies.
  useEffect(() => {
    if (displayMode !== 'transparent') return
    const originals = []
    const seeThrough = (material) => {
      const copy = material.clone()
      copy.transparent = true
      copy.opacity = TRANSPARENT_OPACITY
      copy.depthWrite = false
      return copy
    }
    target.traverse((object) => {
      if (!object.isMesh) return
      originals.push([object, object.material])
      object.material = Array.isArray(object.material) ? object.material.map(seeThrough) : seeThrough(object.material)
    })
    return () => originals.forEach(([object, material]) => {
      ;(Array.isArray(object.material) ? object.material : [object.material]).forEach((copy) => copy.dispose())
      object.material = material
    })
  }, [target, displayMode])

  // In transparent mode every marker stays visible: nothing hides it.
  useMarkerOcclusion({ target, markers, anchors, refs: markerRefs, enabled: displayMode !== 'transparent' })

  return (
    <Bounds fit clip observe margin={1.25}>
      <FocusItem scene={scene} item={item} />
      <group>
        <primitive object={scene} />
        {markers.map((child, index) => (
          <Marker
            key={child.node}
            position={anchors.get(child)}
            item={child}
            onSelect={onSelect}
            markerRef={(element) => { markerRefs.current[index] = element }}
          />
        ))}
      </group>
    </Bounds>
  )
}

class ModelLoadBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Unable to load the catalog model.', error)
  }

  // Forget the failed download (e.g. a dropped connection) and load again.
  retry = () => {
    useLoader.clear(GLTFLoader, this.props.url)
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="canvas-loader model-load-error" role="alert">
            Could not load this model.
            <button type="button" className="model-retry" onClick={this.retry}>Try again</button>
          </div>
        </Html>
      )
    }
    return this.props.children
  }
}

export default function CatalogModelViewer(props) {
  return (
    <ModelLoadBoundary key={props.item.model.id} url={props.item.model.file}>
      <CatalogModelScene {...props} />
    </ModelLoadBoundary>
  )
}

export function initialCameraPosition(distance = 9) {
  return VIEW_DIRECTION.clone().multiplyScalar(distance).toArray()
}
