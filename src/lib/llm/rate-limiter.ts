/**
 * Token Bucket Rate Limiter for LLM API calls
 * Prevents exceeding API rate limits and provides graceful handling
 */

interface RateLimiterConfig {
  maxTokens: number        // Maximum tokens in bucket
  refillRate: number       // Tokens added per second
  requestCost: number      // Default cost per request
}

interface RateLimiterState {
  tokens: number
  lastRefill: number
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxTokens: 10,           // Allow burst of 10 requests
  refillRate: 1,           // 1 request per second sustained
  requestCost: 1,          // Each request costs 1 token
}

class RateLimiter {
  private config: RateLimiterConfig
  private state: RateLimiterState
  private queue: Array<{
    resolve: () => void
    reject: (error: Error) => void
    cost: number
  }> = []
  private processing = false

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = {
      tokens: this.config.maxTokens,
      lastRefill: Date.now(),
    }
  }

  private refillTokens(): void {
    const now = Date.now()
    const timePassed = (now - this.state.lastRefill) / 1000
    const tokensToAdd = timePassed * this.config.refillRate
    
    this.state.tokens = Math.min(
      this.config.maxTokens,
      this.state.tokens + tokensToAdd
    )
    this.state.lastRefill = now
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      this.refillTokens()
      
      const next = this.queue[0]
      if (this.state.tokens >= next.cost) {
        this.state.tokens -= next.cost
        this.queue.shift()
        next.resolve()
      } else {
        // Wait for tokens to refill
        const tokensNeeded = next.cost - this.state.tokens
        const waitTime = (tokensNeeded / this.config.refillRate) * 1000
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)))
      }
    }

    this.processing = false
  }

  async acquire(cost: number = this.config.requestCost): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if request would exceed maximum wait time (30s)
      const maxWaitTokens = this.config.refillRate * 30
      if (cost > maxWaitTokens + this.state.tokens) {
        reject(new Error('Rate limit exceeded: request would take too long'))
        return
      }

      this.queue.push({ resolve, reject, cost })
      this.processQueue()
    })
  }

  getStatus(): {
    availableTokens: number
    queueLength: number
    estimatedWaitMs: number
  } {
    this.refillTokens()
    
    const queueCost = this.queue.reduce((sum, item) => sum + item.cost, 0)
    const tokensNeeded = Math.max(0, queueCost - this.state.tokens)
    const estimatedWaitMs = (tokensNeeded / this.config.refillRate) * 1000

    return {
      availableTokens: Math.floor(this.state.tokens),
      queueLength: this.queue.length,
      estimatedWaitMs: Math.ceil(estimatedWaitMs),
    }
  }

  reset(): void {
    this.state = {
      tokens: this.config.maxTokens,
      lastRefill: Date.now(),
    }
    this.queue = []
  }
}

// Singleton instance for LLM rate limiting
let llmRateLimiter: RateLimiter | null = null

export function getLLMRateLimiter(): RateLimiter {
  if (!llmRateLimiter) {
    // Configure based on OpenAI's rate limits
    // GPT-4: ~10,000 TPM for most tiers, we'll be conservative
    llmRateLimiter = new RateLimiter({
      maxTokens: 5,          // Burst of 5 concurrent requests
      refillRate: 0.5,       // ~30 requests per minute sustained
      requestCost: 1,
    })
  }
  return llmRateLimiter
}

export function getRateLimiterStatus() {
  return getLLMRateLimiter().getStatus()
}

export { RateLimiter }
export type { RateLimiterConfig }
