import type { TrendSignal } from '../types.js'
import { FIXTURE_SIGNALS } from './fixtures.js'
import { fetchGoogleTrends } from './googletrends.js'
import { fetchHackerNews } from './hackernews.js'
import { fetchReddit } from './reddit.js'

export interface SignalCollection {
  signals: TrendSignal[]
  sourcesUsed: string[]
  sourcesFailed: string[]
}

/**
 * Collect signals from every source, tolerating individual failures —
 * a broken unofficial endpoint degrades the brief rather than killing it.
 * If EVERY live source fails (or offline is requested), fall back to the
 * fixture snapshot so the pipeline still produces a brief.
 */
export async function collectSignals(offline = false): Promise<SignalCollection> {
  if (offline) {
    return { signals: FIXTURE_SIGNALS, sourcesUsed: ['fixture'], sourcesFailed: [] }
  }

  const sources: { name: string; fetch: () => Promise<TrendSignal[]> }[] = [
    { name: 'reddit', fetch: fetchReddit },
    { name: 'hackernews', fetch: () => fetchHackerNews() },
    { name: 'googletrends', fetch: () => fetchGoogleTrends() },
  ]

  const signals: TrendSignal[] = []
  const sourcesUsed: string[] = []
  const sourcesFailed: string[] = []

  const results = await Promise.allSettled(sources.map((s) => s.fetch()))
  results.forEach((result, i) => {
    const source = sources[i]
    if (!source) return
    if (result.status === 'fulfilled' && result.value.length > 0) {
      signals.push(...result.value)
      sourcesUsed.push(source.name)
    } else {
      sourcesFailed.push(source.name)
    }
  })

  if (signals.length === 0) {
    return {
      signals: FIXTURE_SIGNALS,
      sourcesUsed: ['fixture'],
      sourcesFailed,
    }
  }

  return { signals, sourcesUsed, sourcesFailed }
}
