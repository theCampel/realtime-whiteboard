import { useState, useEffect, useRef } from 'react'

interface RealtimeState {
  isConnected: boolean
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  sendTestCommand: (command: any) => void
  setEditor: (editor: any) => void
}

export function useRealtime(): RealtimeState {
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const editorRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    ws.onmessage = (event) => {
      console.log('Received:', event.data)
      
      try {
        const command = JSON.parse(event.data)
        handleDrawingCommand(command)
      } catch (error) {
        console.log('Non-JSON message:', event.data)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // TODO: Send audio data to backend
          // For now, just log
          console.log('Audio chunk:', event.data.size, 'bytes')
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
    }
  }

  const handleDrawingCommand = (command: any) => {
    const editor = editorRef.current
    if (!editor) {
      console.log('Editor not ready, queuing command:', command)
      return
    }

    console.log('Handling drawing command:', command)
    
    switch (command.type) {
      case 'draw_item':
        if (command.shape) {
          editor.createShapes([command.shape])
          console.log('Drew shape:', command.shape.id)
        }
        break
      case 'remove_item':
        if (command.shapeId) {
          editor.deleteShapes([command.shapeId])
          console.log('Removed shape:', command.shapeId)
        }
        break
      case 'draw_connection':
        if (command.arrow) {
          editor.createShapes([command.arrow])
          console.log('Drew connection:', command.arrow.id)
        }
        break
      default:
        console.log('Unknown command type:', command.type)
    }
  }

  const sendTestCommand = (command: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command))
    }
  }

  const setEditor = (editor: any) => {
    editorRef.current = editor
    console.log('Editor set in ref:', !!editor)
  }

  return {
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    sendTestCommand,
    setEditor
  }
}
