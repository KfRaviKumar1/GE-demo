import { useGLTF } from '@react-three/drei'

const loadedScenes = new Map()
const releasedUrls = new Set()

export function registerUploadedScene(url, scene) {
  if (releasedUrls.has(url)) {
    releasedUrls.delete(url)
    disposeScene(scene)
    return
  }

  loadedScenes.set(url, scene)
}

export function releaseUploadedModel(url) {
  useGLTF.clear(url)

  const scene = loadedScenes.get(url)
  if (scene) {
    disposeScene(scene)
    loadedScenes.delete(url)
  } else {
    releasedUrls.add(url)
  }
}

function disposeScene(scene) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()

  scene.traverse((node) => {
    if (!node.isMesh) return
    if (node.geometry) geometries.add(node.geometry)

    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material]
    nodeMaterials.filter(Boolean).forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value)
      })
    })
  })

  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => texture.dispose())
}
