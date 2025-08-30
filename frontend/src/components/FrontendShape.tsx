import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw'

// Define the shape type
export type FrontendShape = TLBaseShape<
  'frontend',
  {
    w: number
    h: number
    color: string
  }
>

// Define the shape utility class
export class FrontendShapeUtil extends BaseBoxShapeUtil<FrontendShape> {
  static override type = 'frontend' as const

  // Default props for the shape
  getDefaultProps(): FrontendShape['props'] {
    return {
      w: 90,
      h: 70,
      color: 'purple'
    }
  }

  // Component that renders the shape
  component(shape: FrontendShape) {
    const bounds = this.getGeometry(shape).bounds
    
    return (
      <HTMLContainer
        style={{
          width: bounds.width,
          height: bounds.height,
        }}
      >
        <svg
          width={bounds.width}
          height={bounds.height}
          viewBox="0 0 90 70"
          style={{ 
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          {/* Browser window frame */}
          <rect
            x="5"
            y="10"
            width="80"
            height="50"
            fill="hsl(var(--frontend-primary) / 0.05)"
            stroke="hsl(var(--frontend-primary))"
            strokeWidth="2"
            rx="4"
          />
          
          {/* Browser top bar */}
          <rect
            x="5"
            y="10"
            width="80"
            height="12"
            fill="hsl(var(--frontend-secondary) / 0.3)"
            stroke="hsl(var(--frontend-primary))"
            strokeWidth="2"
            rx="4"
          />
          
          {/* Traffic light buttons */}
          <circle cx="12" cy="16" r="2" fill="hsl(0 80% 60%)" />
          <circle cx="19" cy="16" r="2" fill="hsl(45 90% 55%)" />
          <circle cx="26" cy="16" r="2" fill="hsl(120 60% 50%)" />
          
          {/* Address bar */}
          <rect
            x="35"
            y="13"
            width="45"
            height="6"
            fill="hsl(var(--frontend-primary) / 0.1)"
            stroke="hsl(var(--frontend-accent))"
            strokeWidth="1"
            rx="3"
          />
          
          {/* Content area with layout blocks */}
          <rect
            x="10"
            y="26"
            width="70"
            height="8"
            fill="hsl(var(--frontend-accent) / 0.2)"
            stroke="hsl(var(--frontend-accent))"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Content columns */}
          <rect
            x="10"
            y="38"
            width="20"
            height="18"
            fill="hsl(var(--frontend-secondary) / 0.2)"
            stroke="hsl(var(--frontend-secondary))"
            strokeWidth="1"
            rx="2"
          />
          
          <rect
            x="35"
            y="38"
            width="45"
            height="18"
            fill="hsl(var(--frontend-primary) / 0.1)"
            stroke="hsl(var(--frontend-primary))"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Interactive elements */}
          <circle cx="15" cy="42" r="1.5" fill="hsl(var(--frontend-accent))" />
          <rect x="12" y="46" width="14" height="2" fill="hsl(var(--frontend-secondary))" rx="1" />
          <rect x="12" y="49" width="10" height="2" fill="hsl(var(--frontend-secondary))" rx="1" />
          
          {/* Button in main content */}
          <rect
            x="40"
            y="50"
            width="15"
            height="4"
            fill="hsl(var(--frontend-primary) / 0.3)"
            stroke="hsl(var(--frontend-primary))"
            strokeWidth="1"
            rx="2"
          />
          
          {/* Frontend label */}
          <text 
            x="45" 
            y="68" 
            textAnchor="middle" 
            fontSize="8" 
            fill="hsl(var(--frontend-primary))"
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
          >
            Frontend
          </text>
        </svg>
      </HTMLContainer>
    )
  }

  // Indicator when shape is selected
  indicator(shape: FrontendShape) {
    const bounds = this.getGeometry(shape).bounds
    return (
      <rect
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    )
  }
}