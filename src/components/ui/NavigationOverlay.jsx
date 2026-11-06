import { ArrowLeft, ArrowRight, Box, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { modelParts } from '../../data/modelParts.js'

export default function NavigationOverlay({ mode, part, onBack }) {
  return (
    <header className="navigation-overlay">
      <Link className="brand-lockup" to="/" aria-label="Form and Function home">
        <span className="brand-mark"><span /></span>
        <span>FORM <i>&</i> FUNCTION</span>
      </Link>

      <div className="breadcrumb">
        <span>OBJECTS</span>
        <ChevronRight size={12} />
        <span>GAS TURBINE 01</span>
        {mode === 'detail' && (
          <>
            <ChevronRight size={12} />
            <span className="breadcrumb-current">{part.name.toUpperCase()}</span>
          </>
        )}
      </div>

      <div className="nav-actions">
        {mode === 'detail' ? (
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={15} strokeWidth={1.7} />
            <span>BACK TO OBJECT</span>
          </button>
        ) : (
          <div className="edition-tag"><span /> FIELD NOTES <b>NO. 001</b></div>
        )}
        <span className="icon-button" aria-hidden="true">
          <Box size={17} strokeWidth={1.6} />
        </span>
      </div>
      {mode === 'main' ? (
        <>
          <section className="scene-title">
            <div className="eyebrow"><span className="eyebrow-mark" /> INDUSTRIAL POWER SYSTEMS</div>
            <h1>Gas <span>Turbine</span></h1>
            <div className="title-rule" />
            <p>Inside the engine.<br />Explore each stage, down to the casing screws.</p>
          </section>
          <aside className="object-index">
            <div className="object-index-heading"><span>ENGINE COMPONENTS</span><span>{String(modelParts.length).padStart(2, '0')}</span></div>
            {modelParts.map((item) => (
              <Link className="index-row" key={item.id} to={`/part/${item.id}`} aria-label={`Explore ${item.name}`}>
                <span className="index-row-number">{item.number}</span>
                <span className="index-row-name">{item.name}</span>
                <ArrowRight size={13} />
              </Link>
            ))}
          </aside>
          <div className="scene-meta">
            <div className="meta-item"><span className="meta-label">ENGINE TYPE</span><span className="meta-value">Axial-flow gas turbine</span></div>
            <div className="meta-item"><span className="meta-label">FLOW PATH</span><span className="meta-value">Intake · compressor · hot section · exhaust</span></div>
          </div>
        </>
      ) : (
        <>
          <section className="part-copy">
            <div className="eyebrow"><span className="eyebrow-mark" /> ENGINE COMPONENT <span className="part-number">{part.number}</span></div>
            <h1>{part.name}</h1>
            <p className="part-description">{part.description}</p>
            <div className="part-specs">
              <div className="part-spec"><span className="meta-label">MATERIAL</span><span className="meta-value">{part.material}</span></div>
              <div className="part-spec"><span className="meta-label">FINISH</span><span className="meta-value">{part.finish}</span></div>
              <div className="part-spec"><span className="meta-label">DIMENSIONS</span><span className="meta-value">{part.dimensions}</span></div>
              <div className="part-spec"><span className="meta-label">DISCIPLINE</span><span className="meta-value">{part.category.split(' / ')[0]}</span></div>
            </div>
          </section>
          <div className="part-index"><span>{part.number}</span> / {String(modelParts.length).padStart(2, '0')} COMPONENTS</div>
        </>
      )}
    </header>
  )
}
