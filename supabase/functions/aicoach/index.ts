import { corsHeaders } from '../_shared/cors.ts'

interface FitnessRequest {
  text?: string
  previousPhotoUrl?: string
  currentPhotoUrl?: string
  goal?: string
  userProfile?: {
    age?: number
    gender?: string
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
    experience?: string
    injuries?: string[]
  }
}

interface OpenAIMessage {
  role: 'user' | 'system'
  content: (
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  )[]
}

// Enhanced fitness instruction with more specific guidelines
const getFitnessInstruction = (userProfile?: FitnessRequest['userProfile']) => {
  let baseInstruction = `You are an expert fitness progress coach and certified personal trainer. Your role is to provide professional, evidence-based fitness analysis and advice.

ANALYSIS GUIDELINES:
- Use objective, professional language focused on fitness metrics
- Observe posture, muscle definition, body composition, symmetry, and form
- Avoid comments about attractiveness, beauty, or personal appearance
- Focus on health, strength, and functional fitness improvements
- Be encouraging while providing honest, constructive feedback

ADVICE STRUCTURE:
- Provide specific, actionable recommendations
- Include exercise suggestions with proper form cues
- Suggest nutrition principles when relevant
- Consider progression and sustainability
- Address any visible imbalances or areas for improvement`

  if (userProfile) {
    if (userProfile.fitnessLevel) {
      baseInstruction += `\n- User fitness level: ${userProfile.fitnessLevel} - tailor advice accordingly`
    }
    if (userProfile.injuries && userProfile.injuries.length > 0) {
      baseInstruction += `\n- Consider these injuries/limitations: ${userProfile.injuries.join(', ')}`
    }
    if (userProfile.age) {
      baseInstruction += `\n- User age: ${userProfile.age} - provide age-appropriate advice`
    }
  }

  return baseInstruction
}

const buildPrompt = (request: FitnessRequest): string => {
  const { text, previousPhotoUrl, currentPhotoUrl, goal, userProfile } = request
  const fitnessInstruction = getFitnessInstruction(userProfile)
  
  // Progress comparison prompt
  if (previousPhotoUrl && currentPhotoUrl) {
    if (text && /compare|difference|progress|change/i.test(text)) {
      return `${fitnessInstruction}

TASK: Compare the two progress photos and provide detailed feedback:

1. **Progress Analysis**: Describe observable changes in:
   - Muscle definition and size
   - Body composition and fat distribution
   - Posture and alignment
   - Overall physique development

2. **Strengths Assessment**: Highlight areas showing good progress

3. **Improvement Areas**: Identify body parts or aspects needing attention

4. **Training Recommendations**: 
   - Specific exercises for weak points
   - Training split suggestions
   - Intensity and volume recommendations

5. **Nutrition Guidance**: General principles to support goals

6. **Next Steps**: Clear action plan for continued progress

${goal ? `\nUser's Goal: ${goal}` : ''}
${text ? `\nUser's Question: ${text}` : ''}`
    }
  }

  // Single photo analysis prompt
  if (currentPhotoUrl) {
    return `${fitnessInstruction}

TASK: Analyze the current fitness photo and provide comprehensive feedback:

1. **Current Assessment**: Evaluate:
   - Muscle development and definition
   - Body composition
   - Posture and structural balance
   - Overall fitness indicators

2. **Strengths**: Areas that look well-developed

3. **Development Opportunities**: Areas with potential for improvement

4. **Training Program**: Specific recommendations for:
   - Exercise selection
   - Training frequency
   - Progressive overload strategies

5. **Form and Technique**: Any visible form corrections needed

6. **Goal-Specific Advice**: Tailored recommendations

${goal ? `\nUser's Goal: ${goal}` : ''}
${text ? `\nUser's Question: ${text}` : ''}`
  }

  // Text-only prompt
  return `${fitnessInstruction}

Please provide expert fitness advice based on the user's question.

${goal ? `User's Goal: ${goal}\n` : ''}
User's Question: ${text || 'Please provide general fitness guidance.'}`
}

const validateRequest = (request: FitnessRequest): { valid: boolean; error?: string } => {
  if (!request.text && !request.currentPhotoUrl) {
    return { valid: false, error: 'Either text or photo must be provided' }
  }

  // Validate URLs if provided
  if (request.previousPhotoUrl && !isValidUrl(request.previousPhotoUrl)) {
    return { valid: false, error: 'Invalid previous photo URL' }
  }

  if (request.currentPhotoUrl && !isValidUrl(request.currentPhotoUrl)) {
    return { valid: false, error: 'Invalid current photo URL' }
  }

  return { valid: true }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const buildMessages = (request: FitnessRequest): OpenAIMessage[] => {
  const prompt = buildPrompt(request)
  const { previousPhotoUrl, currentPhotoUrl } = request

  const content: OpenAIMessage['content'] = [{ type: 'text', text: prompt }]

  if (previousPhotoUrl) {
    content.push({ type: 'image_url', image_url: { url: previousPhotoUrl } })
  }

  if (currentPhotoUrl) {
    content.push({ type: 'image_url', image_url: { url: currentPhotoUrl } })
  }

  return [{ role: 'user', content }]
}

const callOpenAI = async (messages: OpenAIMessage[], apiKey: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Consider upgrading to gpt-4o for better image analysis
      messages,
      max_tokens: 1500, // Increased for more detailed responses
      temperature: 0.7, // Slightly creative but consistent
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

// @ts-ignore: Deno remote import for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Validate API key exists
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse and validate request
    let requestData: FitnessRequest
    try {
      requestData = await req.json()
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const validation = validateRequest(requestData)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build messages and call OpenAI
    const messages = buildMessages(requestData)
    const openaiResponse = await callOpenAI(messages, OPENAI_API_KEY)

    // Extract response
    const feedback = openaiResponse.choices?.[0]?.message?.content
    if (!feedback) {
      throw new Error('No response content from OpenAI')
    }

    // Log successful request (remove in production or make configurable)
    console.log(`Fitness analysis completed: ${requestData.currentPhotoUrl ? 'with photo' : 'text-only'}`)

    return new Response(
      JSON.stringify({ 
        feedback,
        metadata: {
          hasPhotos: !!(requestData.previousPhotoUrl || requestData.currentPhotoUrl),
          isComparison: !!(requestData.previousPhotoUrl && requestData.currentPhotoUrl),
          goal: requestData.goal || null
        }
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    // Return different error messages based on error type
    let errorMessage = 'Internal server error'
    let statusCode = 500

    if (error.message.includes('OpenAI API error')) {
      errorMessage = 'AI service temporarily unavailable'
      statusCode = 503
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error - please try again'
      statusCode = 503
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})