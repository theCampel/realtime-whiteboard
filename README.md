# Speech-to-Whiteboard Drawing

A real-time hackathon project that converts speech into whiteboard drawings using OpenAI's real-time API and tldraw.

## 🎯 Project Vision

Speak naturally about system architecture (e.g., "Add a database connected to the API server") and watch as your words are transformed into visual diagrams on a collaborative whiteboard in real-time.

## 🏗️ Architecture Overview

### System Flow
1. **Audio Capture**: Frontend captures microphone audio using the MediaRecorder API
2. **Real-time Streaming**: Audio is streamed to the backend via WebSocket connection
3. **Speech Processing**: Backend uses OpenAI's real-time API for speech-to-text transcription
4. **Intent Understanding**: OpenAI Agent (using openai-agents SDK) processes the transcribed text and identifies drawing commands
5. **Tool Execution**: Agent calls tools like `draw_item("database", "db1")` when it detects relevant speech
6. **Shape Mapping**: Backend maps abstract items to concrete tldraw shape definitions
7. **Canvas Updates**: Drawing commands are sent back to frontend and rendered on the tldraw canvas

### Technology Stack

**Frontend:**
- React + TypeScript
- tldraw SDK for the whiteboard canvas
- WebSocket for real-time communication
- MediaRecorder API for audio capture

**Backend:**
- Python + FastAPI
- openai-agents SDK for AI agent orchestration
- WebSocket server for real-time communication
- OpenAI real-time API for speech-to-text

## 📁 Project Structure

```
/whiteboard
├── backend/                    # Python backend service
│   ├── pyproject.toml         # Python dependencies and config
│   └── src/whiteboard_api/
│       ├── __init__.py
│       ├── main.py            # FastAPI app with WebSocket endpoint
│       ├── agent.py           # OpenAI Agent setup and tool definitions
│       ├── mapping.py         # Maps item types to tldraw shapes
│       └── stream_processor.py # Audio processing pipeline
├── frontend/                   # React frontend application
│   ├── package.json           # Node.js dependencies
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── Whiteboard.tsx     # tldraw canvas with controls
│   │   └── hooks/
│   │       └── useRealtime.ts # WebSocket connection and audio streaming
│   └── public/
├── pyproject.toml             # Root workspace configuration
└── README.md                  # This file
```

## 🔄 Data Flow Between Components

### Frontend → Backend
- **Audio Stream**: Raw audio data captured from microphone → WebSocket → Backend
- **Connection Management**: WebSocket lifecycle events (connect/disconnect/error)

### Backend → Frontend  
- **Drawing Commands**: JSON objects describing tldraw operations
  ```json
  {
    "type": "draw_item",
    "shape": { /* tldraw shape definition */ }
  }
  ```
- **Status Updates**: Connection status, processing state, error messages

### Backend Internal Flow
1. **WebSocket Handler** receives audio data
2. **AudioStreamProcessor** sends audio to OpenAI real-time API
3. **OpenAI Agent** processes transcribed text and calls tools
4. **Tool Functions** (`draw_item`, `remove_item`, `draw_connection`) execute
5. **Shape Mapper** converts abstract items to tldraw JSON
6. **WebSocket Handler** sends drawing commands back to frontend

### Frontend Internal Flow
1. **useRealtime Hook** manages WebSocket connection and audio capture
2. **MediaRecorder** captures audio and streams via WebSocket
3. **Whiteboard Component** receives drawing commands from WebSocket
4. **tldraw Editor** renders shapes and connections on canvas

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- OpenAI API key

### Setup Instructions

1. **Install Python dependencies:**
   ```bash
   uv sync --all-packages --all-extras
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

4. **Run the backend:**
   ```bash
   uv run fastapi dev projects/backend/src/backend/main.py
   ```

5. **Run the frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser to:** `http://localhost:3000`

## 🎯 Hackathon Development Plan

### Milestone 1: Basic Infrastructure (First 2-3 hours)
- **Person A (Backend)**: Set up FastAPI with WebSocket endpoint that echoes messages
- **Person B (Frontend)**: Set up React + tldraw with WebSocket connection
- **Person C (Research)**: Investigate MediaRecorder API and OpenAI real-time audio formats

### Milestone 2: Core Pipeline (Next 3-4 hours)  
- **Person A (Backend)**: Implement binary audio handling and hardcoded drawing commands
- **Person B (Frontend)**: Implement audio capture/streaming and shape rendering
- **Person C (Agent)**: Create agent tools and basic shape mappings

### Milestone 3: Full Integration (Final 2-3 hours)
- **Person A (Backend)**: Integrate OpenAI Agents SDK with audio pipeline
- **Person B (Frontend)**: Polish UI and implement all drawing command types
- **Person C (Agent)**: Expand shape library and refine agent instructions

## 🔧 Key Integration Points

### WebSocket Message Format
```typescript
// Frontend → Backend (Audio)
type AudioMessage = {
  type: 'audio_chunk'
  data: ArrayBuffer  // Raw audio data
}

// Backend → Frontend (Commands)
type DrawingCommand = 
  | { type: 'draw_item', shape: TldrawShape }
  | { type: 'remove_item', shapeId: string }
  | { type: 'draw_connection', arrow: TldrawArrow }
  | { type: 'status', message: string }
```

### Agent Tool Interface
```python
# Tools that the OpenAI Agent can call
def draw_item(item_type: str, unique_name: str) -> dict
def remove_item(unique_name: str) -> dict  
def draw_connection(item1: str, item2: str) -> dict
```

### Shape Mapping Examples
```python
# mapping.py converts these:
"database" → tldraw ellipse (blue)
"server" → tldraw rectangle (green)  
"user" → tldraw ellipse (orange)
```

## 🎤 Why WebSockets Over WebRTC?

For this hackathon project, WebSockets are the clear choice:

- **Simplicity**: WebSocket implementation takes minutes, WebRTC setup takes hours
- **Architecture Fit**: Our flow is client→server→client, not peer-to-peer
- **Infrastructure**: WebSockets need no additional servers; WebRTC requires STUN/TURN servers
- **Performance**: The AI processing time (hundreds of ms) dwarfs any network latency differences

## 🛠️ Development Commands

```bash
# Backend development
uv run fastapi dev backend/src/whiteboard_api/main.py

# Frontend development  
cd frontend && npm run dev

# Install new Python packages
uv add package-name --project backend

# Install new Node packages
cd frontend && npm install package-name
```

## 🎨 Extending the System

- **Add new shapes**: Update `mapping.py` with new item types
- **Improve agent**: Modify prompts and tools in `agent.py`
- **Enhanced UI**: Customize the tldraw interface in `Whiteboard.tsx`
- **Better audio**: Experiment with audio preprocessing in `useRealtime.ts`