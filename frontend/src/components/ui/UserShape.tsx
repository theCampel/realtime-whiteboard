import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw'

// Define the shape type
export type UserShape = TLBaseShape<
  'user',
  {
    w: number
    h: number
    color: string
  }
>

// Define the shape utility class
export class UserShapeUtil extends BaseBoxShapeUtil<UserShape> {
  static override type = 'user' as const

  // Default props for the shape
  getDefaultProps(): UserShape['props'] {
    return {
      w: 60,
      h: 80,
      color: 'blue'
    }
  }

  // Component that renders the shape
  component(shape: UserShape) {
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
          viewBox="0 0 60 80"
          style={{ 
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          {/* Head */}
          <circle 
            cx="30" 
            cy="13" 
            r="8" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          
          {/* Torso */}
          <line 
            x1="30" 
            y1="21" 
            x2="30" 
            y2="50" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          
          {/* Arms */}
          <line 
            x1="30" 
            y1="32" 
            x2="18" 
            y2="42" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          <line 
            x1="30" 
            y1="32" 
            x2="42" 
            y2="42" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          
          {/* Left leg */}
          <line 
            x1="30" 
            y1="50" 
            x2="18" 
            y2="68" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          
          {/* Right leg */}
          <line 
            x1="30" 
            y1="50" 
            x2="42" 
            y2="68" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          
          {/* User label */}
          <text 
            x="30" 
            y="76" 
            textAnchor="middle" 
            fontSize="8" 
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
          >
            User
          </text>
        </svg>
      </HTMLContainer>
    )
  }

  // Indicator when shape is selected
  indicator(shape: UserShape) {
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