import { Component, useEffect, useMemo } from 'react'
import { Bounds, Html, useBounds, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Box3, Sphere, Vector3 } from 'three'
import Hotspot from '../ui/Hotspot.jsx'

const VIEW_DIRECTION = new Vector3(1, 0.45, 1).normalize()

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
        if (distance < best) { best = distance; anchor = vertex.toArray() }
      }
    })
    if (anchor) anchors.set(item, anchor)
  })
  return anchors
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

function CatalogModelScene({ item, onSelect }) {
  const { scene } = useGLTF(item.model.file)
  const anchors = useMemo(() => computeAnchors(item.model, scene), [item.model, scene])

  // Show only the selected item (and everything under it).
  useEffect(() => {
    const target = scene.getObjectByName(item.node) ?? scene
    scene.traverse((object) => { if (object.isMesh) object.visible = isInside(object, target) })
    return () => scene.traverse((object) => { if (object.isMesh) object.visible = true })
  }, [scene, item])

  const markers = (item.children ?? []).filter((child) => anchors.has(child))

  return (
    <Bounds fit clip observe margin={1.25}>
      <FocusItem scene={scene} item={item} />
      <group>
        <primitive object={scene} />
        {markers.map((child) => (
          <Hotspot
            key={child.node}
            part={{ coordinates: anchors.get(child), number: child.id, name: child.name }}
            onClick={() => onSelect(child)}
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

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="canvas-loader model-load-error" role="alert">Could not load this model.</div>
        </Html>
      )
    }
    return this.props.children
  }
}

export default function CatalogModelViewer(props) {
  return (
    <ModelLoadBoundary key={props.item.model.id}>
      <CatalogModelScene {...props} />
    </ModelLoadBoundary>
  )
}

export function initialCameraPosition(distance = 9) {
  return VIEW_DIRECTION.clone().multiplyScalar(distance).toArray()
}
