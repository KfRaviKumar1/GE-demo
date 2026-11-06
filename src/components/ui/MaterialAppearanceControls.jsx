const surfaceMaps = [
  ['baseColor', 'Base color'],
  ['roughness', 'Roughness'],
  ['metalness', 'Metalness'],
  ['normal', 'Normal'],
  ['emissive', 'Emissive'],
  ['ambientOcclusion', 'AO'],
]

function RangeControl({ label, value, min = 0, max = 1, step = 0.01, onChange, disabled = false }) {
  return (
    <label className="appearance-range">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{Number(value).toFixed(2)}</output>
    </label>
  )
}

export default function MaterialAppearanceControls({ appearance, onChange }) {
  return (
    <details className="appearance-inspector">
      <summary>MATERIAL APPEARANCE</summary>
      <div className="appearance-controls">
        <label className="appearance-color">
          <span>BASE COLOR</span>
          <input type="color" value={appearance.color} onChange={(event) => onChange('color', event.target.value)} />
        </label>
        <label className="appearance-color">
          <span>EMISSIVE COLOR</span>
          <input type="color" value={appearance.emissiveColor} onChange={(event) => onChange('emissiveColor', event.target.value)} />
        </label>
        <div className="appearance-map-list" aria-label="Available material textures">
          {surfaceMaps.map(([key, label]) => (
            <span className={appearance.maps[key] ? 'appearance-map available' : 'appearance-map'} key={key}>
              {label}{appearance.maps[key] ? ' · MAP' : ''}
            </span>
          ))}
        </div>
        <RangeControl label="ROUGHNESS" value={appearance.roughness} onChange={(value) => onChange('roughness', value)} disabled={!appearance.supportsPbr} />
        <RangeControl label="METALNESS" value={appearance.metalness} onChange={(value) => onChange('metalness', value)} disabled={!appearance.supportsPbr} />
        <RangeControl label="EMISSIVE INTENSITY" value={appearance.emissiveIntensity} max={5} onChange={(value) => onChange('emissiveIntensity', value)} />
        <RangeControl label="OPACITY" value={appearance.opacity} onChange={(value) => onChange('opacity', value)} disabled={!appearance.transparent} />
        <label className="appearance-toggle">
          <input type="checkbox" checked={appearance.wireframe} onChange={(event) => onChange('wireframe', event.target.checked)} />
          <span>WIREFRAME</span>
        </label>
        <label className="appearance-toggle">
          <input type="checkbox" checked={appearance.transparent} onChange={(event) => onChange('transparent', event.target.checked)} />
          <span>TRANSPARENT</span>
        </label>
        {appearance.isPhysical && (
          <div className="appearance-physical">
            <span className="appearance-physical-heading">PHYSICAL MATERIAL</span>
            <RangeControl label="TRANSMISSION" value={appearance.transmission} onChange={(value) => onChange('transmission', value)} />
            <RangeControl label="IOR" value={appearance.ior} min={1} max={2.5} onChange={(value) => onChange('ior', value)} />
            <RangeControl label="CLEARCOAT" value={appearance.clearcoat} onChange={(value) => onChange('clearcoat', value)} />
            <RangeControl label="COAT ROUGHNESS" value={appearance.clearcoatRoughness} onChange={(value) => onChange('clearcoatRoughness', value)} />
            <RangeControl label="SHEEN" value={appearance.sheen} onChange={(value) => onChange('sheen', value)} />
          </div>
        )}
      </div>
    </details>
  )
}
