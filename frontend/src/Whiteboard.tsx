import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useRealtime } from './hooks/useRealtime'

export default function Whiteboard() {
  const { isConnected, isRecording, startRecording, stopRecording, sendTestCommand, setEditor } = useRealtime()

  const testDrawDatabase = async () => {
    try {
      const response = await fetch('http://localhost:8000/test-draw/database/test-db')
      const command = await response.json()
      sendTestCommand(command)
    } catch (error) {
      console.error('Failed to test draw:', error)
    }
  }

  const testDrawServer = async () => {
    try {
      const response = await fetch('http://localhost:8000/test-draw/server/api-server')
      const command = await response.json()
      sendTestCommand(command)
    } catch (error) {
      console.error('Failed to test draw:', error)
    }
  }

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
        <div>
          Connection: <span style={{ color: isConnected ? 'green' : 'red' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            background: isRecording ? '#ff4444' : '#44ff44',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {/* Test Buttons */}
        <button
          onClick={testDrawDatabase}
          style={{
            background: '#0066cc',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test: Draw Database
        </button>
        
        <button
          onClick={testDrawServer}
          style={{
            background: '#009900',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test: Draw Server
        </button>
      </div>

      {/* tldraw Canvas */}
      <Tldraw 
        onMount={(editor) => {
          setEditor(editor)
          console.log('tldraw editor mounted')
        }}
      />
    </div>
  )
}
