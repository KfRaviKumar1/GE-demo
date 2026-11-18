import { useEffect, useState } from 'react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { Box, ChevronDown, ChevronRight, CircleDot, CirclePlay, Cylinder, Fan, Plane, Wind } from 'lucide-react'
import { catalogModels, catalogPath, getCatalogItem } from '../../data/catalogModels.js'

// Icon names a model or section can pick with `icon: '<name>'` in its data file.
const ICONS = { aircraft: Plane, engine: Box, fan: Fan, core: Cylinder, exhaust: Wind, part: CircleDot }
const iconFor = (item) => ICONS[item.icon] ?? (item.parent ? CircleDot : Plane)
const keyOf = (item) => `${item.model.id}/${item.node}`

const isAncestor = (item, of) => {
  for (let current = of?.parent; current; current = current.parent) if (current === item) return true
  return false
}

// Parts with a video get a video icon; a folded group shows a muted one when
// something inside it has a video, so it can be found without opening everything.
const containsVideo = (item) => Boolean(item.video) || Boolean(item.children?.some(containsVideo))
const VideoMark = ({ muted }) => (
  <CirclePlay
    size={13}
    className={`catalog-video-mark ${muted ? 'catalog-video-mark-muted' : ''}`}
    aria-label={muted ? 'Contains a video' : 'Has a video'}
  >
    <title>{muted ? 'Contains a video' : 'Has a video'}</title>
  </CirclePlay>
)

// MODELS section of the sidebar: model → sections → parts, built from the catalog data.
// A name selects the item (or folds/unfolds it when it is already selected);
// the chevron only folds/unfolds. The open model starts with its sections shown
// and their parts folded; selecting anything opens the groups leading to it.
export default function CatalogSidebarTree({ collapsed, onExpand }) {
  const navigate = useNavigate()
  const match = useMatch('/explore/:modelId/:nodeId?')
  const current = match ? getCatalogItem(match.params.modelId, match.params.nodeId) : null
  const [openState, setOpenState] = useState({})

  useEffect(() => {
    if (!current) return
    setOpenState((state) => {
      const next = { ...state }
      if (current.children?.length) next[keyOf(current)] = true
      for (let parent = current.parent; parent; parent = parent.parent) next[keyOf(parent)] = true
      return next
    })
  }, [current])

  const isOpen = (item) =>
    openState[keyOf(item)] ?? (!item.parent && item.model === (current?.model ?? catalogModels[0]))
  const toggle = (item) => setOpenState((state) => ({ ...state, [keyOf(item)]: !isOpen(item) }))

  const select = (item) => {
    if (item === current) toggle(item)
    else navigate(catalogPath(item), { state: { playVideo: Boolean(item.video) } })
  }

  const chevron = (item) => (
    <span
      className="catalog-toggle"
      role="button"
      aria-label={`${isOpen(item) ? 'Collapse' : 'Expand'} ${item.name}`}
      onClick={(event) => { event.stopPropagation(); toggle(item) }}
    >
      {isOpen(item) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
    </span>
  )

  const renderPart = (part) => (
    <NavLink
      key={part.node}
      to={catalogPath(part)}
      state={{ playVideo: Boolean(part.video) }}
      end
      className={`sidebar-sublink catalog-part ${part === current ? 'sidebar-sublink-active' : ''}`}
    >
      <span>{part.name}</span>
      {part.video && <VideoMark />}
      <span className="catalog-num">{part.id}</span>
    </NavLink>
  )

  const renderSection = (section) => {
    if (!section.children?.length) return renderPart(section)
    const Icon = iconFor(section)
    const state = section === current ? 'sidebar-sublink-active' : isAncestor(section, current) ? 'catalog-within' : ''
    return (
      <div className="catalog-group" key={section.node}>
        <button type="button" className={`sidebar-sublink catalog-section ${state}`} onClick={() => select(section)}>
          <Icon size={14} className="catalog-icon" />
          <span>{section.name}</span>
          {!isOpen(section) && containsVideo(section) && <VideoMark muted />}
          {chevron(section)}
        </button>
        {isOpen(section) && (
          <div className="sidebar-submenu catalog-submenu-nested">{section.children.map(renderSection)}</div>
        )}
      </div>
    )
  }

  return (
    <>
      {!collapsed && <div className="sidebar-section-label">MODELS</div>}
      {catalogModels.map((model) => {
        const Icon = iconFor(model)
        const active = current?.model === model
        return (
          <section className="sidebar-group" key={model.id}>
            <button
              type="button"
              className={`sidebar-link sidebar-group-toggle ${active ? 'sidebar-link-active' : ''}`}
              onClick={() => {
                if (collapsed) { onExpand(); navigate(catalogPath(model)); return }
                select(model)
              }}
              aria-expanded={collapsed ? undefined : isOpen(model)}
              title={collapsed ? model.name : undefined}
            >
              <Icon size={16} />
              {!collapsed && <><span>{model.name}</span>{!isOpen(model) && containsVideo(model) && <VideoMark muted />}{chevron(model)}</>}
            </button>
            {!collapsed && isOpen(model) && (
              <div className="sidebar-submenu">{model.children.map(renderSection)}</div>
            )}
          </section>
        )
      })}
    </>
  )
}
