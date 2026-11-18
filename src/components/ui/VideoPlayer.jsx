import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'

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
      const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' })
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

// Video for a hotspot, shown over the 3D view. Closes with the × button,
// the Esc key or a click outside the player.
export default function VideoPlayer({ item, onClose }) {
  const closeButton = useRef(null)
  const source = videoSource(item.video)

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="video-overlay" onClick={onClose}>
      <section
        className="video-card"
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
            <button ref={closeButton} type="button" className="video-card-close" onClick={onClose} aria-label="Close video">
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="video-frame">
          {source.kind === 'embed' ? (
            <iframe
              src={source.src}
              title={`Video: ${item.name}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video src={source.src} controls autoPlay playsInline />
          )}
        </div>
      </section>
    </div>
  )
}
