import { forwardRef } from 'react'

interface ConstellationCanvasProps {
  className?: string
}

export const ConstellationCanvas = forwardRef<HTMLCanvasElement, ConstellationCanvasProps>(
  function ConstellationCanvas({ className }, ref) {
    return (
      <canvas
        ref={ref}
        className={className}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }
)
