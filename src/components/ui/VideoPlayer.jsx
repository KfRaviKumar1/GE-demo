import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react'

// Turns a video link from the model data into something playable in the page:
// YouTube and Vimeo links become embeds, anything else is played as a file.
function videoSource(url) {
  try {
    const link = new URL(url)
    const host = link.hostname.replace(/^www\./, '').replace(/^m\./, '')
    let youtubeId = null
    if (host === 'youtu.be') youtubeId = link.pathname.slice(1)
    else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      youtubeId = link.searchParams.get('v') ?? link.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]
    }
    if (youtubeId) {
      const start = link.searchParams.get('t') ?? link.searchParams.get('start')
      // fs=0: the player's own fullscreen is off; the card's fullscreen button is
      // used instead, so the header and close button stay visible.
      const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', fs: '0' })
      if (start) params.set('start', String(parseInt(start, 10) || 0))
      return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`, label: 'Open on YouTube' }
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = link.pathname.match(/(\d+)/)?.[1]
      if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}?autoplay=1`, label: 'Open on Vimeo' }
    }
  } catch {
    // not an absolute URL: treat as a file path below
  }
  return { kind: 'file', src: url, label: 'Open video' }
}

// Video for a hotspot, shown over the page. Closes with the × button, the Esc
// key or a click outside the player. Fullscreen uses the whole card (header
// included), so the × button stays available in fullscreen too.
export default function VideoPlayer({ item, onClose }) {
  const card = useRef(null)
  const closeButton = useRef(null)
  const source = videoSource(item.video)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => {
      // In fullscreen, Esc is left to the browser (it exits fullscreen first).
      if (event.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === card.current)
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      if (document.fullscreenElement === card.current) document.exitFullscreen?.()
    }
  }, [onClose])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else card.current?.requestFullscreen?.()
  }
  const close = async () => {
    if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {})
    onClose()
  }

  return (
    <div className="video-overlay" onClick={close}>
      <section
        ref={card}
        className={`video-card ${fullscreen ? 'video-card-fullscreen' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Video: ${item.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="video-card-header">
          <div>
            <div className="video-card-eyebrow">VIDEO{item.id ? ` · HOTSPOT ${item.id}` : ''}</div>
            <h3>{item.name}</h3>
          </div>
          <div className="video-card-actions">
            <a className="video-card-link" href={item.video} target="_blank" rel="noreferrer">
              {source.label} <ExternalLink size={13} />
            </a>
            {document.fullscreenEnabled && (
              <button
                type="button"
                className="video-card-close"
                onClick={toggleFullscreen}
                aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            <button ref={closeButton} type="button" className="video-card-close" onClick={close} aria-label="Close video" title="Close video">
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="video-frame">
          {source.kind === 'embed' ? (
            <iframe
              src={source.src}
              title={`Video: ${item.name}`}
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          ) : (
            <video src={source.src} controls controlsList="nofullscreen" disablePictureInPicture autoPlay playsInline />
          )}
        </div>
      </section>
    </div>
  )
}
