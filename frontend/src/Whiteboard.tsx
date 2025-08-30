import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useOpenAIRealtime } from './hooks/useOpenAIRealtime'
import { useArchitectureAnalysis } from './hooks/useArchitectureAnalysis'
import { DatabaseShapeUtil } from './components/ui/DatabaseShape'
import { ServerShapeUtil } from './components/ui/ServerShape'
import { UserShapeUtil } from './components/ui/UserShape'
import { LLMShapeUtil } from './components/ui/LLMShape'
import { FrontendShapeUtil } from './components/ui/FrontendShape'
import { SuggestionsPopup } from './components/SuggestionsPopup'
import { useRef, useCallback, useEffect, useState } from 'react'

export default function Whiteboard() {
  const { token, setToken, isRealtimeConnected, isRealtimeConnecting, isMuted, error, connectRealtime, disconnectRealtime, toggleMute, setEditor: setEditorOpenAI } = useOpenAIRealtime()
  const editorRef = useRef<any>(null)

  // Get OpenAI API key from environment variables
  const openaiApiKey = import.meta.env?.VITE_OPENAI_API_KEY || ''
  console.log('OpenAI API Key available:', !!openaiApiKey, openaiApiKey ? openaiApiKey.slice(0, 10) + '...' : 'none')
  
  const architectureAnalysis = useArchitectureAnalysis(openaiApiKey)

  // Add state to track if initial analysis has been done
  const [hasRunInitialAnalysis, setHasRunInitialAnalysis] = useState(false)

  // Note: Analysis is now triggered by shape creation events in onMount

  const handleAcceptSuggestion = useCallback((suggestion: any) => {
    const editor = editorRef.current
    if (!editor) return

    // Geometry helpers (same as in useOpenAIRealtime)
    const centerOf = (s: any) => ({
      x: (s.x ?? 0) + ((s.props?.w ?? 0) / 2),
      y: (s.y ?? 0) + ((s.props?.h ?? 0) / 2),
    })

    const edgePointRect = (center: { x: number; y: number }, halfW: number, halfH: number, toward: { x: number; y: number }) => {
      const dx = toward.x - center.x
      const dy = toward.y - center.y
      if (dx === 0 && dy === 0) return { x: center.x, y: center.y }
      const tx = halfW / Math.abs(dx || 1e-9)
      const ty = halfH / Math.abs(dy || 1e-9)
      const t = Math.min(tx, ty)
      return { x: center.x + dx * t, y: center.y + dy * t }
    }

    const edgePointEllipse = (center: { x: number; y: number }, halfW: number, halfH: number, toward: { x: number; y: number }) => {
      const dx = toward.x - center.x
      const dy = toward.y - center.y
      if (dx === 0 && dy === 0) return { x: center.x, y: center.y }
      const scale = 1 / Math.sqrt((dx * dx) / (halfW * halfW || 1e-9) + (dy * dy) / (halfH * halfH || 1e-9))
      return { x: center.x + dx * scale, y: center.y + dy * scale }
    }

    const edgePoint = (s: any, toward: { x: number; y: number }) => {
      const c = centerOf(s)
      const hw = (s.props?.w ?? 0) / 2
      const hh = (s.props?.h ?? 0) / 2
      
      const shapeType = s.type
      if (shapeType === 'server') {
        return edgePointRect(c, hw, hh, toward)
      } else if (shapeType === 'database' || shapeType === 'user' || shapeType === 'llm' || shapeType === 'frontend') {
        return edgePointEllipse(c, hw, hh, toward)
      }
      return c
    }

    const uuid = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const shapeId = `shape:${uuid}`
    
    // Map suggestion component types to shape types
    const shapeTypeMap = {
      'database': 'database',
      'person': 'user', 
      'server': 'server',
      'llm': 'llm',
      'frontend': 'frontend',
    }
    
    const shape = {
      id: shapeId,
      type: shapeTypeMap[suggestion.component_type as keyof typeof shapeTypeMap] || 'server',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      props: {
        w: suggestion.component_type === 'person' ? 60 : suggestion.component_type === 'database' ? 80 : suggestion.component_type === 'llm' ? 100 : 120,
        h: suggestion.component_type === 'person' ? 80 : suggestion.component_type === 'database' ? 100 : 80,
        color: suggestion.component_type === 'database' ? 'green' : suggestion.component_type === 'person' ? 'blue' : suggestion.component_type === 'server' ? 'gray' : 'purple',
      },
    }
    
    editor.createShapes([shape])
    
    // Create connections if suggested
    if (suggestion.connections && suggestion.connections.length > 0) {
      const newShape = editor.getShape(shapeId)
      
      suggestion.connections.forEach((connection: any) => {
        const targetShapeId = `shape:${connection.to_component_id}`
        const targetShape = editor.getShape(targetShapeId)
        
        if (targetShape && newShape) {
          // Determine connection direction
          let fromShape, toShape, fromUuid, toUuid
          if (connection.direction === 'to') {
            fromShape = newShape
            toShape = targetShape
            fromUuid = uuid
            toUuid = connection.to_component_id
          } else if (connection.direction === 'from') {
            fromShape = targetShape
            toShape = newShape
            fromUuid = connection.to_component_id
            toUuid = uuid
          } else {
            // bidirectional - create one connection for now
            fromShape = newShape
            toShape = targetShape
            fromUuid = uuid
            toUuid = connection.to_component_id
          }
          
          // Calculate edge points
          const ca = centerOf(fromShape)
          const cb = centerOf(toShape)
          const start = edgePoint(fromShape, cb)
          const end = edgePoint(toShape, ca)
          
          const arrowId = `shape:connection_${fromUuid}_${toUuid}`
          
          // Create arrow with bindings
          editor.createShapes([{
            id: arrowId,
            type: 'arrow',
            props: {
              start,
              end,
              bend: 0,
              color: 'black',
              size: 'm',
            },
          }])

          // Create bindings to make the arrow stick
          editor.createBindings([
            {
              id: `binding:${arrowId}_start`,
              type: 'arrow',
              fromId: arrowId,
              toId: fromShape.id,
              props: {
                terminal: 'start',
                isPrecise: false,
                isExact: false,
                normalizedAnchor: { x: 0.5, y: 0.5 }
              }
            },
            {
              id: `binding:${arrowId}_end`,
              type: 'arrow',
              fromId: arrowId,
              toId: toShape.id,
              props: {
                terminal: 'end',
                isPrecise: false,
                isExact: false,
                normalizedAnchor: { x: 0.5, y: 0.5 }
              }
            }
          ])
          
          console.log(`Created sticky connection: ${connection.description}`)
        } else {
          console.warn(`Target shape not found: ${targetShapeId}`)
        }
      })
    }
    
    architectureAnalysis.dismissSuggestion(suggestion.id)
    
    // Queue a new analysis after adding the component
    setTimeout(() => {
      console.log('Running analysis after component addition')
      architectureAnalysis.analyzeDiagram()
    }, 1500)
  }, [architectureAnalysis.dismissSuggestion, architectureAnalysis.analyzeDiagram])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(((e.target as HTMLInputElement).value || '').trim())}
            placeholder="Ephemeral realtime token"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: 260
            }}
          />
          <button
            onClick={isRealtimeConnected ? disconnectRealtime : connectRealtime}
            disabled={isRealtimeConnecting || (!isRealtimeConnected && !token)}
            style={{
              background: isRealtimeConnected ? '#ff4444' : '#4a7dff',
              opacity: isRealtimeConnecting ? 0.7 : 1,
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: isRealtimeConnecting ? 'not-allowed' : 'pointer'
            }}
          >
            {isRealtimeConnected ? 'Disconnect Realtime' : (isRealtimeConnecting ? 'Connecting...' : 'Connect')}
          </button>
          <button
            onClick={toggleMute}
            disabled={!isRealtimeConnected}
            style={{
              background: isMuted ? '#888' : '#222',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: !isRealtimeConnected ? 'not-allowed' : 'pointer'
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <span style={{ color: isRealtimeConnected ? 'green' : 'red' }}>
            {isRealtimeConnected ? (isMuted ? 'Muted' : 'Unmuted') : 'Idle'}
          </span>
        </div>
                {error ? (
          <span style={{ color: '#cc0000' }}>{error}</span>
        ) : null}
        </div>

      {/* tldraw Canvas */}
      <Tldraw 
        shapeUtils={[DatabaseShapeUtil, ServerShapeUtil, UserShapeUtil, LLMShapeUtil, FrontendShapeUtil]}
        onMount={(editor) => {
          // Provide editor to hooks
          setEditorOpenAI(editor)
          editorRef.current = editor
          architectureAnalysis.setEditor(editor)
          console.log('tldraw editor mounted, setting up shape change listener...')
          
          let previousShapeCount = 0
          
          // Listen for shape changes and trigger analysis when new components are added
          editor.sideEffects.registerAfterCreateHandler('shape', (shape) => {
            console.log('🎯 New shape created:', shape.type, shape.id)
            
            // Only trigger analysis for our custom component types, not arrows
            if (['database', 'user', 'server', 'llm', 'frontend'].includes(shape.type)) {
              console.log('🎯 Component added, queuing analysis in 10 seconds...')
              setTimeout(() => {
                console.log('🎯 Running analysis after component addition via voice')
                architectureAnalysis.analyzeDiagram()
              }, 1000) // 10 second delay to allow user to add more components
            }
          })
          
          // Initial analysis if shapes already exist
          setTimeout(() => {
            const shapes = editor.getCurrentPageShapes()
            console.log('Editor mounted, shapes:', shapes?.length || 0)
            if (shapes && shapes.length > 0 && openaiApiKey && !hasRunInitialAnalysis) {
              console.log('Triggering initial analysis from onMount')
              architectureAnalysis.analyzeDiagram()
              setHasRunInitialAnalysis(true)
            }
          }, 1000)
        }}
      />

      {/* Architecture Suggestions Popup */}
      <SuggestionsPopup
        suggestions={architectureAnalysis.suggestions}
        isAnalyzing={architectureAnalysis.isAnalyzing}
        error={architectureAnalysis.error}
        onDismiss={architectureAnalysis.dismissSuggestion}
        onClearAll={architectureAnalysis.clearSuggestions}
        onAcceptSuggestion={handleAcceptSuggestion}
        lastAnalysis={architectureAnalysis.lastAnalysis}
      />
    </div>
  )
}
