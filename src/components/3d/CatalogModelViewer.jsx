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

// Hides markers whose point is behind other (solid) geometry from the current
// view, e.g. after rotating the model, and shows them again when it comes back
// into view. See-through parts don't hide markers. Checked when the camera
// moves or parts change transparency.
function useMarkerOcclusion({ target, markers, anchors, refs, version }) {
  const camera = useThree((state) => state.camera)
  const raycaster = useMemo(() => new Raycaster(), [])
  const lastView = useRef(null)
  const direction = useMemo(() => new Vector3(), [])
  const radius = useMemo(() => new Box3().setFromObject(target).getBoundingSphere(new Sphere()).radius, [target])

  useEffect(() => { lastView.current = null }, [target, markers, version])

  useFrame(() => {
    const view = camera.matrixWorld.elements.join(',')
    if (view === lastView.current) return
    lastView.current = view

    markers.forEach((item, index) => {
      const element = refs.current[index]
      if (!element) return
      const point = anchors.get(item)
      const distance = camera.position.distanceTo(point)
      raycaster.set(camera.position, direction.subVectors(point, camera.position).normalize())
      raycaster.far = distance
      const hit = raycaster.intersectObject(target, true).find(({ object }) => !object.userData.seeThrough)
      const hidden = Boolean(hit && hit.distance < distance - Math.max(radius * 0.02, distance * 0.002))
      element.classList.toggle('hotspot-occluded', hidden)
    })
  })
}

const seeThroughCopy = (material) => {
  const copy = material.clone()
  copy.transparent = true
  copy.opacity = TRANSPARENT_OPACITY
  copy.depthWrite = false
  return copy
}

// The doc-level part (deepest catalog item) each mesh belongs to, so a click
// anywhere on a part applies to the whole part.
function mapMeshesToParts(model, scene) {
  const parts = new Map()
  ;(function walk(item) {
    scene.getObjectByName(item.node)?.traverse((object) => { if (object.isMesh) parts.set(object, item) })
    item.children?.forEach(walk) // children overwrite their parent: deepest wins
  })(model)
  return parts
}

// With a tool picked, clicking a part makes it see-through (Transparent) or
// solid again (Opaque). Transparent clicks pass through parts that are already
// see-through; Opaque clicks pick the see-through part under the pointer.
// Uses plain pointer events + a raycast against the visible model (the cached
// GLTF scene is re-mounted on every route, so R3F's own events are not used).
function usePartClicks({ target, meshParts, tool, onSetSeeThrough }) {
  const camera = useThree((state) => state.camera)
  const element = useThree((state) => state.gl.domElement)
  const raycaster = useMemo(() => new Raycaster(), [])

  useEffect(() => {
    if (!tool || !onSetSeeThrough) return
    let down = null
    const onDown = (event) => { down = [event.clientX, event.clientY] }
    const onUp = (event) => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 5) return // a drag, not a click
      down = null
      const rect = element.getBoundingClientRect()
      const pointer = { x: ((event.clientX - rect.left) / rect.width) * 2 - 1, y: -((event.clientY - rect.top) / rect.height) * 2 + 1 }
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObject(target, true).filter(({ object }) => object.visible && meshParts.has(object))
      const wantSeeThrough = tool === 'transparent'
      const hit = hits.find(({ object }) => Boolean(object.userData.seeThrough) !== wantSeeThrough) ?? hits[0]
      if (hit) onSetSeeThrough(meshParts.get(hit.object).node, wantSeeThrough)
    }
    element.addEventListener('pointerdown', onDown)
    element.addEventListener('pointerup', onUp)
    element.style.cursor = 'crosshair'
    return () => {
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointerup', onUp)
      element.style.cursor = ''
    }
  }, [camera, element, meshParts, onSetSeeThrough, raycaster, target, tool])
}

const useMeshopt = (loader) => loader.setMeshoptDecoder(MeshoptDecoder)

// `tool` is 'transparent', 'opaque' or null; `seeThroughParts` holds the node
// names of parts currently see-through; `onSetSeeThrough(node, boolean)`.
function CatalogModelScene({ item, onSelect, onProgress, tool = null, seeThroughParts, onSetSeeThrough }) {
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

  const meshParts = useMemo(() => mapMeshesToParts(item.model, scene), [item.model, scene])

  // Swap the materials of see-through parts for transparent copies; every
  // other part keeps its own materials.
  useEffect(() => {
    if (!seeThroughParts?.size) return
    const originals = []
    meshParts.forEach((part, mesh) => {
      if (!seeThroughParts.has(part.node)) return
      originals.push([mesh, mesh.material])
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(seeThroughCopy) : seeThroughCopy(mesh.material)
      mesh.userData.seeThrough = true
    })
    return () => originals.forEach(([mesh, material]) => {
      ;(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((copy) => copy.dispose())
      mesh.material = material
      delete mesh.userData.seeThrough
    })
  }, [meshParts, seeThroughParts])

  useMarkerOcclusion({ target, markers, anchors, refs: markerRefs, version: seeThroughParts })

  usePartClicks({ target, meshParts, tool, onSetSeeThrough })

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
