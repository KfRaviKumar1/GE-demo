import { Box, Trash2, Upload } from 'lucide-react'

export default function ModelSwitcher({ models, activeModelId, onSelect, onDelete, onUpload }) {
  return (
    <section className="model-switcher" aria-label="Model selector">
      <label htmlFor="active-model"><Box size={15} /> ACTIVE MODEL</label>
      <div className="model-switcher-controls">
        <select id="active-model" value={activeModelId ?? ''} onChange={(event) => onSelect(event.target.value || null)}>
          <option value="">Gas Turbine 01 · Demo</option>
          {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
        </select>
        {activeModelId && (
          <button type="button" onClick={() => onDelete(activeModelId)} aria-label="Remove active model" title="Remove active model">
            <Trash2 size={15} />
          </button>
        )}
        <button type="button" onClick={onUpload} aria-label="Upload models" title="Upload models">
          <Upload size={15} />
        </button>
      </div>
    </section>
  )
}
