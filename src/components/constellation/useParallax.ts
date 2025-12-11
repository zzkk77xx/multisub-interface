import { useRef, useCallback } from 'react'
import type { Point, ParallaxState, ParallaxConfig, MouseState } from './constellation.types'
import { PARALLAX_CONFIG } from './constellation.types'

interface UseParallaxProps {
  mouseState: MouseState
  dimensions: { width: number; height: number }
  config?: ParallaxConfig
  enabled?: boolean
}

interface ParallaxResult {
  state: ParallaxState
  getLayerOffset: (layer: 'far' | 'mid' | 'near') => Point
  update: (deltaTime: number) => void
}

/**
 * Hook for managing parallax 3D depth effect
 * Creates smooth offset movement based on mouse position
 */
export function useParallax({
  mouseState,
  dimensions,
  config = PARALLAX_CONFIG,
  enabled = true,
}: UseParallaxProps): ParallaxResult {
  const stateRef = useRef<ParallaxState>({
    offset: { x: 0, y: 0 },
    targetOffset: { x: 0, y: 0 },
  })

  // Calculate target offset based on mouse position
  const calculateTargetOffset = useCallback(() => {
    if (!enabled || !mouseState.position || !mouseState.isInside) {
      return { x: 0, y: 0 }
    }

    // Calculate mouse offset from center (-1 to 1)
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    const normalizedX = (mouseState.position.x - centerX) / centerX
    const normalizedY = (mouseState.position.y - centerY) / centerY

    // Max offset is proportional to viewport size
    const maxOffsetX = dimensions.width * 0.03
    const maxOffsetY = dimensions.height * 0.03

    return {
      x: normalizedX * maxOffsetX,
      y: normalizedY * maxOffsetY,
    }
  }, [mouseState, dimensions, enabled])

  // Lerp function for smooth interpolation
  const lerp = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor
  }

  // Update parallax state (called each frame)
  const update = useCallback((deltaTime: number) => {
    const state = stateRef.current

    // Calculate new target
    const target = calculateTargetOffset()
    state.targetOffset = target

    // Smooth interpolation towards target
    // Adjust lerp factor based on deltaTime for frame-independent movement
    const adjustedLerp = Math.min(1, config.lerpFactor * (deltaTime / 16))

    state.offset.x = lerp(state.offset.x, target.x, adjustedLerp)
    state.offset.y = lerp(state.offset.y, target.y, adjustedLerp)

    // Snap to target if very close (prevent endless tiny movements)
    if (Math.abs(state.offset.x - target.x) < 0.01) state.offset.x = target.x
    if (Math.abs(state.offset.y - target.y) < 0.01) state.offset.y = target.y
  }, [calculateTargetOffset, config.lerpFactor])

  // Get offset for a specific layer
  const getLayerOffset = useCallback((layer: 'far' | 'mid' | 'near'): Point => {
    if (!enabled) return { x: 0, y: 0 }

    const state = stateRef.current
    const multiplier = config[layer]

    return {
      x: state.offset.x * multiplier,
      y: state.offset.y * multiplier,
    }
  }, [config, enabled])

  return {
    state: stateRef.current,
    getLayerOffset,
    update,
  }
}

/**
 * Apply parallax offset to a point
 */
export function applyParallax(point: Point, offset: Point): Point {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  }
}

/**
 * Calculate magnetic field influence on a point
 */
export function calculateMagneticOffset(
  nodePos: Point,
  mousePos: Point | null,
  radius: number,
  strength: number
): Point {
  if (!mousePos) return { x: 0, y: 0 }

  const dx = mousePos.x - nodePos.x
  const dy = mousePos.y - nodePos.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance > radius || distance < 1) return { x: 0, y: 0 }

  // Calculate attraction strength (inverse of distance, normalized)
  const normalizedDistance = distance / radius
  const attractionFactor = (1 - normalizedDistance) * (1 - normalizedDistance) // Quadratic falloff

  // Direction towards mouse
  const dirX = dx / distance
  const dirY = dy / distance

  return {
    x: dirX * strength * attractionFactor,
    y: dirY * strength * attractionFactor,
  }
}

/**
 * Calculate Bezier control point offset due to magnetic field
 */
export function calculateBezierMagneticOffset(
  controlPoint: Point,
  mousePos: Point | null,
  radius: number,
  strength: number
): Point {
  if (!mousePos) return { x: 0, y: 0 }

  const dx = mousePos.x - controlPoint.x
  const dy = mousePos.y - controlPoint.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance > radius) return { x: 0, y: 0 }

  // Calculate influence (quadratic falloff)
  const normalizedDistance = distance / radius
  const influenceFactor = (1 - normalizedDistance) * (1 - normalizedDistance)

  // Perpendicular direction for "bending" effect
  // This makes the line curve towards the mouse
  const dirX = dx / (distance || 1)
  const dirY = dy / (distance || 1)

  return {
    x: dirX * strength * influenceFactor,
    y: dirY * strength * influenceFactor,
  }
}
