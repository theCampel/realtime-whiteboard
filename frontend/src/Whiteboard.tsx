import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useRealtime } from './hooks/useRealtime'
import { DatabaseShape, DatabaseShapeUtil } from './components/ui/DatabaseShape'
import { ServerShape, ServerShapeUtil } from './components/ui/ServerShape'
import { UserShape, UserShapeUtil } from './components/ui/UserShape'
import { LLMShape, LLMShapeUtil } from './components/ui/LLMShape'

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

  const testConnectItems = async () => {
    // First, ensure the items exist to avoid errors. This is for testing convenience.
    await testDrawDatabase()
    await testDrawServer()
    
    try {
      // Connect the two items we just created
      const response = await fetch('http://localhost:8000/test-connect/test-db/api-server')
      const command = await response.json()
      sendTestCommand(command)
    } catch (error) {
      console.error('Failed to test connect:', error)
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
        
        <button
          onClick={testConnectItems}
          style={{
            background: '#cc6600',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test: Connect Items
        </button>
      </div>

      {/* tldraw Canvas */}
      <Tldraw 
        shapeUtils={[DatabaseShapeUtil, ServerShapeUtil, UserShapeUtil, LLMShapeUtil]}
        onMount={(editor) => {
          // Function to find a good position for new shapes
          const findGoodPosition = (shapeType: string, shapeWidth: number, shapeHeight: number) => {
            // Get all shapes and filter by type
            const allShapes = Array.from(editor.store.query.records('shape').get()) as any[]
            const shapesOfType = allShapes.filter((shape: any) => shape.type === shapeType)
            
            if (shapesOfType.length === 0) {
              // If no shapes of this type exist, place near center
              const center = editor.getViewportScreenCenter()
              return { x: center.x - shapeWidth / 2, y: center.y - shapeHeight / 2 }
            }
            
            // Find the last added shape of this type
            const lastShape = shapesOfType[shapesOfType.length - 1]
            const lastShapeBounds = editor.getShapeGeometry(lastShape).bounds
            
            // Try to place to the right of the last shape
            let newX = lastShapeBounds.maxX + 20
            let newY = lastShapeBounds.y
            
            // Check if this position would overlap with any existing shapes
            const wouldOverlap = allShapes.some((existingShape: any) => {
              if (existingShape.id === lastShape.id) return false
              
              const existingBounds = editor.getShapeGeometry(existingShape).bounds
              return (
                newX < existingBounds.maxX + 10 &&
                newX + shapeWidth > existingBounds.x - 10 &&
                newY < existingBounds.maxY + 10 &&
                newY + shapeHeight > existingBounds.y - 10
              )
            })
            
            if (wouldOverlap) {
              // If right placement overlaps, try below the last shape
              newX = lastShapeBounds.x
              newY = lastShapeBounds.maxY + 20
              
              // Check for overlap again
              const wouldOverlapBelow = allShapes.some((existingShape: any) => {
                if (existingShape.id === lastShape.id) return false
                
                const existingBounds = editor.getShapeGeometry(existingShape).bounds
                return (
                  newX < existingBounds.maxX + 10 &&
                  newX + shapeWidth > existingBounds.x - 10 &&
                  newY < existingBounds.maxY + 10 &&
                  newY + shapeHeight > existingBounds.y - 10
                )
              })
              
              if (wouldOverlapBelow) {
                // If both positions overlap, place diagonally to the right and below
                newX = lastShapeBounds.maxX + 20
                newY = lastShapeBounds.maxY + 20
              }
            }
            
            return { x: newX, y: newY }
          }
          
          // Create a container for all shape buttons
          const buttonContainer = document.createElement('div')
          buttonContainer.style.cssText = `
            position: absolute;
            top: 70px;
            left: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          `
          
          // Database Shape Button
          const dbButton = document.createElement('button')
          dbButton.textContent = 'Add Database Shape'
          dbButton.style.cssText = `
            background: #007bff;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          `
          dbButton.addEventListener('click', () => {
            const position = findGoodPosition('database', 80, 100)
            editor.createShape({
              type: 'database',
              x: position.x,
              y: position.y,
              props: {
                w: 80,
                h: 100,
                color: 'green'
              }
            })
          })
          
          // Server Shape Button
          const serverButton = document.createElement('button')
          serverButton.textContent = 'Add Server Shape'
          serverButton.style.cssText = `
            background: #6c757d;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          `
          serverButton.addEventListener('click', () => {
            const position = findGoodPosition('server', 120, 80)
            editor.createShape({
              type: 'server',
              x: position.x,
              y: position.y,
              props: {
                w: 120,
                h: 80,
                color: 'gray'
              }
            })
          })
          
          // User Shape Button
          const userButton = document.createElement('button')
          userButton.textContent = 'Add User Shape'
          userButton.style.cssText = `
            background: #28a745;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          `
          userButton.addEventListener('click', () => {
            const position = findGoodPosition('user', 60, 80)
            editor.createShape({
              type: 'user',
              x: position.x,
              y: position.y,
              props: {
                w: 60,
                h: 80,
                color: 'blue'
              }
            })
          })
          
          // LLM Shape Button
          const llmButton = document.createElement('button')
          llmButton.textContent = 'Add LLM Shape'
          llmButton.style.cssText = `
            background: #6f42c1;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          `
          llmButton.addEventListener('click', () => {
            const position = findGoodPosition('llm', 100, 80)
            editor.createShape({
              type: 'llm',
              x: position.x,
              y: position.y,
              props: {
                w: 100,
                h: 80,
                color: 'purple'
              }
            })
          })
          
          // Add all buttons to the container
          buttonContainer.appendChild(dbButton)
          buttonContainer.appendChild(serverButton)
          buttonContainer.appendChild(userButton)
          buttonContainer.appendChild(llmButton)
          
          document.body.appendChild(buttonContainer)
        }}
      />
    </div>
  )
}
