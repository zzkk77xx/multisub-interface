import { useEffect, useRef, useCallback } from 'react'
import type {
  Node,
  Connection,
  EnhancedParticle,
  Star,
  EnergyWave,
  Point,
  EnhancedConstellationConfig,
  MouseState,
  BezierConnection,
} from './constellation.types'
import { INTERACTION, COLORS, PARALLAX_CONFIG, MAGNETIC_CONFIG } from './constellation.types'
import { calculateMagneticOffset, calculateBezierMagneticOffset } from './useParallax'

interface AnimationState {
  particles: EnhancedParticle[]
  stars: Star[]
  waves: EnergyWave[]
  parallaxOffset: Point
  time: number
  lastWaveTime: number
  waveCounter: number
}

interface UseConstellationAnimationProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  centerNode: Node
  satelliteNodes: Node[]
  connections: Connection[]
  config: EnhancedConstellationConfig
  mouseState: MouseState
  isVisible: boolean
  reducedMotion: boolean
  dimensions: { width: number; height: number }
}

export function useConstellationAnimation({
  canvasRef,
  centerNode,
  satelliteNodes,
  connections,
  config,
  mouseState,
  isVisible,
  reducedMotion,
  dimensions,
}: UseConstellationAnimationProps) {
  const stateRef = useRef<AnimationState>({
    particles: [],
    stars: [],
    waves: [],
    parallaxOffset: { x: 0, y: 0 },
    time: 0,
    lastWaveTime: 0,
    waveCounter: 0,
  })
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Initialize stars
  useEffect(() => {
    if (!config.enableParallax || dimensions.width === 0) return

    const stars: Star[] = []
    const starCount = config.starCount || 50

    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: 0.5 + Math.random() * 2,
        baseOpacity: 0.2 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.4,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        layer: Math.random() > 0.3 ? 'far' : 'mid',
      })
    }

    stateRef.current.stars = stars
  }, [config.starCount, config.enableParallax, dimensions.width, dimensions.height])

  // Initialize particles with trails
  useEffect(() => {
    if (connections.length === 0) return

    const particles: EnhancedParticle[] = []
    const particlesPerConnection = Math.ceil(config.particleCount / connections.length)

    connections.forEach((connection, connIndex) => {
      for (let i = 0; i < particlesPerConnection; i++) {
        particles.push({
          id: connIndex * particlesPerConnection + i,
          connectionId: connection.id,
          progress: Math.random(),
          speed: config.particleSpeed * (0.8 + Math.random() * 0.4),
          size: 2 + Math.random() * 2,
          opacity: 0.4 + Math.random() * 0.4,
          color: Math.random() > 0.5 ? 'lime' : 'cyan',
          trail: [],
          glowIntensity: 0.5 + Math.random() * 0.5,
        })
      }
    })

    stateRef.current.particles = particles
  }, [connections, config.particleCount, config.particleSpeed])

  // Get point on bezier curve
  const getPointOnBezier = useCallback((
    from: Point,
    to: Point,
    cp1: Point,
    cp2: Point,
    t: number
  ): Point => {
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt

    return {
      x: mt3 * from.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * to.x,
      y: mt3 * from.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * to.y,
    }
  }, [])

  // Calculate bezier control points with magnetic influence
  const calculateBezierControlPoints = useCallback((
    from: Point,
    to: Point,
    mousePos: Point | null
  ): { cp1: Point; cp2: Point } => {
    // Default control points (straight line = at 1/3 and 2/3)
    const dx = to.x - from.x
    const dy = to.y - from.y

    // Add some natural curve
    const perpX = -dy * 0.15
    const perpY = dx * 0.15

    let cp1: Point = {
      x: from.x + dx * 0.33 + perpX,
      y: from.y + dy * 0.33 + perpY,
    }

    let cp2: Point = {
      x: from.x + dx * 0.67 - perpX,
      y: from.y + dy * 0.67 - perpY,
    }

    // Apply magnetic field influence
    if (mousePos && config.enableMagneticField) {
      const offset1 = calculateBezierMagneticOffset(
        cp1,
        mousePos,
        MAGNETIC_CONFIG.bezierInfluenceRadius,
        MAGNETIC_CONFIG.bezierInfluenceStrength
      )
      const offset2 = calculateBezierMagneticOffset(
        cp2,
        mousePos,
        MAGNETIC_CONFIG.bezierInfluenceRadius,
        MAGNETIC_CONFIG.bezierInfluenceStrength
      )

      cp1 = { x: cp1.x + offset1.x, y: cp1.y + offset1.y }
      cp2 = { x: cp2.x + offset2.x, y: cp2.y + offset2.y }
    }

    return { cp1, cp2 }
  }, [config.enableMagneticField])

  // Lerp function
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

  // Update parallax offset
  const updateParallax = useCallback((deltaTime: number) => {
    if (!config.enableParallax || !mouseState.position || !mouseState.isInside) {
      // Smoothly return to center
      const state = stateRef.current
      const lerpFactor = Math.min(1, PARALLAX_CONFIG.lerpFactor * (deltaTime / 16))
      state.parallaxOffset.x = lerp(state.parallaxOffset.x, 0, lerpFactor)
      state.parallaxOffset.y = lerp(state.parallaxOffset.y, 0, lerpFactor)
      return
    }

    const state = stateRef.current
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    // Normalized mouse position (-1 to 1)
    const normalizedX = (mouseState.position.x - centerX) / centerX
    const normalizedY = (mouseState.position.y - centerY) / centerY

    // Target offset
    const targetX = normalizedX * dimensions.width * 0.04
    const targetY = normalizedY * dimensions.height * 0.04

    // Smooth interpolation
    const lerpFactor = Math.min(1, PARALLAX_CONFIG.lerpFactor * (deltaTime / 16))
    state.parallaxOffset.x = lerp(state.parallaxOffset.x, targetX, lerpFactor)
    state.parallaxOffset.y = lerp(state.parallaxOffset.y, targetY, lerpFactor)
  }, [config.enableParallax, mouseState, dimensions])

  // Main draw function
  const draw = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width, height } = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    ctx.clearRect(0, 0, width * dpr, height * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)

    const state = stateRef.current
    const connectionMap = new Map(connections.map(c => [c.id, c]))

    // Update parallax
    updateParallax(deltaTime)

    // ==================== LAYER 0: STARFIELD ====================
    if (config.enableParallax && state.stars.length > 0) {
      state.stars.forEach(star => {
        // Update twinkle
        star.twinklePhase += star.twinkleSpeed * (deltaTime / 1000)
        star.opacity = star.baseOpacity + Math.sin(star.twinklePhase) * 0.2

        // Apply parallax offset based on layer
        const parallaxMultiplier = star.layer === 'far' ? PARALLAX_CONFIG.far : PARALLAX_CONFIG.mid
        const offsetX = state.parallaxOffset.x * parallaxMultiplier
        const offsetY = state.parallaxOffset.y * parallaxMultiplier

        const x = star.x + offsetX
        const y = star.y + offsetY

        // Draw star
        ctx.beginPath()
        ctx.arc(x, y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        // Add subtle glow for larger stars
        if (star.size > 1.5) {
          ctx.beginPath()
          ctx.arc(x, y, star.size * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.2})`
          ctx.fill()
        }
      })
    }

    // ==================== LAYER 1: ENERGY WAVES ====================
    if (config.enableEnergyWaves && centerNode) {
      // Spawn new wave periodically
      if (state.time - state.lastWaveTime > config.waveInterval) {
        state.waves.push({
          id: state.waveCounter++,
          radius: 0,
          maxRadius: config.orbitRadius * 1.8,
          opacity: 0.4,
          startTime: state.time,
        })
        state.lastWaveTime = state.time
      }

      // Update and draw waves
      const centerX = centerNode.x + state.parallaxOffset.x * PARALLAX_CONFIG.mid
      const centerY = centerNode.y + state.parallaxOffset.y * PARALLAX_CONFIG.mid

      state.waves = state.waves.filter(wave => {
        const age = state.time - wave.startTime
        const duration = 2000 // 2 seconds for full expansion
        const progress = Math.min(1, age / duration)

        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        wave.radius = easedProgress * wave.maxRadius
        wave.opacity = 0.4 * (1 - easedProgress)

        if (wave.opacity < 0.01) return false

        // Draw wave ring
        const gradient = ctx.createRadialGradient(
          centerX, centerY, wave.radius * 0.8,
          centerX, centerY, wave.radius
        )
        gradient.addColorStop(0, `rgba(${COLORS.limeRgb}, 0)`)
        gradient.addColorStop(0.5, `rgba(${COLORS.limeRgb}, ${wave.opacity})`)
        gradient.addColorStop(1, `rgba(${COLORS.cyanRgb}, 0)`)

        ctx.beginPath()
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.stroke()

        return true
      })
    }

    // ==================== LAYER 2: PARTICLES WITH TRAILS ====================
    state.particles.forEach(particle => {
      const connection = connectionMap.get(particle.connectionId)
      if (!connection) return

      // Update particle progress
      let speed = particle.speed

      // Boost speed if mouse is near
      if (mouseState.position && config.enableInteraction) {
        const { cp1, cp2 } = calculateBezierControlPoints(connection.from, connection.to, null)
        const particlePos = getPointOnBezier(connection.from, connection.to, cp1, cp2, particle.progress)
        const dx = particlePos.x - mouseState.position.x
        const dy = particlePos.y - mouseState.position.y
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy)

        if (distanceToMouse < INTERACTION.PARTICLE_BOOST_RADIUS) {
          const boost = 1 + (1 - distanceToMouse / INTERACTION.PARTICLE_BOOST_RADIUS) * 2
          speed *= boost
        }
      }

      particle.progress += speed * (deltaTime / 16)

      // Reset particle when it reaches the end
      if (particle.progress >= 1) {
        particle.progress = 0
        particle.opacity = 0.4 + Math.random() * 0.4
        particle.trail = []
      }

      // Calculate bezier control points with magnetic influence
      const { cp1, cp2 } = calculateBezierControlPoints(
        connection.from,
        connection.to,
        mouseState.position
      )

      // Get current position on bezier curve
      const pos = getPointOnBezier(connection.from, connection.to, cp1, cp2, particle.progress)

      // Apply parallax
      const parallaxedPos = {
        x: pos.x + state.parallaxOffset.x * PARALLAX_CONFIG.near,
        y: pos.y + state.parallaxOffset.y * PARALLAX_CONFIG.near,
      }

      // Update trail
      if (config.enableParticleTrails) {
        particle.trail.unshift({ ...parallaxedPos })
        if (particle.trail.length > config.trailLength) {
          particle.trail.pop()
        }
      }

      // Calculate opacity based on progress
      let opacity = particle.opacity
      if (particle.progress < 0.1) {
        opacity *= particle.progress / 0.1
      } else if (particle.progress > 0.9) {
        opacity *= (1 - particle.progress) / 0.1
      }

      const color = particle.color === 'lime' ? COLORS.limeRgb : COLORS.cyanRgb

      // Draw trail
      if (config.enableParticleTrails && particle.trail.length > 1) {
        for (let i = 1; i < particle.trail.length; i++) {
          const trailOpacity = opacity * (1 - i / particle.trail.length) * 0.6
          const trailSize = particle.size * (1 - i / particle.trail.length * 0.5)

          ctx.beginPath()
          ctx.arc(particle.trail[i].x, particle.trail[i].y, trailSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${color}, ${trailOpacity})`
          ctx.fill()
        }
      }

      // Draw main particle with glow
      // Outer glow
      ctx.beginPath()
      ctx.arc(parallaxedPos.x, parallaxedPos.y, particle.size * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color}, ${opacity * 0.15})`
      ctx.fill()

      // Middle glow
      ctx.beginPath()
      ctx.arc(parallaxedPos.x, parallaxedPos.y, particle.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color}, ${opacity * 0.3})`
      ctx.fill()

      // Core
      ctx.beginPath()
      ctx.arc(parallaxedPos.x, parallaxedPos.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color}, ${opacity})`
      ctx.fill()

      // Bright center
      ctx.beginPath()
      ctx.arc(parallaxedPos.x, parallaxedPos.y, particle.size * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`
      ctx.fill()
    })

    ctx.restore()
  }, [
    canvasRef,
    connections,
    mouseState,
    config,
    centerNode,
    updateParallax,
    calculateBezierControlPoints,
    getPointOnBezier,
  ])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !isVisible || reducedMotion) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    setupCanvas()
    window.addEventListener('resize', setupCanvas)

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 50) // Cap at 50ms
      lastTimeRef.current = currentTime

      stateRef.current.time += deltaTime

      draw(ctx, deltaTime)

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', setupCanvas)
      cancelAnimationFrame(frameRef.current)
    }
  }, [canvasRef, isVisible, reducedMotion, draw])

  return {
    time: stateRef.current.time,
    parallaxOffset: stateRef.current.parallaxOffset,
    getBezierControlPoints: calculateBezierControlPoints,
  }
}

