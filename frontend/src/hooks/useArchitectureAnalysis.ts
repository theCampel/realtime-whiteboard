import { useCallback, useState, useRef } from 'react'

interface ArchitectureSuggestion {
  id: string
  title: string
  description: string
  component_type: 'database' | 'person' | 'server' | 'llm'
  reasoning: string
  connections?: Array<{
    to_component_id: string
    direction: 'from' | 'to' | 'bidirectional'
    description: string
  }>
}

interface UseArchitectureAnalysisState {
  suggestions: ArchitectureSuggestion[]
  isAnalyzing: boolean
  lastAnalysis: Date | null
  error: string | null
  analyzeDiagram: () => Promise<void>
  dismissSuggestion: (id: string) => void
  clearSuggestions: () => void
  setEditor: (editor: any) => void
}

export function useArchitectureAnalysis(apiKey: string): UseArchitectureAnalysisState {
  const [suggestions, setSuggestions] = useState<ArchitectureSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<any>(null)

  const setEditor = useCallback((editor: any) => {
    editorRef.current = editor
  }, [])

  const extractDiagramData = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return null

    try {
      // Get all shapes from the editor
      const shapes = editor.getCurrentPageShapes()
      
      const components: Array<{
        type: string
        id: string
        position: { x: number; y: number }
        size: { w: number; h: number }
        color?: string
      }> = []

      const connections: Array<{
        from: string
        to: string
        id: string
      }> = []

      shapes.forEach((shape: any) => {
        if (shape.type === 'arrow') {
          // Extract connection information
          const fromShape = shapes.find((s: any) => {
            const center = { x: s.x + (s.props?.w || 0) / 2, y: s.y + (s.props?.h || 0) / 2 }
            const startPoint = shape.props?.start
            return startPoint && Math.abs(center.x - startPoint.x) < 50 && Math.abs(center.y - startPoint.y) < 50
          })
          
          const toShape = shapes.find((s: any) => {
            const center = { x: s.x + (s.props?.w || 0) / 2, y: s.y + (s.props?.h || 0) / 2 }
            const endPoint = shape.props?.end
            return endPoint && Math.abs(center.x - endPoint.x) < 50 && Math.abs(center.y - endPoint.y) < 50
          })

          if (fromShape && toShape) {
            connections.push({
              from: fromShape.id,
              to: toShape.id,
              id: shape.id
            })
          }
        } else if (['database', 'user', 'server', 'llm'].includes(shape.type)) {
          // Extract component information
          components.push({
            type: shape.type,
            id: shape.id,
            position: { x: shape.x, y: shape.y },
            size: { w: shape.props?.w || 0, h: shape.props?.h || 0 },
            color: shape.props?.color
          })
        }
      })

      return { components, connections }
    } catch (e) {
      console.error('Error extracting diagram data:', e)
      return null
    }
  }, [])

  const analyzeDiagram = useCallback(async () => {
    console.log('🔍 analyzeDiagram called with:', { apiKey: apiKey ? apiKey.slice(0, 10) + '...' : 'none', isAnalyzing })
    
    if (!apiKey) {
      console.log('❌ No API key available')
      return
    }
    
    if (isAnalyzing) {
      console.log('⏳ Already analyzing, skipping')
      return
    }

    console.log('✅ Starting diagram analysis...')
    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('📊 Extracting diagram data...')
      const diagramData = extractDiagramData()
      console.log('📊 Diagram data extracted:', diagramData)
      
      if (!diagramData || diagramData.components.length === 0) {
        console.log('📊 No components found, skipping analysis')
        setSuggestions([])
        setLastAnalysis(new Date())
        return
      }

      const prompt = `Analyze this architecture and suggest 1-2 missing components:

Components: ${JSON.stringify(diagramData.components.map(c => ({ 
  type: c.type, 
  id: c.id.split(':')[1] || c.id
})), null, 2)}
Connections: ${JSON.stringify(diagramData.connections.map(c => ({ 
  from: c.from.split(':')[1] || c.from, 
  to: c.to.split(':')[1] || c.to 
})), null, 2)}

Return JSON format:
[
  {
    "title": "Cache",
    "description": "Speed up data access",
    "component_type": "database",
    "reasoning": "Reduce database load",
    "connections": [
      {
        "to_component_id": "existing_id",
        "direction": "to",
        "description": "Caches data from DB"
      }
    ]
  }
]

Keep titles under 15 chars, descriptions under 25 chars, reasoning under 20 chars. Use actual component IDs. Return [] if complete.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', response.status, response.statusText, errorText)
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      console.log('Response:', response)

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      console.log('Content:', content)

      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const jsonStr = jsonMatch ? jsonMatch[0] : content
        const suggestionsData = JSON.parse(jsonStr)

        // Validate and add IDs to suggestions
        const validSuggestions: ArchitectureSuggestion[] = suggestionsData
          .filter((s: any) => s.title && s.description && s.component_type && s.reasoning)
          .map((s: any) => ({
            ...s,
            id: `suggestion_${Date.now()}_${Math.random().toString(36).slice(2)}`
          }))

        console.log('Valid suggestions:', validSuggestions)

        setSuggestions(validSuggestions)
        setLastAnalysis(new Date())
      } catch (parseError) {
        console.error('Error parsing suggestions:', parseError, 'Content:', content)
        throw new Error('Invalid response format from analysis')
      }

    } catch (e: any) {
      console.error('Architecture analysis error:', e)
      setError(`Analysis failed: ${e.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }, [apiKey, isAnalyzing, extractDiagramData])

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    suggestions,
    isAnalyzing,
    lastAnalysis,
    error,
    analyzeDiagram,
    dismissSuggestion,
    clearSuggestions,
    setEditor
  }
}
