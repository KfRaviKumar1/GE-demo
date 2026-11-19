import { LoaderUtils } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Download progress (0-100) per model URL. It is shared by every load of a
// URL, so a download started early (the sign-in page preload) still shows
// its progress when the viewer opens.
const progress = new Map()
const listeners = new Set()
export const getDownloadProgress = (url) => progress.get(url) ?? null
export const subscribeDownloadProgress = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const report = (url, value) => {
  progress.set(url, value)
  listeners.forEach((listener) => listener())
}

// Static hosts such as Netlify send .glb files uncompressed, so the build
// ships gzipped copies (model.glb.gz, about a third of the size). This loader
// unzips them in the browser; plain .glb files load as before.
export class GzipGLTFLoader extends GLTFLoader {
  load(url, onLoad, _onProgress, onError) {
    download(url)
      .then((buffer) => this.parse(buffer, LoaderUtils.extractUrlBase(url), onLoad, onError))
      .catch(onError)
  }
}

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download ${url} (${response.status})`)
  const total = Number(response.headers.get('Content-Length')) || 0
  const reader = response.body.getReader()
  const chunks = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    if (total) report(url, Math.min(99, Math.round((loaded / total) * 100)))
  }
  report(url, 100)

  const file = new Blob(chunks)
  // Gzip data starts with 1f 8b. A host may already have unzipped it (when it
  // sends Content-Encoding: gzip), in which case these bytes are the GLB's own.
  const [first, second] = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  if (first !== 0x1f || second !== 0x8b) return file.arrayBuffer()
  return new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}
