import { Fragment } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Box, ChevronRight, Rotate3D } from 'lucide-react'
import CanvasContainer from '../3d/CanvasContainer.jsx'
import CatalogModelViewer, { initialCameraPosition } from '../3d/CatalogModelViewer.jsx'
import LightingEnvironment from '../3d/LightingEnvironment.jsx'
import { catalogPath, getAncestors, getCatalogItem } from '../../data/catalogModels.js'

const eyebrowFor = (item) => {
  if (!item.parent) return 'AVIATION MODEL'
  return item.children?.length ? `SECTION ${item.id}` : `COMPONENT ${item.id}`
}

// Detail page for a catalog model, section or part, using the same overlay
// layout as the component detail pages (copy left, model right, index on the side).
export default function CatalogScene() {
  const { modelId, nodeId } = useParams()
  const navigate = useNavigate()
  const item = getCatalogItem(modelId, nodeId)

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

  const path = getAncestors(item)
  // The side index lists this item's parts; for a single part, its siblings.
  const indexItems = item.children?.length ? item.children : item.parent?.children ?? []
  const indexHeading = item.children?.length
    ? (item.parent ? 'COMPONENTS' : 'SECTIONS')
    : 'COMPONENTS'

  return (
    <main className="scene-page catalog-scene">
      <CanvasContainer
        cameraPosition={initialCameraPosition()}
        canvasClassName="part-canvas"
        cameraNear={0.01}
        cameraFar={100000}
        minDistance={0.001}
        maxDistance={100000}
      >
        <LightingEnvironment />
        <CatalogModelViewer item={item} onSelect={(child) => navigate(catalogPath(child))} />
      </CanvasContainer>

      <header className="navigation-overlay">
        <div className="breadcrumb">
          <span className="breadcrumb-link">MODELS</span>
          {path.map((crumb) => (
            <Fragment key={crumb.node}>
              <ChevronRight size={12} />
              <Link
                className={`breadcrumb-link ${crumb === item ? 'breadcrumb-current' : ''}`}
                to={catalogPath(crumb)}
                aria-current={crumb === item ? 'page' : undefined}
              >
                {crumb.name.toUpperCase()}
              </Link>
            </Fragment>
          ))}
        </div>

        <div className="nav-actions">
          {item.parent && (
            <button className="back-button" onClick={() => navigate(catalogPath(item.parent))}>
              <ArrowLeft size={15} strokeWidth={1.7} />
              <span>BACK TO {item.parent.name.toUpperCase()}</span>
            </button>
          )}
          <span className="icon-button" aria-hidden="true">
            <Box size={17} strokeWidth={1.6} />
          </span>
        </div>

        <section className="part-copy">
          <div className="eyebrow"><span className="eyebrow-mark" /> {eyebrowFor(item)}</div>
          <h1>{item.name}</h1>
          <p className="part-description">{item.description}</p>
          <img className="catalog-thumb" src={item.thumb} alt="" onError={(event) => { event.currentTarget.hidden = true }} />
          {item.video && (
            <a className="catalog-video" href={item.video} target="_blank" rel="noreferrer">
              WATCH VIDEO <ArrowRight size={13} />
            </a>
          )}
        </section>

        {indexItems.length > 0 && (
          <aside className="object-index">
            <div className="object-index-heading"><span>{indexHeading}</span><span>{String(indexItems.length).padStart(2, '0')}</span></div>
            {indexItems.map((entry) => (
              <Link
                className={`index-row ${entry === item ? 'index-row-current' : ''}`}
                key={entry.node}
                to={catalogPath(entry)}
                aria-current={entry === item ? 'page' : undefined}
              >
                <span className="index-row-number">{entry.id}</span>
                <span className="index-row-name">{entry.name}</span>
                <ArrowRight size={13} />
              </Link>
            ))}
          </aside>
        )}
      </header>

      <div className="scene-hint">
        <Rotate3D size={15} strokeWidth={1.6} /> DRAG TO ROTATE <span>·</span>
        {item.children?.length ? ' SELECT A MARKER TO DISCOVER' : ' SCROLL TO ZOOM'}
      </div>
    </main>
  )
}
