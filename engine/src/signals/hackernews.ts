import { classify } from '../model.js'
import type { TrendSignal } from '../types.js'
import { getJson, hoursSince } from './http.js'

/** HN front page via the public Algolia API (no key required). */

interface AlgoliaResponse {
  hits: {
    objectID: string
    title: string | null
    url: string | null
    points: number | null
    num_comments: number | null
    created_at_i: number
  }[]
}

export async function fetchHackerNews(hitsPerPage = 30): Promise<TrendSignal[]> {
  const res = await getJson<AlgoliaResponse>(
    `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${hitsPerPage}`,
  )
  return res.hits
    .filter((h) => h.title)
    .map((h) => ({
      source: 'hackernews' as const,
      id: `hn-${h.objectID}`,
      title: h.title as string,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      category: classify(h.title as string),
      ageHours: hoursSince(h.created_at_i * 1000),
      engagement: h.points ?? 0,
      comments: h.num_comments ?? 0,
    }))
}
