import { Component, useEffect, useMemo, useRef } from 'react'
import { Bounds, Html, useBounds } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { AnimationClip, AnimationMixer, Box3, LoopOnce, Raycaster, Sphere, Vector3 } from 'three'
import { GzipGLTFLoader } from './gzipGLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh'
import { ArrowRight } from 'lucide-react'

// Direction the camera looks from when a page opens: the standard 3/4 angle,
// unless the model sets its own `view: [x, y, z]` in its data file.
const DEFAULT_VIEW = [1, 0.45, 1]
const viewDirections = new WeakMap()
function viewDirection(model) {
  if (!viewDirections.has(model)) viewDirections.set(model, new Vector3(...(model.view ?? DEFAULT_VIEW)).normalize())
  return viewDirections.get(model)
}
const TRANSPARENT_OPACITY = 0.28

const isInside = (object, root) => {
  for (let current = object; current; current = current.parent) if (current === root) return true
  return false
}

const MAX_SAMPLES_PER_PART = 30000
const MAX_VISIBILITY_TESTS = 5000
// The page's camera ends up somewhere along the opening direction once the view
// is fitted to the screen, so a marker spot must be visible from all of these.
const EYE_DISTANCES = [1.6, 2.4, 3, 4.5, 7]
const anchorCache = new WeakMap() // catalog item -> Map(child -> anchor point)

// Where a page's camera starts: looking at the target from the model's opening angle.
function openingEye(model, sphere, distance = 3) {
  return sphere.center.clone().addScaledVector(viewDirection(model), sphere.radius * distance)
}

// Marker anchors for the children of `item`, on the page that shows `item`.
// Each marker sits on a real vertex of its part, near a preferred spot
// (slightly above/in front of the part's centre, staggered along the model's
// long axis between siblings so they don't stack), but it is the nearest
// vertex that is not blocked from the page's opening camera position, so
// every marker is visible when the page first renders.
function computeViewAnchors(item, scene) {
  if (anchorCache.has(item)) return anchorCache.get(item)
  scene.updateMatrixWorld(true)
  const target = scene.getObjectByName(item.node) ?? scene
  const modelSize = new Box3().setFromObject(scene.getObjectByName(item.model.node) ?? scene, true).getSize(new Vector3())
  const axis = new Vector3(
    +(modelSize.x >= modelSize.y && modelSize.x >= modelSize.z),
    +(modelSize.y > modelSize.x && modelSize.y >= modelSize.z),
    +(modelSize.z > modelSize.x && modelSize.z > modelSize.y),
  )
  const toward = new Vector3(0, 1, 0).addScaledVector(viewDirection(item.model), 0.6).normalize()
  const view = new Box3().setFromObject(target, true).getBoundingSphere(new Sphere())
  const eyes = EYE_DISTANCES.map((distance) => openingEye(item.model, view, distance))
  const tolerance = view.radius * 0.01
  const raycaster = new Raycaster()
  raycaster.firstHitOnly = true
  const direction = new Vector3()
  const isVisibleFrom = (eye, point) => {
    const distance = eye.distanceTo(point)
    raycaster.set(eye, direction.subVectors(point, eye).normalize())
    raycaster.far = distance + tolerance
    const hit = raycaster.intersectObject(target, true)[0] // only this page's parts are shown
    return !hit || hit.distance >= distance - tolerance
  }
  const isVisibleFromEye = (point) => eyes.every((eye) => isVisibleFrom(eye, point))

  const anchors = new Map()
  const children = item.children ?? []
  children.forEach((child, index) => {
    const part = scene.getObjectByName(child.node)
    if (!part) { console.warn(`[${item.model.id}] node not found in GLB:`, child.node); return }
    const box = new Box3().setFromObject(part, true)
    const k = children.length > 1 ? index / (children.length - 1) - 0.5 : 0
    const aim = box.getCenter(new Vector3())
      .addScaledVector(toward, box.getBoundingSphere(new Sphere()).radius * 0.5)
      .addScaledVector(axis, k * box.getSize(new Vector3()).dot(axis) * 0.5)

    // Sample the part's vertices, nearest to the preferred spot first.
    const meshes = []
    part.traverse((object) => { if (object.isMesh) meshes.push(object) })
    const total = meshes.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0)
    const step = Math.max(1, Math.ceil(total / MAX_SAMPLES_PER_PART))
    const candidates = []
    meshes.forEach((mesh) => {
      const position = mesh.geometry.attributes.position
      for (let i = 0; i < position.count; i += step) {
        const point = new Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
        candidates.push({ point, mesh, distance: point.distanceToSquared(aim) })
      }
    })
    candidates.sort((a, b) => a.distance - b.distance)
    const visible = candidates.slice(0, MAX_VISIBILITY_TESTS).find(({ point }) => isVisibleFromEye(point))
    const chosen = visible ?? candidates[0]
    // Stored relative to the mesh it sits on, so the marker follows the part
    // when it moves (e.g. the Explode slider). A part with no visible spot
    // from the opening view (fully enclosed by others, like fan blades inside
    // a cowl) gets an `enclosed` marker that is never hidden, so it can
    // always be clicked.
    if (chosen) {
      anchors.set(child, {
        mesh: chosen.mesh,
        local: chosen.mesh.worldToLocal(chosen.point.clone()),
        enclosed: !visible,
      })
    }
  })

  anchorCache.set(item, anchors)
  return anchors
}

