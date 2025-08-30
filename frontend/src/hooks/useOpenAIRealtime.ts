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
    'You control a whiteboard. Interpret spoken instructions as immediate tool calls. ' +
    'Do not wait for full sentences if a coherent unit of action is clear. ' +
    'Allowed item types: database, person. Return UUIDs from draw_item and reuse them.'

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
      // Whiteboard tools
      const drawItem = tool({
        name: 'draw_item',
        description: 'Draw an item on the canvas. Allowed item types: database, person',
        parameters: z.object({
          item_type: z.enum(['database', 'person']),
        }),
        execute: async ({ item_type }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')

          const id = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
          const type = item_type === 'person' ? 'user' : 'database'

          console.log('Drawing item:', item_type)

          // Try to place near viewport centre
          let x = 0
          let y = 0
          try {
            const center = editor.getViewportScreenCenter?.()
            if (center) {
              x = center.x - 40
              y = center.y - 40
            }
          } catch {
            // fallback to origin
          }

          const shapePropsByType: Record<string, { w: number; h: number; color: string }> = {
            database: { w: 80, h: 100, color: 'green' },
            user: { w: 60, h: 80, color: 'blue' },
          }

          const props = shapePropsByType[type] || { w: 80, h: 80, color: 'black' }

          editor.createShapes?.([
            {
              id,
              type,
              x,
              y,
              props,
            },
          ])

          return id
        },
      })

      const connectItems = tool({
        name: 'connect',
        description: 'Connect two items by their UUIDs with an arrow',
        parameters: z.object({
          item1_uuid: z.string(),
          item2_uuid: z.string(),
        }),
        execute: async ({ item1_uuid, item2_uuid }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')

          console.log('Connecting items:', item1_uuid, item2_uuid)

          const arrowId = (globalThis as any).crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`
          // Create an arrow bound to the two shapes
          editor.createShapes?.([
            {
              id: arrowId,
              type: 'arrow',
              props: {
                start: { type: 'binding', boundShapeId: item1_uuid },
                end: { type: 'binding', boundShapeId: item2_uuid },
              },
            },
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
        execute: async ({ item_uuid }) => {
          const editor = editorRef.current
          if (!editor) throw new Error('Editor not initialised')
          editor.deleteShapes?.([item_uuid])
          console.log('Deleting item:', item_uuid)
          return 'ok'
        },
      })

      const agent = new RealtimeAgent({
        name: 'Assistant',
        instructions: SYSTEM_PROMPT,
        tools: [drawItem, connectItems, deleteItem]
      });

      const session = new RealtimeSession(agent)

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


