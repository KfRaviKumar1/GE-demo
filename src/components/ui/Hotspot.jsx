import { Html } from '@react-three/drei'
import { ArrowRight } from 'lucide-react'

export default function Hotspot({ part, active, onClick }) {
  return (
    <Html position={part.coordinates} center zIndexRange={[20, 0]}>
      <button
        className={`hotspot ${active ? 'hotspot-active' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          onClick(part)
        }}
        aria-label={`Explore ${part.name}`}
      >
        <span className="hotspot-pulse" />
        <span className="hotspot-number">{part.number}</span>
        <span className="hotspot-label">{part.name}</span>
        <ArrowRight className="hotspot-arrow" size={14} />
      </button>
    </Html>
  )
}
