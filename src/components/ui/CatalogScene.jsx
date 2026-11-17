import { Fragment, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Rotate3D } from 'lucide-react'
import CanvasContainer from '../3d/CanvasContainer.jsx'
import CatalogModelViewer, { initialCameraPosition } from '../3d/CatalogModelViewer.jsx'
import LightingEnvironment from '../3d/LightingEnvironment.jsx'
import { catalogPath, getAncestors, getCatalogItem } from '../../data/catalogModels.js'

const MODE_LABELS = { opaque: 'Opaque', transparent: 'Transparent' }
// Chosen display mode per model, kept while moving between its parts
// (each route change remounts this page).
const displayModeByModel = new Map()

// Page for a catalog model, section or part:
// breadcrumb bar on top, the 3D view with an info panel beside it,
// and thumbnail cards for the current level underneath.
export default function CatalogScene() {
  const { modelId, nodeId } = useParams()
  const navigate = useNavigate()
  const item = getCatalogItem(modelId, nodeId)
  // Download progress of the model's GLB (null when it is already cached).
  const [progress, setProgress] = useState(null)
  // Models that list `displayModes` get Opaque / Transparent buttons.
  const modes = item?.displayModes ?? item?.model.displayModes ?? []
  const [displayMode, setDisplayMode] = useState(() => displayModeByModel.get(modelId) ?? modes[0])
  const chooseMode = (mode) => {
    displayModeByModel.set(modelId, mode)
    setDisplayMode(mode)
  }

  if (!item) {
    return (
      <main className="not-found">
        <span className="eyebrow">MODELS / NOT FOUND</span>
        <h1>Nothing to see here.</h1>
        <button className="text-button" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to the 3D viewer
        </button>
      </main>
    )
  }

  // Cards show this item's parts; for a single part, its siblings.
  const cards = item.children?.length ? item.children : item.parent?.children ?? []

  return (
    <main className="catalog-page">
      <header className="catalog-topbar">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {getAncestors(item).map((crumb, index) => (
            <Fragment key={crumb.node}>
              {index > 0 && <ChevronRight size={12} />}
              <Link
                className={`breadcrumb-link ${crumb === item ? 'breadcrumb-current' : ''}`}
                to={catalogPath(crumb)}
                aria-current={crumb === item ? 'page' : undefined}
              >
                {crumb.name.toUpperCase()}
              </Link>
            </Fragment>
          ))}
        </nav>
        <button type="button" className="catalog-reset" onClick={() => navigate(catalogPath(item.model))}>
          Show full model
        </button>
      </header>

      <div className="catalog-stage">
        <section className="catalog-viewer">
          <CanvasContainer
            cameraPosition={initialCameraPosition()}
            cameraNear={0.01}
            cameraFar={100000}
            minDistance={0.001}
            maxDistance={100000}
          >
            <LightingEnvironment />
            <CatalogModelViewer
              item={item}
              onSelect={(child) => navigate(catalogPath(child))}
              onProgress={(event) => event.total && setProgress(Math.round((event.loaded / event.total) * 100))}
              displayMode={displayMode}
            />
          </CanvasContainer>
          {modes.length > 1 && (
            <div className="catalog-modes" role="group" aria-label="Display mode">
              {modes.map((mode) => (
                <button key={mode} type="button" aria-pressed={displayMode === mode} onClick={() => chooseMode(mode)}>
                  {MODE_LABELS[mode] ?? mode}
                </button>
              ))}
            </div>
          )}
          {progress !== null && progress < 100 && (
            <div className="catalog-loader" role="status">
              <span>Loading {item.model.name} {progress}%</span>
              <div className="catalog-loader-bar"><i style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          <div className="catalog-hint">
            <Rotate3D size={14} strokeWidth={1.6} /> DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM <span>·</span> RIGHT-DRAG TO PAN
          </div>
        </section>

        <aside className="catalog-info">
          <div className="catalog-info-id">{item.parent ? `HOTSPOT ${item.id}` : 'MAIN MODEL'}</div>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          {item.video && (
            <a className="catalog-video" href={item.video} target="_blank" rel="noreferrer">▶ Watch video</a>
          )}
        </aside>
      </div>

      {cards.length > 0 && (
        <nav className="catalog-strip" aria-label="Parts">
          {cards.map((card) => (
            <Link
              key={card.node}
              className={`catalog-card ${card === item ? 'catalog-card-active' : ''}`}
              to={catalogPath(card)}
              aria-current={card === item ? 'page' : undefined}
            >
              <img src={card.thumb} alt="" loading="lazy" />
              <span><small>{card.id}</small>{card.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </main>
  )
}
