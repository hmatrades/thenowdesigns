import { classify } from '../model.js'
import type { TrendSignal } from '../types.js'
import { getJson, hoursSince } from './http.js'

/**
 * Reddit's public JSON endpoints (no auth needed at low volume).
 * /rising surfaces posts whose hot-rank is accelerating — the closest free
 * proxy to "catch it before it peaks".
 */

const SUBREDDITS = [
  'web_design',
  'webdev',
  'graphic_design',
  'smallbusiness',
  'Entrepreneur',
  'marketing',
  'InternetIsBeautiful',
]

interface RedditListing {
  data: {
    children: {
      data: {
        id: string
        title: string
        permalink: string
        subreddit: string
        ups: number
        num_comments: number
        created_utc: number
      }
    }[]
  }
}

export async function fetchReddit(limitPerSub = 8): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = []
  for (const sub of SUBREDDITS) {
    const listing = await getJson<RedditListing>(
      `https://www.reddit.com/r/${sub}/rising.json?limit=${limitPerSub}`,
    )
    for (const child of listing.data.children) {
      const p = child.data
      signals.push({
        source: 'reddit',
        id: `reddit-${p.id}`,
        title: p.title,
        url: `https://www.reddit.com${p.permalink}`,
        category: classify(`${p.title} ${p.subreddit}`),
        ageHours: hoursSince(p.created_utc * 1000),
        engagement: p.ups,
        comments: p.num_comments,
        accelerating: true,
      })
    }
  }
  return signals
}
