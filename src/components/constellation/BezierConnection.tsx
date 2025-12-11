import { memo, useRef } from 'react'
import type { Connection, Point } from './constellation.types'
import { MAGNETIC_CONFIG } from './constellation.types'

interface BezierConnectionProps {
  connection: Connection
  mousePos: Point | null
  parallaxOffset: Point
  enableMagnetic?: boolean
}

// Memoized component to prevent unnecessary re-renders
export const BezierConnection = memo(function BezierConnection({
  connection,
  mousePos,
  parallaxOffset,
  enableMagnetic = true,
}: BezierConnectionProps) {
  // Use refs for calculations that don't need re-render
  const lastPathRef = useRef<string>('')
  const lastHighlightRef = useRef<boolean>(false)

  // Calculate path directly without useMemo (refs handle caching)
  const { from, to } = connection

  // Apply parallax to from/to
  const parallaxedFrom = {
    x: from.x + parallaxOffset.x * 0.08,
    y: from.y + parallaxOffset.y * 0.08,
  }
  const parallaxedTo = {
    x: to.x + parallaxOffset.x * 0.08,
    y: to.y + parallaxOffset.y * 0.08,
  }

  const dx = parallaxedTo.x - parallaxedFrom.x
  const dy = parallaxedTo.y - parallaxedFrom.y

  // Add natural curve (perpendicular offset)
  const perpX = -dy * 0.12
  const perpY = dx * 0.12

  let cp1x = parallaxedFrom.x + dx * 0.33 + perpX
  let cp1y = parallaxedFrom.y + dy * 0.33 + perpY
  let cp2x = parallaxedFrom.x + dx * 0.67 - perpX
  let cp2y = parallaxedFrom.y + dy * 0.67 - perpY

  // Apply magnetic field influence (simplified calculation)
  if (mousePos && enableMagnetic) {
    // Inline magnetic calculation for performance
    const calcMagneticOffset = (cpx: number, cpy: number): { x: number; y: number } => {
      const mdx = mousePos.x - cpx
      const mdy = mousePos.y - cpy
      const distance = Math.sqrt(mdx * mdx + mdy * mdy)

      if (distance > MAGNETIC_CONFIG.bezierInfluenceRadius) return { x: 0, y: 0 }

      const normalizedDistance = distance / MAGNETIC_CONFIG.bezierInfluenceRadius
      const influenceFactor = (1 - normalizedDistance) * (1 - normalizedDistance)
      const dirX = mdx / (distance || 1)
      const dirY = mdy / (distance || 1)

      return {
        x: dirX * MAGNETIC_CONFIG.bezierInfluenceStrength * influenceFactor,
        y: dirY * MAGNETIC_CONFIG.bezierInfluenceStrength * influenceFactor,
      }
    }

    const offset1 = calcMagneticOffset(cp1x, cp1y)
    const offset2 = calcMagneticOffset(cp2x, cp2y)

    cp1x += offset1.x
    cp1y += offset1.y
    cp2x += offset2.x
    cp2y += offset2.y
  }

  // Calculate if mouse is near for highlighting (simplified)
  let isHighlighted = false
  if (mousePos) {
    const midX = (parallaxedFrom.x + parallaxedTo.x) / 2
    const midY = (parallaxedFrom.y + parallaxedTo.y) / 2
    const distToMidSq = (mousePos.x - midX) ** 2 + (mousePos.y - midY) ** 2
    isHighlighted = distToMidSq < 10000 // 100^2
  }

  const path = `M ${parallaxedFrom.x.toFixed(1)} ${parallaxedFrom.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${parallaxedTo.x.toFixed(1)} ${parallaxedTo.y.toFixed(1)}`

  // Store for comparison
  lastPathRef.current = path
  lastHighlightRef.current = isHighlighted

  return (
    <g className="bezier-connection" style={{ willChange: 'transform' }}>
      {/* Glow layer (behind) - only render when highlighted for performance */}
      {isHighlighted && (
        <path
          d={path}
          fill="none"
          stroke="url(#connectionGradient)"
          strokeWidth={6}
          strokeOpacity={0.25}
          style={{ filter: 'blur(3px)' }}
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke="url(#connectionGradient)"
        strokeWidth={isHighlighted ? 2 : 1.5}
        strokeDasharray="8 6"
        className="connection-line"
        style={{
          willChange: 'stroke-width',
        }}
      />
    </g>
  )
})

export default BezierConnection
