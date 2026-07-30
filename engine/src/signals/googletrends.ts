import { classify } from '../model.js'
import type { TrendSignal } from '../types.js'
import { getJson } from './http.js'

/**
 * Google's unofficial daily-trends JSON endpoint (the one pytrends wraps).
 * Unofficial = can break without notice; the runner treats every source as
 * optional, so a breakage here degrades the brief instead of killing it.
 */

interface DailyTrendsResponse {
  default: {
    trendingSearchesDays: {
      trendingSearches: {
        title: { query: string }
        formattedTraffic: string
        articles?: { title: string; url: string }[]
      }[]
    }[]
  }
}

/** "200K+" → 200000; "1M+" → 1000000. */
export function parseTraffic(formatted: string): number {
  const m = formatted.match(/([\d.]+)\s*([KM]?)/i)
  if (!m || !m[1]) return 0
  const base = parseFloat(m[1])
  const unit = (m[2] ?? '').toUpperCase()
  return base * (unit === 'M' ? 1_000_000 : unit === 'K' ? 1_000 : 1)
}

export async function fetchGoogleTrends(geo = 'US'): Promise<TrendSignal[]> {
  const res = await getJson<DailyTrendsResponse>(
    `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=240&geo=${geo}`,
  )
  const days = res.default.trendingSearchesDays
  const today = days[0]
  if (!today) return []
  return today.trendingSearches.map((t, i) => ({
    source: 'googletrends' as const,
    id: `gtrends-${t.title.query.replace(/\W+/g, '-').toLowerCase()}`,
    title: t.title.query,
    url: t.articles?.[0]?.url,
    category: classify(`${t.title.query} ${t.articles?.[0]?.title ?? ''}`),
    // The endpoint reports "today"; assume mid-cycle. Rank order on the
    // page reflects recency/heat, so earlier items get a fresher estimate.
    ageHours: 6 + i * 0.5,
    engagement: parseTraffic(t.formattedTraffic),
    accelerating: i < 5,
  }))
}
