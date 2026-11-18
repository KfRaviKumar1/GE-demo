import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Play, Rotate3D } from 'lucide-react'
import CanvasContainer from '../3d/CanvasContainer.jsx'
import CatalogModelViewer, { initialCameraPosition } from '../3d/CatalogModelViewer.jsx'
import LightingEnvironment from '../3d/LightingEnvironment.jsx'
import VideoPlayer from './VideoPlayer.jsx'
import { catalogPath, getAncestors, getCatalogItem } from '../../data/catalogModels.js'

const MODE_LABELS = { opaque: 'Opaque', transparent: 'Transparent' }

// Page for a catalog model, section or part:
// breadcrumb bar on top, the 3D view with an info panel beside it,
// and thumbnail cards for the current level underneath.
export default function CatalogScene() {
  const { modelId, nodeId } = useParams()
  const navigate = useNavigate()
  const item = getCatalogItem(modelId, nodeId)
  // Download progress of the model's GLB (null when it is already cached).
  const [progress, setProgress] = useState(null)
  // Models that list `displayModes` get Opaque / Transparent tools: pick one,
  // then click parts of the model to apply it to just those parts.
  // State is per component page: opening another model, section or part
  // remounts this page, so it always starts with no tool and nothing see-through.
  const modes = item?.displayModes ?? item?.model.displayModes ?? []
  const [tool, setTool] = useState(null)
  const [seeThroughParts, setSeeThroughParts] = useState(() => new Set())
  const resetParts = () => setSeeThroughParts(new Set())
  // Explode slider (0 compact .. 100 fully exploded): only on the full-model
  // page of models with an `explode` clip; sections and parts stay compact.
  const hasExplode = Boolean(item && !item.parent && item.model.explode)
  const [explode, setExplode] = useState(0)
  // Hotspot video, played over the 3D view (closed again with the × button).
  // Opening a part with a video from its hotspot, card or sidebar row starts
  // the video straight away (`playVideo` in the navigation state).
  const location = useLocation()
  const [videoOpen, setVideoOpen] = useState(() => Boolean(location.state?.playVideo && item?.video))
  const closeVideo = useCallback(() => setVideoOpen(false), [])
  // Use the play request once, so Back/Forward to this page doesn't replay it.
  useEffect(() => {
    if (location.state?.playVideo) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])
  const pickTool = (mode) => {
    if (tool === mode) {
      // Clicking the active tool again turns it off and resets the model.
      setTool(null)
      resetParts()
      return
    }
    setTool(mode)
  }
  const setSeeThrough = (node, seeThrough) => {
    if (seeThroughParts.has(node) === seeThrough) return
    const next = new Set(seeThroughParts)
    if (seeThrough) next.add(node)
    else next.delete(node)
    setSeeThroughParts(next)
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
            cameraPosition={initialCameraPosition(item.model)}
            cameraNear={0.01}
            cameraFar={100000}
            minDistance={0.001}
            maxDistance={100000}
          >
            <LightingEnvironment />
            <CatalogModelViewer
              item={item}
              onSelect={(child) => navigate(catalogPath(child), { state: { playVideo: Boolean(child.video) } })}
              onProgress={(event) => event.total && setProgress(Math.round((event.loaded / event.total) * 100))}
              tool={modes.length ? tool : null}
              seeThroughParts={seeThroughParts}
              onSetSeeThrough={modes.length ? setSeeThrough : undefined}
              explode={hasExplode ? explode / 100 : 0}
            />
          </CanvasContainer>
          {hasExplode && (
            <label className="catalog-explode">
              <span>Explode</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={explode}
                onChange={(event) => setExplode(Number(event.target.value))}
                aria-label="Explode the model"
              />
              <output>{explode}</output>
            </label>
          )}
          {modes.length > 0 && (
            <div className="catalog-modes" role="group" aria-label="Display mode">
              {modes.map((mode) => (
                <button key={mode} type="button" aria-pressed={tool === mode} onClick={() => pickTool(mode)}>
                  {MODE_LABELS[mode] ?? mode}
                </button>
              ))}
              {seeThroughParts.size > 0 && (
                <button type="button" className="catalog-modes-reset" onClick={resetParts}>
                  Reset
                </button>
              )}
              {tool && (
                <span className="catalog-modes-hint">
                  Click a part to make it {tool === 'transparent' ? 'see-through' : 'solid'}
                </span>
              )}
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
          {videoOpen && item.video && <VideoPlayer item={item} onClose={closeVideo} />}
        </section>

        <aside className="catalog-info">
          <div className="catalog-info-id">{item.parent ? `HOTSPOT ${item.id}` : 'MAIN MODEL'}</div>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          {item.video && (
            <button type="button" className="catalog-video" onClick={() => setVideoOpen(true)} aria-pressed={videoOpen}>
              <Play size={14} fill="currentColor" /> Play video
            </button>
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
              state={{ playVideo: Boolean(card.video) }}
              aria-current={card === item ? 'page' : undefined}
            >
              <img src={card.thumb} alt="" loading="lazy" />
              {card.video && <i className="catalog-card-video"><Play size={10} fill="currentColor" /> Video</i>}
              <span><small>{card.id}</small>{card.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </main>
  )
}
