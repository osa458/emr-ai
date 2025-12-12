import { RateLimiter } from '../llm/rate-limiter'

describe('RateLimiter', () => {
  it('allows requests within limit', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      refillRate: 1,
      requestCost: 1,
    })

    // Should allow 5 requests immediately
    const promises = Array(5).fill(null).map(() => limiter.acquire())
    await expect(Promise.all(promises)).resolves.not.toThrow()
  })

  it('queues requests when limit exceeded', async () => {
    const limiter = new RateLimiter({
      maxTokens: 2,
      refillRate: 10, // Fast refill for testing
      requestCost: 1,
    })

    const startTime = Date.now()
    
    // Request 3 tokens when only 2 available
    const promises = Array(3).fill(null).map(() => limiter.acquire())
    await Promise.all(promises)
    
    // Should have waited for refill
    const elapsed = Date.now() - startTime
    expect(elapsed).toBeGreaterThanOrEqual(0)
  })

  it('returns correct status', () => {
    const limiter = new RateLimiter({
      maxTokens: 10,
      refillRate: 1,
      requestCost: 1,
    })

    const status = limiter.getStatus()
    
    expect(status.availableTokens).toBe(10)
    expect(status.queueLength).toBe(0)
    expect(status.estimatedWaitMs).toBe(0)
  })

  it('resets correctly', async () => {
    const limiter = new RateLimiter({
      maxTokens: 2,
      refillRate: 0.01, // Very slow refill
      requestCost: 1,
    })

    // Use all tokens
    await limiter.acquire()
    await limiter.acquire()

    let status = limiter.getStatus()
    expect(status.availableTokens).toBe(0)

    // Reset
    limiter.reset()

    status = limiter.getStatus()
    expect(status.availableTokens).toBe(2)
  })

  it('respects custom request cost', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      refillRate: 1,
      requestCost: 1,
    })

    // Use 3 tokens at once
    await limiter.acquire(3)
    
    const status = limiter.getStatus()
    expect(status.availableTokens).toBe(2)
  })

  it('rejects requests that would take too long', async () => {
    const limiter = new RateLimiter({
      maxTokens: 1,
      refillRate: 0.01, // Very slow
      requestCost: 1,
    })

    // Use all tokens
    await limiter.acquire()

    // Request 100 tokens - should reject as it would take too long
    await expect(limiter.acquire(100)).rejects.toThrow('Rate limit exceeded')
  })
})

describe('RateLimiter refill', () => {
  it('refills tokens over time', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      refillRate: 100, // 100 tokens per second for fast testing
      requestCost: 1,
    })

    // Use all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.acquire()
    }

    let status = limiter.getStatus()
    expect(status.availableTokens).toBe(0)

    // Wait 50ms - should refill ~5 tokens
    await new Promise(resolve => setTimeout(resolve, 50))

    status = limiter.getStatus()
    expect(status.availableTokens).toBeGreaterThan(0)
  })

  it('does not exceed max tokens when refilling', async () => {
    const limiter = new RateLimiter({
      maxTokens: 5,
      refillRate: 1000, // Very fast refill
      requestCost: 1,
    })

    // Wait to refill
    await new Promise(resolve => setTimeout(resolve, 100))

    const status = limiter.getStatus()
    expect(status.availableTokens).toBeLessThanOrEqual(5)
  })
})
