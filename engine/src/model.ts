import type { LifecycleStage, ScoredTrend, TrendCategory, TrendSignal } from './types.js'

/**
 * Trend model: turns raw signals into ranked "waves".
 *
 * Every platform formula in equations.ts rewards the same underlying thing:
 * engagement velocity early in an item's life (HN divides by age^1.8, Reddit
 * charges a vote-order-of-magnitude per ~12.5h, TikTok promotes batch-by-batch
 * on per-view ratios). So the trend model ranks by velocity percentile and
 * stages each trend on a lifecycle curve to find the pre-peak window.
 */

const CATEGORY_KEYWORDS: Record<Exclude<TrendCategory, 'other'>, string[]> = {
  design: [
    'design', 'designer', 'ui', 'ux', 'font', 'typography', 'logo', 'brand',
    'portfolio', 'figma', 'css', 'animation', '3d', 'three.js', 'webgl',
    'aesthetic', 'layout', 'rebrand', 'color palette',
  ],
  webdev: [
    'website', 'web dev', 'webdev', 'frontend', 'front-end', 'react', 'javascript',
    'typescript', 'html', 'tailwind', 'nextjs', 'vite', 'lighthouse', 'page speed',
    'hosting', 'domain', 'wordpress', 'shopify', 'squarespace', 'wix', 'landing page',
  ],
  ai: [
    'ai', 'artificial intelligence', 'gpt', 'chatgpt', 'claude', 'llm', 'copilot',
    'midjourney', 'generative', 'machine learning', 'openai', 'anthropic', 'automation',
  ],
  smallbiz: [
    'small business', 'local business', 'entrepreneur', 'startup', 'founder',
    'freelance', 'client', 'side hustle', 'salon', 'restaurant', 'cafe', 'storefront',
  ],
  marketing: [
    'marketing', 'seo', 'google ranking', 'social media', 'content', 'viral',
    'instagram', 'tiktok', 'engagement', 'ads', 'conversion', 'email list', 'branding',
  ],
  culture: [
    'trend', 'meme', 'challenge', 'sound', 'aesthetic core', 'nostalgia', 'pop culture',
  ],
}

/** How well each category converts into thenowdesigns content (0–1). */
export const NICHE_RELEVANCE: Record<TrendCategory, number> = {
  design: 1.0,
  webdev: 0.9,
  ai: 0.85,
  smallbiz: 0.8,
  marketing: 0.75,
  culture: 0.45,
  other: 0.2,
}

export function classify(title: string): TrendCategory {
  const t = title.toLowerCase()
  let best: TrendCategory = 'other'
  let bestHits = 0
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = keywords.filter((k) => t.includes(k)).length
    if (hits > bestHits) {
      bestHits = hits
      best = category as TrendCategory
    }
  }
  return best
}

export function velocityOf(signal: TrendSignal): number {
  // Clamp age so brand-new items don't get an infinite velocity, mirroring
  // HN's (age + 2) smoothing.
  return signal.engagement / Math.max(signal.ageHours, 0.5)
}

/**
 * Lifecycle staging from a single snapshot. Without a time series we
 * approximate the growth curve position from age + velocity + whether the
 * source itself flags acceleration (rising endpoints).
 */
export function stageOf(signal: TrendSignal, velocity: number): LifecycleStage {
  if (signal.ageHours <= 8 && (signal.accelerating || velocity >= 20)) return 'emerging'
  if (signal.ageHours <= 24) return signal.accelerating || velocity >= 10 ? 'surging' : 'peaking'
  if (signal.ageHours <= 48) return 'peaking'
  return 'saturated'
}

const STAGE_WINDOW: Record<LifecycleStage, string> = {
  emerging: 'Post within 12–24h — you are ahead of the wave.',
  surging: 'Post within 24–48h — wave is building, room to ride.',
  peaking: 'Post today with a fresh angle, or skip — the wave is cresting.',
  saturated: 'Skip or subvert — only a contrarian take survives here.',
}

const STAGE_MULTIPLIER: Record<LifecycleStage, number> = {
  emerging: 1.0,
  surging: 0.9,
  peaking: 0.55,
  saturated: 0.25,
}

/**
 * Score a batch of signals into ranked waves. Momentum is the velocity
 * percentile within the batch (robust across sources whose absolute
 * engagement numbers aren't comparable).
 */
export function scoreTrends(signals: TrendSignal[]): ScoredTrend[] {
  if (signals.length === 0) return []

  const withVelocity = signals.map((s) => ({ signal: s, velocity: velocityOf(s) }))
  const sortedVelocities = [...withVelocity.map((w) => w.velocity)].sort((a, b) => a - b)

  const percentile = (v: number): number => {
    if (sortedVelocities.length === 1) return 100
    let below = 0
    for (const sv of sortedVelocities) if (sv < v) below++
    return (below / (sortedVelocities.length - 1)) * 100
  }

  return withVelocity
    .map(({ signal, velocity }) => {
      const momentum = percentile(velocity)
      const relevance = NICHE_RELEVANCE[signal.category]
      const stage = stageOf(signal, velocity)
      const waveScore = momentum * relevance * STAGE_MULTIPLIER[stage]
      return {
        ...signal,
        velocity: Math.round(velocity * 10) / 10,
        momentum: Math.round(momentum),
        relevance,
        stage,
        waveScore: Math.round(waveScore),
        window: STAGE_WINDOW[stage],
      }
    })
    .sort((a, b) => b.waveScore - a.waveScore)
}
