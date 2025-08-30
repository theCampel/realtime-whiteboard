import { useCallback, useRef, useState } from 'react'
import { z } from 'zod'
// Use the standalone browser package per the example
import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents-realtime'

interface UseOpenAIRealtimeState {
  token: string
  setToken: (value: string) => void
  isRealtimeConnected: boolean
  isRealtimeConnecting: boolean
  isMuted: boolean
  error: string | null
  connectRealtime: () => Promise<void>
  disconnectRealtime: () => void
  toggleMute: () => void
  setEditor: (editor: any) => void
}

export function useOpenAIRealtime(): UseOpenAIRealtimeState {
  const [token, setToken] = useState('')
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [isRealtimeConnecting, setIsRealtimeConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agentRef = useRef<RealtimeAgent | null>(null)
  const sessionRef = useRef<RealtimeSession | null>(null)
  const editorRef = useRef<any>(null)




  const SYSTEM_PROMPT =
    'You are Rubber Ducky Bot. The user is discussing how their system architecture will look. You are mainly tasked with sitting there and listening. When they have mentioned an item that you\'re able to draw, draw it using the tool. If they go on a longwinded rant about the different components of their system, write a that on the side, using dashes as bullet points. It will be a briefer version of what they want. Be brief and concise, but kind and friendly. Interpret spoken instructions as immediate tool calls. If they describe what their product is going to be at a high level, also add text that explains that with bullet points.' +
    'Do not wait for full sentences if a coherent unit of action is clear. ' +
    'Allowed item types: database, person, server, llm. Return UUIDs from draw_item and reuse them.' +
    'Don\'t be too chatty. Just do what the user asks for, with brief responses.'

  const connectRealtime = useCallback(async () => {
    const apiKey = token.trim()
    if (!apiKey) {
      setError('Ephemeral client token is required')
      return
    }
    
    // Basic validation for ephemeral token format
    if (!apiKey.startsWith('ek_') || apiKey.length < 20) {
      setError('Invalid ephemeral token format. Token should start with "ek_" and be generated from OpenAI API.')
      return
    }
    
    if (isRealtimeConnected || isRealtimeConnecting) return

    setIsRealtimeConnecting(true)
    setError(null)
    try {
      // Geometry helpers for connections
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
        
        // Use shape type to determine geometry
        const shapeType = s.type
        if (shapeType === 'server') {
          // Server is rectangular
          return edgePointRect(c, hw, hh, toward)
        } else if (shapeType === 'database' || shapeType === 'user' || shapeType === 'llm') {
          // Database, user, and LLM are more circular/elliptical
          return edgePointEllipse(c, hw, hh, toward)
        }
        
        // Fallback to center for unknown shapes
        return c
      }

      // Whiteboard tools
      const drawItem = tool({
        name: 'draw_item',
        description: 'Draw an item on the canvas. Coordinates are in pixels from top-left. Canvas is roughly 1000x600.',
        parameters: z.object({
          item_type: z.enum(['database', 'person', 'server', 'llm', 'frontend']),
          x: z.number().describe('X coordinate in pixels'),
          y: z.number().describe('Y coordinate in pixels'),
        }),
        execute: async ({ item_type, x, y }: { item_type: 'database' | 'person' | 'server' | 'llm' | 'frontend', x: number, y: number }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')

          const uuid = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
          const shapeId = `shape:${uuid}`
          
          // Map item types to custom shape types
          const shapeTypeMap = {
            'database': 'database',
            'person': 'user', 
            'server': 'server',
            'llm': 'llm',
            'frontend': 'frontend',
          }
          
          const shape = {
            id: shapeId,
            type: shapeTypeMap[item_type],
            x,
            y,
            props: {
              w: item_type === 'person' ? 60 : item_type === 'database' ? 80 : item_type === 'llm' ? 100 : 120,
              h: item_type === 'person' ? 80 : item_type === 'database' ? 100 : 80,
              color: item_type === 'database' ? 'green' : item_type === 'person' ? 'blue' : item_type === 'server' ? 'gray' : 'purple',
            },
          }
          editor.createShapes([shape])
          console.log(`Drew ${item_type} with UUID: ${uuid}`)
          return uuid
        },
      })

      const connectItems = tool({
        name: 'connect',
        description: 'Connect two items by their UUIDs with an arrow',
        parameters: z.object({
          item1_uuid: z.string(),
          item2_uuid: z.string(),
        }),
        execute: async ({ item1_uuid, item2_uuid }: { item1_uuid: string; item2_uuid: string }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')

          console.log('Connecting items:', item1_uuid, item2_uuid)

          const a = editor.getShape?.(`shape:${item1_uuid}`)
          const b = editor.getShape?.(`shape:${item2_uuid}`)
          if (!a || !b) throw new Error('One or both items not found on canvas')

          const ca = centerOf(a)
          const cb = centerOf(b)
          const start = edgePoint(a, cb)
          const end = edgePoint(b, ca)

          const arrowId = `shape:connection_${item1_uuid}_${item2_uuid}`
          
          // Create the arrow shape
          editor.createShapes([
            {
              id: arrowId,
              type: 'arrow',
              props: {
                start,
                end,
                bend: 0,
                color: 'black',
                size: 'm',
              },
            },
          ])

          // Create bindings to make the arrow stick to the shapes
          editor.createBindings([
            {
              id: `binding:${arrowId}_start`,
              type: 'arrow',
              fromId: arrowId,
              toId: `shape:${item1_uuid}`,
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
              toId: `shape:${item2_uuid}`,
              props: {
                terminal: 'end',
                isPrecise: false,
                isExact: false,
                normalizedAnchor: { x: 0.5, y: 0.5 }
              }
            }
          ])
          return 'ok'
        },
      })

      const deleteItem = tool({
        name: 'delete_item',
        description: 'Delete an item by its UUID',
        parameters: z.object({
          item_uuid: z.string(),
        }),
        execute: async ({ item_uuid }: { item_uuid: string }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')
          
          const shape = editor.getShape?.(`shape:${item_uuid}`)
          if (shape) editor.deleteShapes([shape.id])
          return 'ok'
        },
      })

      const addText = tool({
        name: 'add_text',
        description: 'Add text to the whiteboard. Coordinates are in pixels from top-left. Canvas is roughly 1000x600.',
        parameters: z.object({
          text: z.string(),
          x: z.number().describe('X coordinate in pixels'),
          y: z.number().describe('Y coordinate in pixels'),
        }),
        execute: async ({ text, x, y }: { text: string, x: number, y: number }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')

          const uuid = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
          const shape = {
            id: `shape:${uuid}`,
            type: 'text',
            x,
            y,
            props: {
              text,
              size: 's',
              color: 'black',
            },
          }
          editor.createShapes([shape])
          return uuid
        },
      })

      const agent = new RealtimeAgent({
        name: 'Assistant',
        instructions: SYSTEM_PROMPT,
        tools: [drawItem, connectItems, deleteItem, addText]
      });

      const session = new RealtimeSession(agent, {
        config: {
          turnDetection: {
            type: 'semantic_vad',
            eagerness: 'high',
            createResponse: true,
            interruptResponse: true,
          },
        },
      })

      // Log transport events from the realtime server
      session.on('transport_event', (event: unknown) => {
        // eslint-disable-next-line no-console
        console.log('realtime transport_event', event)
      })

      agentRef.current = agent
      sessionRef.current = session

      await session.connect({ apiKey })
      setIsRealtimeConnected(true)
      setIsMuted(Boolean((session as any).muted))
    } catch (e: any) {
      console.error('Realtime connection error:', e)
      const errorMessage = e?.message ?? 'Failed to connect to Realtime session'
      setError(`Connection failed: ${errorMessage}`)
      setIsRealtimeConnected(false)
      agentRef.current = null
      sessionRef.current = null
    } finally {
      setIsRealtimeConnecting(false)
    }
  }, [token, isRealtimeConnected, isRealtimeConnecting])

  const disconnectRealtime = useCallback(() => {
    try {
      // Prefer close() per example; fallback to connect-safe noop
      const s = sessionRef.current as any
      if (s?.close) s.close()
      else if (s?.disconnect) s.disconnect()
    } catch {
      // noop
    }
    agentRef.current = null
    sessionRef.current = null
    setIsRealtimeConnected(false)
    setIsRealtimeConnecting(false)
    setIsMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    const s = sessionRef.current as any
    if (!s) return
    const newMutedState = !s.muted
    try {
      s.mute?.(newMutedState)
    } catch {
      // noop
    }
    setIsMuted(Boolean(newMutedState))
  }, [])

  const setEditor = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  return {
    token,
    setToken,
    isRealtimeConnected,
    isRealtimeConnecting,
    isMuted,
    error,
    connectRealtime,
    disconnectRealtime,
    toggleMute,
    setEditor
  }
}


