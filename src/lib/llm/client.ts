import OpenAI from 'openai'
import { z } from 'zod'
import { getLLMRateLimiter, getRateLimiterStatus } from './rate-limiter'

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export interface LLMRequestOptions {
  systemPrompt: string
  userPrompt: string
  outputSchema?: z.ZodSchema
  model?: string
  temperature?: number
  maxTokens?: number
  retries?: number
}

export interface LLMResponse<T> {
  data: T
  usage: {
    inputTokens: number
    outputTokens: number
  }
  latencyMs: number
}

export async function llmRequest<T>(
  options: LLMRequestOptions
): Promise<LLMResponse<T>> {
  // Acquire rate limit token before making request
  const rateLimiter = getLLMRateLimiter()
  await rateLimiter.acquire()

  const startTime = Date.now()

  const {
    systemPrompt,
    userPrompt,
    outputSchema,
    model = 'gpt-4-turbo-preview',
    temperature = 0.3,
    maxTokens = 4000,
    retries = 3,
  } = options

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      })

      const latencyMs = Date.now() - startTime
      const content = response.choices[0]?.message?.content || '{}'

      let parsed: T
      try {
        const json = JSON.parse(content)

        if (outputSchema) {
          parsed = outputSchema.parse(json) as T
        } else {
          parsed = json as T
        }
      } catch (parseError) {
        console.error('Failed to parse LLM response:', content)
        throw new Error(`LLM response parsing failed: ${parseError}`)
      }

      return {
        data: parsed,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
        latencyMs,
      }
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a rate limit error from OpenAI
      if (error instanceof OpenAI.RateLimitError) {
        console.warn(`Rate limit hit, attempt ${attempt}/${retries}. Waiting...`)
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
      
      // For other errors, throw immediately
      throw error
    }
  }

  throw lastError || new Error('LLM request failed after retries')

}

// Mock LLM for development without API key
export async function mockLLMRequest<T>(
  mockResponse: T
): Promise<LLMResponse<T>> {
  // Simulate latency
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    data: mockResponse,
    usage: {
      inputTokens: 100,
      outputTokens: 200,
    },
    latencyMs: 500,
  }
}

// Export rate limiter status for monitoring
export { getRateLimiterStatus }