// Current world position of a marker anchor (follows its part as it moves).
function anchorPosition(anchor, out = new Vector3()) {
  anchor.mesh.updateWorldMatrix(true, false)
  return out.copy(anchor.local).applyMatrix4(anchor.mesh.matrixWorld)
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

// `fitBox` (optional) is the area to frame instead of the item itself, e.g. the
// fully exploded model so it stays in view across the Explode slider.
function FocusItem({ scene, item, fitBox }) {
  const bounds = useBounds()
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = scene.getObjectByName(item.node) ?? scene
      // Bounds.fit() keeps the current view direction, so first look at the
      // target from the standard 3/4 angle (models can be far from the origin).
      const sphere = (fitBox ?? new Box3().setFromObject(target, true)).getBoundingSphere(new Sphere())
      camera.position.copy(openingEye(item.model, sphere)) // same viewpoint the marker spots are chosen for
      camera.lookAt(sphere.center)
      controls?.target.copy(sphere.center)
      bounds.refresh(fitBox ?? target).fit().clip()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [bounds, camera, controls, scene, item, fitBox])

  return null
}

// Numbered marker pinned to a point on the model (same look as the hotspots).
// It follows its part every frame, so it stays on the part when it moves.
function Marker({ anchor, item, onSelect, markerRef }) {
  const group = useRef()
  useFrame(() => { if (group.current) anchorPosition(anchor, group.current.position) })
  return (
    <group ref={group}>
    <Html center zIndexRange={[20, 0]}>
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
    </group>
  )
}

