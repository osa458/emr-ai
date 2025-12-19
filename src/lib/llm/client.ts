import OpenAI from 'openai'
import { z } from 'zod'
import { getLLMRateLimiter, getRateLimiterStatus } from './rate-limiter'

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 second timeout
      maxRetries: 0, // We handle retries ourselves
    })
  }
  return openaiClient
}

// Retry configuration
interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  jitterFactor: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.2,
}

// Calculate delay with exponential backoff and jitter
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)
  const jitter = cappedDelay * config.jitterFactor * (Math.random() - 0.5) * 2
  return Math.floor(cappedDelay + jitter)
}

// Check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.RateLimitError) return true
  if (error instanceof OpenAI.APIConnectionError) return true
  if (error instanceof OpenAI.InternalServerError) return true
  if (error instanceof OpenAI.APIError) {
    const status = error.status
    // Retry on 429 (rate limit), 500, 502, 503, 504
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
  }
  // Retry on network errors
  if (error instanceof Error && error.message.includes('ECONNRESET')) return true
  if (error instanceof Error && error.message.includes('ETIMEDOUT')) return true
  return false
}

// Get error message for logging
function getErrorMessage(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    return `OpenAI API Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
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

  const retryConfig = DEFAULT_RETRY_CONFIG
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

      // Log successful request
      if (attempt > 1) {
        console.log(`LLM request succeeded on attempt ${attempt}/${retries}`)
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
      const errorMsg = getErrorMessage(error)
      
      // Check if error is retryable
      if (isRetryableError(error) && attempt < retries) {
        const delay = calculateBackoffDelay(attempt, retryConfig)
        console.warn(
          `LLM request failed (attempt ${attempt}/${retries}): ${errorMsg}. ` +
          `Retrying in ${delay}ms...`
        )
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Non-retryable error or exhausted retries
      console.error(
        `LLM request failed after ${attempt} attempt(s): ${errorMsg}`
      )
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
