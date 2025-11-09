# Speech-to-Whiteboard Drawing

Transform your spoken words into visual architecture diagrams in real-time using OpenAI's Realtime API and tldraw.

## 🎯 What It Does

Speak naturally about system architecture (e.g., "Draw a database at position 100, 200, then draw a server at 400, 200, and connect them") and watch as your words are instantly transformed into visual diagrams on an interactive whiteboard.

## ✨ Features

### 🎤 Voice-Controlled Diagramming
- **Real-time speech recognition** using OpenAI's Realtime API
- **Natural language processing** - just describe what you want
- **Instant visual feedback** - shapes appear as you speak
- **Smart connections** - automatically creates arrows between components

### 🎨 Custom Architecture Components
- **Database** - Cylinder with stacked disks (green)
- **Server** - 3D server rack (gray)
- **User/Person** - Stick figure (blue)
- **GPT-5/LLM** - Neural network brain (purple)
- **Frontend** - Browser window mockup (red)
- **GPT Realtime** - Audio waveform visualization (blue)

### 🤖 AI-Powered Suggestions
- Automatically analyzes your architecture diagrams
- Suggests missing components based on best practices
- One-click to add suggested components with connections
- Helps you build complete, well-architected systems

## 🏗️ Architecture

This is a **browser-only** application that connects directly to OpenAI's Realtime API:

```
User Speech → Browser (MediaRecorder API)
    ↓
OpenAI Realtime API (WebRTC connection)
    ↓
Speech-to-Text + Intent Understanding
    ↓
Tool Calls (draw_item, connect, delete_item, add_text)
    ↓
tldraw Canvas Updates (shapes and arrows rendered)
    ↓
Architecture Analysis (GPT-5-mini via Chat Completions API)
    ↓
AI Suggestions Popup (optional enhancements)
```

**Key Technologies:**
- **Frontend**: React + TypeScript
- **Whiteboard**: tldraw SDK
- **Voice AI**: OpenAI Realtime API (direct browser connection)
- **Suggestions**: OpenAI Chat Completions API (GPT-4o)
- **Schema Validation**: Zod

## 📁 Project Structure

```
/whiteboard
├── frontend/                   # React application
│   ├── src/
│   │   ├── App.tsx            # Router with landing page
│   │   ├── Whiteboard.tsx     # Main whiteboard component
│   │   ├── hooks/
│   │   │   ├── useOpenAIRealtime.ts      # Voice control via OpenAI Realtime API
│   │   │   └── useArchitectureAnalysis.ts # AI-powered suggestions
│   │   ├── components/
│   │   │   ├── SuggestionsPopup.tsx      # Architecture suggestions UI
│   │   │   └── ui/                       # Custom shape components
│   │   │       ├── DatabaseShape.tsx
│   │   │       ├── ServerShape.tsx
│   │   │       ├── UserShape.tsx
│   │   │       ├── LLMShape.tsx
│   │   │       ├── FrontendShape.tsx
│   │   │       └── GPTRealtimeShape.tsx
│   │   ├── index.css          # Global styles + shape color variables
│   │   └── main.tsx           # Application entry point
│   ├── token.ts               # Ephemeral token generator script
│   ├── package.json           # Dependencies
│   └── vite.config.ts         # Vite configuration
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **OpenAI API Key** (with Realtime API access)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd whiteboard
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables (optional)**
   
   If you want to use the AI architecture suggestion feature, create a file named `frontend/.env` and add your OpenAI API key:
   ```env
   VITE_OPENAI_API_KEY=sk-proj-...
   ```

### Running the Application

1. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Click "Get Started" on the landing page
   - A popup will appear asking for your OpenAI API key.
   - Paste your `sk-proj-...` key and click "Connect".
   - Allow microphone access when prompted.
   - Start speaking your architecture!

## 🎯 How to Use

### Voice Commands

The AI agent understands natural language. Here are some example phrases:

**Drawing Components:**
- "Draw a database at position 200, 300"
- "Add a server at 500, 200"
- "Put a user at 100, 400"
- "Create a GPT-5 model at 800, 300"
- "Draw a frontend at 300, 100"
- "Add GPT Realtime at 600, 400"

**Creating Connections:**
- "Connect the database to the server" (after drawing both)
- "Draw a one-way connection from user to frontend"
- "Make a two-way connection between server and GPT-5"

**Managing Shapes:**
- "Delete the database"
- "Remove the server"

**Adding Text:**
- "Add text 'API Layer' at position 400, 150"
- "Write 'Authentication Flow' at 250, 500"

### AI Suggestions Feature

After you add components via voice:
1. The system automatically analyzes your diagram (after 11 seconds)
2. Suggestions appear in the popup on the right
3. Click "Add to Diagram" to accept a suggestion
4. The component and its connections are added automatically
5. A new analysis runs after adding suggested components

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Generate ephemeral token
npm run generate-token
```