// Hides markers whose point is behind other (solid) geometry from the current
// view, e.g. after rotating the model, and shows them again when it comes back
// into view. See-through parts don't hide markers. Every marker is shown until
// the user first moves the model; after that it is checked whenever the camera
// moves or parts change transparency.
function useMarkerOcclusion({ target, markers, anchors, refs, version, moved }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const raycaster = useMemo(() => new Raycaster(), [])
  const lastView = useRef(null)
  const userMoved = useRef(false)
  const direction = useMemo(() => new Vector3(), [])
  const anchorPoint = useMemo(() => new Vector3(), [])
  const radius = useMemo(() => new Box3().setFromObject(target).getBoundingSphere(new Sphere()).radius, [target])

  // Re-check when the parts move (Explode slider) or change transparency.
  useEffect(() => { lastView.current = null }, [target, markers, version, moved])

  useEffect(() => {
    if (!controls) return
    const onStart = () => { userMoved.current = true; lastView.current = null }
    controls.addEventListener('start', onStart)
    return () => controls.removeEventListener('start', onStart)
  }, [controls])

  useFrame(() => {
    if (!userMoved.current) return // opening view: all markers stay visible
    const view = camera.matrixWorld.elements.join(',')
    if (view === lastView.current) return
    lastView.current = view

    markers.forEach((item, index) => {
      const element = refs.current[index]
      if (!element) return
      const anchor = anchors.get(item)
      if (anchor.enclosed) { element.classList.remove('hotspot-occluded'); return } // always reachable
      const point = anchorPosition(anchor, anchorPoint)
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

const TIMELINE_SAMPLES = 400

// Maps the slider (0..1) to a time in the explode clip by how far the parts
// have moved, not by time: the clip's own timing has idle stretches and slow
// ease-ins (nothing moves for its first ~7%), so a time-based slider would
// show no change for its first steps. Here every step moves the parts.
function explodeTimeline(clip) {
  const tracks = clip.tracks.filter((track) => track.name.endsWith('.position'))
  if (!tracks.length) return (value) => value * clip.duration
  const interpolants = tracks.map((track) => track.createInterpolant())
  const starts = interpolants.map((interpolant) => Array.from(interpolant.evaluate(0)))
  const times = []
  const moved = [] // total distance of all parts from where they start, per sample
  for (let i = 0; i <= TIMELINE_SAMPLES; i++) {
    const time = (i / TIMELINE_SAMPLES) * clip.duration
    let total = 0
    interpolants.forEach((interpolant, k) => {
      const [x, y, z] = interpolant.evaluate(time)
      const [x0, y0, z0] = starts[k]
      total += Math.hypot(x - x0, y - y0, z - z0)
    })
    times.push(time)
    moved.push(Math.max(total, moved[i - 1] ?? 0)) // keep it non-decreasing
  }
  const full = moved[moved.length - 1]
  if (!full) return (value) => value * clip.duration
  return (value) => {
    const wanted = Math.min(Math.max(value, 0), 1) * full
    if (wanted <= 0) return 0
    const i = moved.findIndex((distance) => distance >= wanted)
    if (i <= 0) return times[Math.max(i, 0)]
    const span = moved[i] - moved[i - 1]
    const fraction = span > 0 ? (wanted - moved[i - 1]) / span : 1
    return times[i - 1] + fraction * (times[i] - times[i - 1])
  }
}

// Explode slider: holds the model's explode animation paused and moves it to
// `amount` (0 = compact, 1 = fully exploded). Leaving the page stops the clip,
// which puts every part back where it was, so other pages show the model compact.
// Returns the area covering both the compact and the fully exploded model.
function useExplode({ scene, animations, target, clipName, amount }) {
  const setup = useMemo(() => {
    if (!clipName) return null
    const clip = AnimationClip.findByName(animations, clipName)
    if (!clip) { console.warn('Animation clip not found:', clipName); return null }
    const mixer = new AnimationMixer(scene)
    const action = mixer.clipAction(clip)
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    const timeAt = explodeTimeline(clip)
    const pose = (value) => {
      if (!action.isScheduled()) { action.play(); action.paused = true }
      action.time = timeAt(value)
      mixer.update(0)
      scene.updateMatrixWorld(true)
    }
    pose(1)
    const box = new Box3().setFromObject(target)
    pose(0)
    box.union(new Box3().setFromObject(target))
    return { mixer, action, pose, box }
  }, [scene, animations, target, clipName])

  useEffect(() => { setup?.pose(amount) }, [setup, amount])
  useEffect(() => () => {
    if (!setup) return
    setup.action.stop() // restores the parts' original positions
    setup.mixer.uncacheRoot(scene)
  }, [setup, scene])

  return setup?.box ?? null
}

const useMeshopt = (loader) => loader.setMeshoptDecoder(MeshoptDecoder)

// Starts downloading a model into the same cache the viewer reads from.
export const preloadModel = (model) => useLoader.preload(GzipGLTFLoader, model.file, useMeshopt)

// `tool` is 'transparent', 'opaque' or null; `seeThroughParts` holds the node
// names of parts currently see-through; `onSetSeeThrough(node, boolean)`;
// `explode` (0..1) drives the Explode slider on the model's own page.
function CatalogModelScene({ item, onSelect, tool = null, seeThroughParts, onSetSeeThrough, explode = 0 }) {
  // Download progress is reported through gzipGLTFLoader.js.
  const { scene, animations } = useLoader(GzipGLTFLoader, item.model.file, useMeshopt)
  useMemo(() => ensureBoundsTrees(scene), [scene]) // before the anchors: they use raycasts
  const anchors = useMemo(() => computeViewAnchors(item, scene), [item, scene])
  const target = scene.getObjectByName(item.node) ?? scene
  const markers = useMemo(() => (item.children ?? []).filter((child) => anchors.has(child)), [item, anchors])
  const markerRefs = useRef([])

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

  // Only the full-model page of a model with an explode clip gets the slider.
  const explodeClip = item === item.model ? item.model.explode?.clip : null
  const fitBox = useExplode({ scene, animations, target, clipName: explodeClip, amount: explode })

  useMarkerOcclusion({ target, markers, anchors, refs: markerRefs, version: seeThroughParts, moved: explode })

  usePartClicks({ target, meshParts, tool, onSetSeeThrough })

  return (
    <Bounds fit clip observe margin={1.25}>
      <FocusItem scene={scene} item={item} fitBox={fitBox} />
      <group>
        <primitive object={scene} />
        {markers.map((child, index) => (
          <Marker
            key={child.node}
            anchor={anchors.get(child)}
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
    useLoader.clear(GzipGLTFLoader, this.props.url)
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

export function initialCameraPosition(model, distance = 9) {
  return viewDirection(model).clone().multiplyScalar(distance).toArray()
}
