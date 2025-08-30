import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw'

// Define the shape type
export type LLMShape = TLBaseShape<
  'llm',
  {
    w: number
    h: number
    color: string
  }
>

// Define the shape utility class
export class LLMShapeUtil extends BaseBoxShapeUtil<LLMShape> {
  static override type = 'llm' as const

  // Default props for the shape
  getDefaultProps(): LLMShape['props'] {
    return {
      w: 100,
      h: 80,
      color: 'purple'
    }
  }

  // Component that renders the shape
  component(shape: LLMShape) {
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
          viewBox="0 0 100 80"
          style={{ 
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          {/* Main brain-like outline */}
          <path
            d="M20 25 C15 20, 15 15, 25 15 C30 10, 40 10, 45 15 C50 10, 60 10, 65 15 C75 15, 85 20, 80 25 C85 30, 85 35, 80 40 C85 45, 80 50, 75 50 C70 55, 60 55, 55 50 C50 55, 40 55, 35 50 C30 55, 20 55, 15 50 C10 45, 15 40, 20 35 C15 30, 15 25, 20 25 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          
          {/* Neural network nodes */}
          <circle cx="30" cy="25" r="2" fill="currentColor" />
          <circle cx="45" cy="20" r="2" fill="currentColor" />
          <circle cx="60" cy="25" r="2" fill="currentColor" />
          <circle cx="70" cy="35" r="2" fill="currentColor" />
          <circle cx="55" cy="40" r="2" fill="currentColor" />
          <circle cx="40" cy="45" r="2" fill="currentColor" />
          <circle cx="25" cy="40" r="2" fill="currentColor" />
          <circle cx="35" cy="30" r="2" fill="currentColor" />
          
          {/* Neural connections */}
          <line x1="30" y1="25" x2="45" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="45" y1="20" x2="60" y2="25" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="60" y1="25" x2="70" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="70" y1="35" x2="55" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="55" y1="40" x2="40" y2="45" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="40" y1="45" x2="25" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="25" y1="40" x2="30" y2="25" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="35" y1="30" x2="45" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="35" y1="30" x2="55" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          
          {/* LLM label */}
          <text 
            x="50" 
            y="68" 
            textAnchor="middle" 
            fontSize="10" 
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
          >
            LLM
          </text>
        </svg>
      </HTMLContainer>
    )
  }

  // Indicator when shape is selected
  indicator(shape: LLMShape) {
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