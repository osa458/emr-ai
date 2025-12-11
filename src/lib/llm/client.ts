import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface LLMRequestOptions {
  systemPrompt: string
  userPrompt: string
  outputSchema?: z.ZodSchema
  model?: string
  temperature?: number
  maxTokens?: number
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
  const startTime = Date.now()

  const {
    systemPrompt,
    userPrompt,
    outputSchema,
    model = 'gpt-4-turbo-preview',
    temperature = 0.3,
    maxTokens = 4000,
  } = options

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  const response = await openai.chat.completions.create({
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
  } catch (error) {
    console.error('Failed to parse LLM response:', content)
    throw new Error(`LLM response parsing failed: ${error}`)
  }

  return {
    data: parsed,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
    latencyMs,
  }
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