### Project Configuration

- **TypeScript**: Strict mode enabled
- **Vite**: Development server on port 3000
- **React**: v18 with React Router for navigation
- **Linting**: ESLint with TypeScript and React rules

## 🎨 Customization

### Adding New Shape Types

1. **Create a new shape utility** in `frontend/src/components/ui/`:
   ```typescript
   import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape } from 'tldraw'
   
   export type MyShape = TLBaseShape<'myshape', { w: number; h: number; color: string }>
   
   export class MyShapeUtil extends BaseBoxShapeUtil<MyShape> {
     static override type = 'myshape' as const
     getDefaultProps() { return { w: 100, h: 100, color: 'blue' } }
     component(shape: MyShape) { /* SVG rendering */ }
     indicator(shape: MyShape) { /* Selection indicator */ }
   }
   ```

2. **Register in Whiteboard.tsx**:
   ```typescript
   import { MyShapeUtil } from './components/ui/MyShape'
   
   <Tldraw shapeUtils={[..., MyShapeUtil]} />
   ```

3. **Add to useOpenAIRealtime.ts** tool definition:
   - Update the `item_type` enum in `drawItem` tool
   - Add mapping in `shapeTypeMap`
   - Define dimensions and color

4. **Add CSS variables** in `index.css`:
   ```css
   --myshape-primary: 200 70% 50%;
   ```

### Modifying the AI Agent

Edit the `SYSTEM_PROMPT` in `frontend/src/hooks/useOpenAIRealtime.ts` to change:
- Agent personality and behavior
- Available item types
- Instruction style
- Response patterns

### Customizing Suggestions

Modify `useArchitectureAnalysis.ts` to:
- Change the analysis prompt
- Adjust suggestion frequency
- Add new component types
- Modify the GPT-5-mini model or parameters

## 🔐 Security Notes

- **Ephemeral tokens** are short-lived (60 seconds) and provide temporary access
- **API keys** should never be committed to version control
- The `.env` file is gitignored by default
- Tokens are entered by users at runtime, not hardcoded

## 🎓 Technical Deep Dive

### How Voice Commands Become Shapes

1. **Audio Capture**: Browser's MediaRecorder captures microphone input
2. **Direct Streaming**: Audio streams to OpenAI Realtime API via WebRTC
3. **Transcription**: OpenAI converts speech to text in real-time
4. **Intent Understanding**: RealtimeAgent processes text and identifies tool calls
5. **Tool Execution**: Browser-side tools manipulate the tldraw editor
6. **Canvas Update**: tldraw rerenders with new shapes/connections

### Tool Call Examples

When you say "Draw a database at 100, 200":
```javascript
drawItem.execute({ 
  item_type: 'database', 
  x: 100, 
  y: 200 
})
```

This creates:
```javascript
{
  id: 'shape:uuid-here',
  type: 'database',
  x: 100,
  y: 200,
  props: { w: 160, h: 200, color: 'green' }
}
```

### Connection Geometry

The system uses smart edge point calculation:
- **Rectangular shapes** (server, gpt_realtime): Uses `edgePointRect()` for precise edge connections
- **Elliptical shapes** (database, user, llm, frontend): Uses `edgePointEllipse()` for curved edge connections
- Arrows automatically bind to shapes and follow them when moved

## 🐛 Troubleshooting

**"Connection failed: Invalid ephemeral token"**
- Ensure token starts with `ek_`
- Tokens expire after 60 seconds - generate a new one
- Check your OpenAI API key has Realtime API access

**"No API key available" in console**
- Set `VITE_OPENAI_API_KEY` in `frontend/.env`
- This is only needed for the suggestions feature
- Voice commands work without this

**Microphone not working**
- Check browser permissions (must allow microphone access)
- Ensure you clicked "Connect" and token is valid
- Look for errors in browser console

**Shapes not appearing**
- Check the browser console for errors
- Verify the AI understood your command (look for tool call logs)
- Try more explicit coordinates: "Draw a database at position 200, 300"

## 📝 License

This is a hackathon/demo project. Use as you see fit!

## 🙏 Acknowledgments

- **OpenAI** - Realtime API and Agents SDK
- **tldraw** - Excellent whiteboard library
- **React** - UI framework

## 🔮 Future Ideas

- [ ] Save/load diagrams
- [ ] Multi-user collaboration
- [ ] Export diagrams as SVG/PNG
- [ ] More shape types (cache, queue, load balancer, etc.)
- [ ] Voice-controlled shape editing (move, resize, recolor)
- [ ] Automatic layout optimization
- [ ] Diagram templates
