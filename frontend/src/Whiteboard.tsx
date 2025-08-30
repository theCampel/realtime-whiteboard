import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useOpenAIRealtime } from './hooks/useOpenAIRealtime'
import { DatabaseShapeUtil } from './components/ui/DatabaseShape'
import { ServerShapeUtil } from './components/ui/ServerShape'
import { UserShapeUtil } from './components/ui/UserShape'
import { LLMShapeUtil } from './components/ui/LLMShape'
import { useRef } from 'react'

export default function Whiteboard() {
  const { token, setToken, isRealtimeConnected, isRealtimeConnecting, isMuted, error, connectRealtime, disconnectRealtime, toggleMute, setEditor: setEditorOpenAI } = useOpenAIRealtime()
  const editorRef = useRef<any>(null)

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
        onMount={(editor) => {
          // Provide editor to hooks
          setEditorOpenAI(editor)
          editorRef.current = editor
          console.log('tldraw editor mounted')
        }}
      />
    </div>
  )
}
