import { useRef, useState, useEffect, useMemo } from 'react'
import { ConstellationCanvas } from './ConstellationCanvas'
import { BezierConnection } from './BezierConnection'
import { useMousePosition, useReducedMotion, useResponsiveConfig } from './useMousePosition'
import { calculateMagneticOffset } from './useParallax'
import {
  useConstellationAnimation,
  initializeConstellation,
  calculateGlowIntensity,
} from './useConstellationAnimation'
import type { Node, EnhancedConstellationConfig, Point } from './constellation.types'
import {
  ENHANCED_DEFAULT_CONFIG,
  ENHANCED_RESPONSIVE_CONFIGS,
  RESPONSIVE_CONFIGS,
  INTERACTION,
  COLORS,
  MAGNETIC_CONFIG,
  PARALLAX_CONFIG,
} from './constellation.types'

interface DelegationConstellationProps {
  className?: string
}

export function DelegationConstellation({ className = '' }: DelegationConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isVisible, setIsVisible] = useState(true)

  const reducedMotion = useReducedMotion()
  const breakpoint = useResponsiveConfig()
  const mouseState = useMousePosition(containerRef)

  // Merge responsive config (base + enhanced)
  const config: EnhancedConstellationConfig = useMemo(() => ({
    ...ENHANCED_DEFAULT_CONFIG,
    ...RESPONSIVE_CONFIGS[breakpoint],
    ...ENHANCED_RESPONSIVE_CONFIGS[breakpoint],
  }), [breakpoint])

  // Track container dimensions
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  // Track visibility for performance
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0]?.isIntersecting ?? false)
      },
      { threshold: 0.1 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Pause on window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Initialize constellation with current dimensions
  const { centerNode, satelliteNodes, connections } = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) {
      return { centerNode: null, satelliteNodes: [], connections: [] }
    }

    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    }

    return initializeConstellation(config, center)
  }, [config, dimensions])

  // Run animation
  const { parallaxOffset } = useConstellationAnimation({
    canvasRef,
    centerNode: centerNode!,
    satelliteNodes,
    connections,
    config,
    mouseState,
    isVisible: isVisible && !reducedMotion,
    reducedMotion,
    dimensions,
  })

  // Reduced motion fallback
  if (reducedMotion) {
    return (
      <div
        ref={containerRef}
        className={`${className}`}
        role="img"
        aria-label="DeFi delegation visualization showing Safe multisig connected to sub-accounts"
      >
        <StaticConstellation config={config} dimensions={dimensions} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden constellation-container ${className}`}
      role="img"
      aria-label="Interactive DeFi delegation visualization"
    >
      {/* Canvas layer for stars, waves, and particles */}
      <ConstellationCanvas ref={canvasRef} className="z-0 constellation-canvas" />

      {/* SVG layer for bezier connections */}
      {dimensions.width > 0 && centerNode && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.lime} stopOpacity="0.7" />
              <stop offset="50%" stopColor={COLORS.cyan} stopOpacity="0.5" />
              <stop offset="100%" stopColor={COLORS.lime} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {connections.map((connection) => (
            <BezierConnection
              key={connection.id}
              connection={connection}
              mousePos={mouseState.position}
              parallaxOffset={parallaxOffset}
              enableMagnetic={config.enableMagneticField}
            />
          ))}
        </svg>
      )}

      {/* DOM layer for nodes with magnetic effect */}
      {centerNode && (
        <CentralNode
          node={centerNode}
          glowIntensity={calculateGlowIntensity(
            centerNode,
            mouseState.position,
            INTERACTION.GLOW_INTENSITY_RADIUS
          )}
          parallaxOffset={parallaxOffset}
          mousePos={mouseState.position}
          enableMagnetic={config.enableMagneticField}
        />
      )}
      {satelliteNodes.map((node, index) => (
        <SatelliteNode
          key={node.id}
          node={node}
          index={index}
          glowIntensity={calculateGlowIntensity(
            node,
            mouseState.position,
            INTERACTION.NODE_HIGHLIGHT_RADIUS
          )}
          parallaxOffset={parallaxOffset}
          mousePos={mouseState.position}
          enableMagnetic={config.enableMagneticField}
          enableBloom={config.enableNodeBloom}
        />
      ))}
    </div>
  )
}

// Central node (Safe) component with magnetic effect
interface CentralNodeProps {
  node: Node
  glowIntensity: number
  parallaxOffset: Point
  mousePos: Point | null
  enableMagnetic?: boolean
}

function CentralNode({ node, glowIntensity, parallaxOffset, mousePos, enableMagnetic = true }: CentralNodeProps) {
  // Calculate magnetic offset
  const magneticOffset = useMemo(() => {
    if (!enableMagnetic) return { x: 0, y: 0 }
    return calculateMagneticOffset(
      node,
      mousePos,
      MAGNETIC_CONFIG.nodeAttractionRadius,
      MAGNETIC_CONFIG.nodeAttractionStrength * 0.5 // Center node moves less
    )
  }, [node, mousePos, enableMagnetic])

  // Apply parallax + magnetic offset
  const finalX = node.x + parallaxOffset.x * PARALLAX_CONFIG.mid + magneticOffset.x
  const finalY = node.y + parallaxOffset.y * PARALLAX_CONFIG.mid + magneticOffset.y

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-[2] transition-transform duration-100"
      style={{
        left: finalX,
        top: finalY,
        width: node.size,
        height: node.size,
      }}
    >
      {/* Outer glow - pulsing */}
      <div
        className="absolute inset-0 rounded-full animate-pulse-slow"
        style={{
          background: `radial-gradient(circle, rgba(${COLORS.limeRgb}, ${0.2 + glowIntensity * 0.2}) 0%, transparent 70%)`,
          transform: `scale(${2.8 + glowIntensity * 0.6})`,
        }}
      />

      {/* Second glow layer */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${COLORS.limeRgb}, ${0.15 + glowIntensity * 0.15}) 30%, transparent 70%)`,
          transform: 'scale(2)',
        }}
      />

      {/* Core with gradient */}
      <div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-[#12FF80] to-[#00D4FF] transition-all duration-200"
        style={{
          boxShadow: `
            0 0 ${25 + glowIntensity * 40}px rgba(${COLORS.limeRgb}, ${0.5 + glowIntensity * 0.4}),
            0 0 ${50 + glowIntensity * 60}px rgba(${COLORS.limeRgb}, ${0.2 + glowIntensity * 0.2}),
            inset 0 0 20px rgba(255, 255, 255, 0.3)
          `,
        }}
      />

      {/* Inner highlight */}
      <div
        className="absolute inset-4 rounded-full bg-gradient-to-br from-white/40 to-transparent"
      />

      {/* Safe label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-black/80 font-bold text-sm tracking-tight transition-all duration-200"
          style={{
            textShadow: glowIntensity > 0.3 ? '0 0 10px rgba(255,255,255,0.5)' : undefined,
          }}
        >
          SAFE
        </span>
      </div>
    </div>
  )
}

// Satellite node (Sub-account) component with magnetic and bloom effects
interface SatelliteNodeProps {
  node: Node
  index: number
  glowIntensity: number
  parallaxOffset: Point
  mousePos: Point | null
  enableMagnetic?: boolean
  enableBloom?: boolean
}

function SatelliteNode({
  node,
  index,
  glowIntensity,
  parallaxOffset,
  mousePos,
  enableMagnetic = true,
  enableBloom = true,
}: SatelliteNodeProps) {
  const isHighlighted = glowIntensity > 0.3
  const isBloom = enableBloom && glowIntensity > 0.5

  // Calculate magnetic offset
  const magneticOffset = useMemo(() => {
    if (!enableMagnetic) return { x: 0, y: 0 }
    return calculateMagneticOffset(
      node,
      mousePos,
      MAGNETIC_CONFIG.nodeAttractionRadius,
      MAGNETIC_CONFIG.nodeAttractionStrength
    )
  }, [node, mousePos, enableMagnetic])

  // Apply parallax + magnetic offset
  const finalX = node.x + parallaxOffset.x * PARALLAX_CONFIG.mid + magneticOffset.x
  const finalY = node.y + parallaxOffset.y * PARALLAX_CONFIG.mid + magneticOffset.y

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-[2] transition-all duration-150"
      style={{
        left: finalX,
        top: finalY,
        width: node.size,
        height: node.size,
        transform: `translate(-50%, -50%) scale(${isBloom ? 1.25 : isHighlighted ? 1.1 : 1})`,
        animationDelay: `${(node.floatOffset || 0) * 1000}ms`,
      }}
    >
      {/* Bloom rings (appear on close hover) */}
      {isBloom && (
        <>
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: `radial-gradient(circle, rgba(${COLORS.cyanRgb}, 0.3) 0%, transparent 70%)`,
              transform: 'scale(2.5)',
              animationDuration: '1.5s',
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(${COLORS.cyanRgb}, 0.2) 0%, transparent 70%)`,
              transform: 'scale(2)',
            }}
          />
        </>
      )}

      {/* Standard glow ring */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-200"
        style={{
          background: `radial-gradient(circle, rgba(${COLORS.cyanRgb}, ${0.25 + glowIntensity * 0.35}) 0%, transparent 70%)`,
          transform: `scale(${1.6 + glowIntensity * 0.4})`,
          opacity: 0.6 + glowIntensity * 0.4,
        }}
      />

      {/* Core background */}
      <div
        className="absolute inset-1 rounded-full transition-all duration-200"
        style={{
          background: isHighlighted
            ? `linear-gradient(135deg, rgba(${COLORS.cyanRgb}, 0.4), rgba(${COLORS.limeRgb}, 0.25))`
            : 'var(--bg-elevated-2)',
          border: `1px solid rgba(${COLORS.cyanRgb}, ${0.35 + glowIntensity * 0.45})`,
          boxShadow: isHighlighted
            ? `0 0 25px rgba(${COLORS.cyanRgb}, 0.6), inset 0 0 10px rgba(${COLORS.cyanRgb}, 0.2)`
            : `0 0 12px rgba(${COLORS.cyanRgb}, 0.25)`,
        }}
      />

      {/* Index label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-xs font-semibold transition-all duration-200"
          style={{
            color: isHighlighted ? COLORS.cyan : `rgba(${COLORS.cyanRgb}, 0.8)`,
            textShadow: isHighlighted ? `0 0 8px ${COLORS.cyan}` : undefined,
          }}
        >
          {index + 1}
        </span>
      </div>

      {/* Bloom label (shows on very close hover) */}
      {isBloom && (
        <div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-fade-in"
          style={{
            fontSize: '10px',
            color: COLORS.cyan,
            textShadow: `0 0 10px ${COLORS.cyan}`,
          }}
        >
          Sub-Account #{index + 1}
        </div>
      )}
    </div>
  )
}

// Static fallback for reduced motion
interface StaticConstellationProps {
  config: EnhancedConstellationConfig
  dimensions: { width: number; height: number }
}

function StaticConstellation({ config, dimensions }: StaticConstellationProps) {
  if (dimensions.width === 0) return null

  const center = { x: dimensions.width / 2, y: dimensions.height / 2 }
  const { centerNode, satelliteNodes, connections } = initializeConstellation(config, center)

  return (
    <div className="absolute inset-0">
      {/* Static connections */}
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        <defs>
          <linearGradient id="staticGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.lime} stopOpacity="0.4" />
            <stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {connections.map((conn) => (
          <line
            key={conn.id}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke="url(#staticGradient)"
            strokeWidth={2}
            strokeDasharray="8 4"
          />
        ))}
      </svg>

      {/* Static center node */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: centerNode.x, top: centerNode.y, width: centerNode.size, height: centerNode.size }}
      >
        <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, rgba(${COLORS.limeRgb}, 0.2) 0%, transparent 70%)`, transform: 'scale(2)' }} />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#12FF80] to-[#00D4FF]" style={{ boxShadow: `0 0 20px rgba(${COLORS.limeRgb}, 0.4)` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-black/80 font-bold text-sm">SAFE</span>
        </div>
      </div>

      {/* Static satellite nodes */}
      {satelliteNodes.map((node, i) => (
        <div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: node.x, top: node.y, width: node.size, height: node.size }}
        >
          <div className="absolute inset-1 rounded-full bg-elevated-2" style={{ border: `1px solid rgba(${COLORS.cyanRgb}, 0.3)` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs" style={{ color: `rgba(${COLORS.cyanRgb}, 0.7)` }}>{i + 1}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DelegationConstellation
