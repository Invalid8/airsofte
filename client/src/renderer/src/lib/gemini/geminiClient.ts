import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_STORAGE_KEY = 'airsofte_gemini_key'
const GEMINI_CACHE_KEY = 'airsofte_gemini_cache'

export type GeminiFeature = 'mission_generator' | 'tactical_advisor' | 'story_narrator'

type CachedContent = {
  feature: GeminiFeature
  prompt: string
  response: string
  timestamp: number
}

class GeminiClient {
  private static instance: GeminiClient
  private genAI: GoogleGenerativeAI | null = null
  private isEnabled: boolean = false
  private apiKey: string | null = null

  private constructor() {
    this.loadApiKey()
  }

  static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      GeminiClient.instance = new GeminiClient()
    }
    return GeminiClient.instance
  }

  private loadApiKey(): void {
    try {
      const stored = localStorage.getItem(GEMINI_STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.setApiKey(data.key)
      }
    } catch (e) {
      console.error('Failed to load Gemini API key:', e)
    }
  }

  setApiKey(key: string): boolean {
    try {
      this.apiKey = key
      this.genAI = new GoogleGenerativeAI(key)
      this.isEnabled = true

      localStorage.setItem(GEMINI_STORAGE_KEY, JSON.stringify({ key, enabled: true }))
      return true
    } catch (e) {
      console.error('Failed to set Gemini API key:', e)
      return false
    }
  }

  clearApiKey(): void {
    this.apiKey = null
    this.genAI = null
    this.isEnabled = false
    localStorage.removeItem(GEMINI_STORAGE_KEY)
  }

  isActive(): boolean {
    return this.isEnabled && this.genAI !== null
  }

  async generateContent(
    feature: GeminiFeature,
    prompt: string,
    options?: {
      useCache?: boolean
      temperature?: number
      maxOutputTokens?: number
    }
  ): Promise<string | null> {
    if (!this.isActive() || !this.genAI) {
      console.warn('Gemini is not enabled. Please set an API key.')
      return null
    }

    if (options?.useCache) {
      const cached = this.getCachedResponse(feature, prompt)
      if (cached) {
        console.log('Using cached Gemini response')
        return cached
      }
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 2000
        }
      })

      const result = await model.generateContent(prompt)
      const response = result.response.text()

      if (options?.useCache) {
        this.cacheResponse(feature, prompt, response)
      }

      return response
    } catch (error) {
      console.error('Gemini API error:', error)
      return null
    }
  }

  private getCachedResponse(feature: GeminiFeature, prompt: string): string | null {
    try {
      const cached = localStorage.getItem(GEMINI_CACHE_KEY)
      if (!cached) return null

      const cache: CachedContent[] = JSON.parse(cached)
      const found = cache.find((item) => item.feature === feature && item.prompt === prompt)

      if (found) {
        const hoursSinceCache = (Date.now() - found.timestamp) / (1000 * 60 * 60)
        if (hoursSinceCache < 24) {
          return found.response
        }
      }

      return null
    } catch (e) {
      console.error('Cache read error:', e)
      return null
    }
  }

  private cacheResponse(feature: GeminiFeature, prompt: string, response: string): void {
    try {
      const cached = localStorage.getItem(GEMINI_CACHE_KEY)
      let cache: CachedContent[] = cached ? JSON.parse(cached) : []

      cache = cache.filter((item) => {
        const hoursSinceCache = (Date.now() - item.timestamp) / (1000 * 60 * 60)
        return hoursSinceCache < 24
      })

      cache.push({
        feature,
        prompt,
        response,
        timestamp: Date.now()
      })

      if (cache.length > 50) {
        cache = cache.slice(-50)
      }

      localStorage.setItem(GEMINI_CACHE_KEY, JSON.stringify(cache))
    } catch (e) {
      console.error('Cache write error:', e)
    }
  }

  clearCache(): void {
    localStorage.removeItem(GEMINI_CACHE_KEY)
  }

  getCacheStats(): { count: number; oldestTimestamp: number | null } {
    try {
      const cached = localStorage.getItem(GEMINI_CACHE_KEY)
      if (!cached) return { count: 0, oldestTimestamp: null }

      const cache: CachedContent[] = JSON.parse(cached)
      return {
        count: cache.length,
        oldestTimestamp: cache.length > 0 ? Math.min(...cache.map((c) => c.timestamp)) : null
      }
    } catch {
      return { count: 0, oldestTimestamp: null }
    }
  }
}

export const geminiClient = GeminiClient.getInstance()
