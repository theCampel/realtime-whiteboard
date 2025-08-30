from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from .mapping import get_shape_definition, get_connection_definition

app = FastAPI(title="Whiteboard Backend", description="Speech-to-whiteboard drawing API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/test-draw/{item_type}/{item_name}")
async def test_draw_item(item_type: str, item_name: str):
    """Test endpoint to simulate a tool call and return the shape definition."""
    shape = get_shape_definition(item_type, item_name, position=(200, 150))
    return {
        "type": "draw_item",
        "shape": shape
    }


@app.get("/test-connect/{item1}/{item2}")
async def test_connect_items(item1: str, item2: str):
    """Test endpoint to simulate a tool call for connecting two items."""
    arrow = get_connection_definition(item1, item2)
    return {
        "type": "draw_connection",
        "arrow": arrow
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time audio streaming and drawing commands."""
    await websocket.accept()
    try:
        while True:
            # Receive commands from frontend
            data = await websocket.receive_text()
            
            try:
                # Try to parse as JSON command
                command = json.loads(data)
                print(f"Received command: {command}")
                
                # For testing, just echo the command back
                # In the real implementation, this would process audio and call the agent
                await websocket.send_text(json.dumps(command))
                
            except json.JSONDecodeError:
                # Handle non-JSON messages (like simple text)
                print(f"Received text: {data}")
                await websocket.send_text(f"Echo: {data}")
                
    except WebSocketDisconnect:
        print("Client disconnected")