// Helper to initialize constellation nodes
export function initializeConstellation(
  config: EnhancedConstellationConfig,
  center: Point
): {
  centerNode: Node
  satelliteNodes: Node[]
  connections: Connection[]
} {
  const centerNode: Node = {
    id: 'safe-center',
    x: center.x,
    y: center.y,
    size: config.centerSize,
    type: 'center',
  }

  const satelliteNodes: Node[] = []
  const angleStep = (2 * Math.PI) / config.nodeCount

  for (let i = 0; i < config.nodeCount; i++) {
    const angle = angleStep * i - Math.PI / 2
    const x = center.x + Math.cos(angle) * config.orbitRadius
    const y = center.y + Math.sin(angle) * config.orbitRadius

    satelliteNodes.push({
      id: `sub-${i}`,
      x,
      y,
      size: config.satelliteSize,
      type: 'satellite',
      angle,
      orbitRadius: config.orbitRadius,
      floatOffset: i * 0.5,
    })
  }

  const connections: Connection[] = satelliteNodes.map((satellite, i) => ({
    id: `conn-${i}`,
    from: { x: centerNode.x, y: centerNode.y },
    to: { x: satellite.x, y: satellite.y },
    fromNodeId: centerNode.id,
    toNodeId: satellite.id,
  }))

  return { centerNode, satelliteNodes, connections }
}

// Calculate dynamic glow intensity based on mouse distance
export function calculateGlowIntensity(nodePos: Point, mousePos: Point | null, maxRadius: number): number {
  if (!mousePos) return 0
  const distance = Math.sqrt((mousePos.x - nodePos.x) ** 2 + (mousePos.y - nodePos.y) ** 2)
  if (distance > maxRadius) return 0
  return 1 - distance / maxRadius
}
