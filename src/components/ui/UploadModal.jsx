import { useRef, useState } from 'react'
import { FileUp, Upload, X } from 'lucide-react'

const isModelFile = (file) => /\.(glb|gltf)$/i.test(file.name)
const isHotspotFile = (file) => /\.json$/i.test(file.name)
const getFileStem = (file) => file.name.replace(/\.(glb|gltf|json)$/i, '').toLowerCase()

export default function UploadModal({ open, onClose, onUpload }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (!open) return null

  const addFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles)
    const invalidFiles = incoming.filter((file) => !isModelFile(file) && !isHotspotFile(file))

    setError(invalidFiles.length
      ? `${invalidFiles.map(({ name }) => name).join(', ')} ${invalidFiles.length === 1 ? 'is' : 'are'} not a .glb, .gltf, or .json file.`
      : '')
    setFiles((current) => [...current, ...incoming.filter((file) => isModelFile(file) || isHotspotFile(file))])
  }

  const submit = async () => {
    const modelFiles = files.filter(isModelFile)
    const hotspotFiles = files.filter(isHotspotFile)
    if (!modelFiles.length) {
      setError('Choose at least one .glb or .gltf model file.')
      return
    }

    const hotspotFilesByStem = new Map()
    hotspotFiles.forEach((file) => {
      const stem = getFileStem(file)
      const matches = hotspotFilesByStem.get(stem) ?? []
      matches.push(file)
      hotspotFilesByStem.set(stem, matches)
    })

    const modelsByStem = new Map()
    modelFiles.forEach((file) => {
      const stem = getFileStem(file)
      const matches = modelsByStem.get(stem) ?? []
      matches.push(file)
      modelsByStem.set(stem, matches)
    })

    const duplicateStem = [...modelsByStem.entries()].find(([, matches]) => matches.length > 1)
    if (duplicateStem) {
      setError(`More than one model uses the filename "${duplicateStem[0]}". Rename the files so each model has a unique filename.`)
      return
    }

    const hasSingleModelPair = modelFiles.length === 1 && hotspotFiles.length === 1
    const unmatchedHotspotFile = hasSingleModelPair
      ? null
      : hotspotFiles.find((file) => modelsByStem.get(getFileStem(file))?.length !== 1)
    if (unmatchedHotspotFile) {
      setError(`${unmatchedHotspotFile.name} does not have a model file with the same filename.`)
      return
    }

    setUploading(true)
    try {
      const uploads = await Promise.all(modelFiles.map(async (modelFile) => {
        const hotspotFile = hasSingleModelPair
          ? hotspotFiles[0]
          : hotspotFilesByStem.get(getFileStem(modelFile))?.[0]
        if (!hotspotFile) return { modelFile, hotspotNames: null }

        const hotspotJson = await hotspotFile.text()
        let hotspotNames
        try {
          hotspotNames = JSON.parse(hotspotJson)
        } catch {
          throw new Error(`${hotspotFile.name} is not valid JSON.`)
        }

        if (!Array.isArray(hotspotNames) || !hotspotNames.every((name) => typeof name === 'string' && name.trim())) {
          throw new Error(`${hotspotFile.name} must contain a JSON array of non-empty mesh-name strings.`)
        }

        return { modelFile, hotspotNames: hotspotNames.map((name) => name.trim()) }
      }))

      onUpload(uploads)
      setFiles([])
      setError('')
      onClose()
    } catch (uploadError) {
      if (!(uploadError instanceof Error)) throw uploadError
      setError(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <header className="upload-modal-header">
          <div>
            <span className="eyebrow">LOCAL MODEL LIBRARY</span>
            <h2 id="upload-modal-title">Add 3D models</h2>
          </div>
          <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close upload dialog"><X size={18} /></button>
        </header>
        <div
          className={`upload-modal-dropzone ${dragging ? 'upload-modal-dropzone-active' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFiles(event.dataTransfer.files)
          }}
        >
          <FileUp size={26} />
          <strong>Drop model and hotspot JSON files here</strong>
          <span>or choose matching GLB / glTF and JSON files</span>
          <button type="button" className="workspace-primary-link" onClick={() => inputRef.current?.click()}>
            <Upload size={15} /> Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.json,model/gltf-binary,model/gltf+json,application/json"
            multiple
            onChange={(event) => {
              addFiles(event.target.files ?? [])
              event.target.value = ''
            }}
          />
        </div>
        {files.length > 0 && (
          <ul className="upload-modal-file-list" aria-label="Files to upload">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}-${index}`}>
                <span>{file.name}</span>
                <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="upload-modal-error" role="alert">{error}</p>}
        <p className="upload-modal-note">A hotspot .json file is optional. When uploading one model and one JSON, their filenames can differ; for multiple models, name each JSON with the same base filename as its model. JSON must be an array of mesh names in hotspot display order; without one, all model meshes are shown. Files stay in this browser session; they are not sent to a server. glTF files must embed their buffers and textures; use a self-contained GLB otherwise.</p>
        <a className="text-button upload-modal-template-link" href="/hotspot-names-template.json" download>
          Download JSON template
        </a>
        <footer className="upload-modal-actions">
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <button type="button" className="workspace-primary-link" onClick={submit} disabled={uploading}>
            {uploading ? 'Reading files…' : `Add ${files.filter(isModelFile).length || ''} ${files.filter(isModelFile).length === 1 ? 'model' : 'models'}`}
          </button>
        </footer>
      </section>
    </div>
  )
}
