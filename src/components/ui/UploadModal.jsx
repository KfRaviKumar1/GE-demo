import { useRef, useState } from 'react'
import { FileUp, Upload, X } from 'lucide-react'

const isModelFile = (file) => /\.(glb|gltf)$/i.test(file.name)

export default function UploadModal({ open, onClose, onUpload }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  if (!open) return null

  const addFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles)
    const invalidFiles = incoming.filter((file) => !isModelFile(file))
    const validFiles = incoming.filter(isModelFile)

    setError(invalidFiles.length
      ? `${invalidFiles.map(({ name }) => name).join(', ')} ${invalidFiles.length === 1 ? 'is' : 'are'} not a .glb or .gltf file.`
      : '')
    setFiles((current) => [...current, ...validFiles])
  }

  const submit = () => {
    if (!files.length) {
      setError('Choose at least one .glb or .gltf file.')
      return
    }

    onUpload(files)
    setFiles([])
    setError('')
    onClose()
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
          <strong>Drop model files here</strong>
          <span>or choose multiple GLB / glTF files</span>
          <button type="button" className="workspace-primary-link" onClick={() => inputRef.current?.click()}>
            <Upload size={15} /> Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
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
        <p className="upload-modal-note">Files stay in this browser session; they are not sent to a server. glTF files must embed their buffers and textures; use a self-contained GLB otherwise.</p>
        <footer className="upload-modal-actions">
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <button type="button" className="workspace-primary-link" onClick={submit}>Add {files.length || ''} {files.length === 1 ? 'model' : 'models'}</button>
        </footer>
      </section>
    </div>
  )
}
