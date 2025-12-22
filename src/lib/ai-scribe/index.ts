/**
 * AI Scribe Library - Index
 * 
 * Exports all AI Scribe functionality and registers providers
 */

import { registerProvider, getProvider, getDefaultProvider, listProviders } from './ai-provider'
import { openAIProvider } from './openai-provider'
import { bastionGPTProvider } from './bastiongpt-provider'

// Register available providers on module load
registerProvider(openAIProvider)
registerProvider(bastionGPTProvider)

// Re-export types and functions
export * from './ai-provider'
export { openAIProvider, OpenAIProvider } from './openai-provider'
export { bastionGPTProvider, BastionGPTProvider, createBastionGPTProvider } from './bastiongpt-provider'

// Export provider management
export { registerProvider, getProvider, getDefaultProvider, listProviders }

/**
 * Get configured AI provider based on environment
 */
export function getScribeProvider() {
    const providerName = process.env.AI_SCRIBE_PROVIDER || 'openai'
    return getProvider(providerName)
}
